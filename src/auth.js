const { chromium } = require('playwright');
const fs = require('fs');
const { config } = require('./config');

const LOGIN_URL = 'https://www.tistory.com/auth/login';
const MANAGE_URL = `https://${config.blog.slug}.tistory.com/manage`;
const NEWPOST_URL = `https://${config.blog.slug}.tistory.com/manage/newpost`;

function log(message) {
  const time = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  console.log(`[${time}] ${message}`);
}

async function saveAuthState(context) {
  const state = await context.storageState();
  fs.writeFileSync(config.paths.authState, JSON.stringify(state, null, 2));
  fs.writeFileSync(config.paths.cookies, JSON.stringify(state.cookies || [], null, 2));
  log(`🔐 인증 상태 저장 완료 (${state.cookies?.length || 0} cookies)`);
}

async function isLoggedIn(page) {
  await page.goto(MANAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  const url = page.url();
  return url.includes('/manage') && !url.includes('auth/login') && !url.includes('accounts.kakao.com');
}

async function tryAutoLogin(page) {
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.click('a.btn_login.link_kakao_id');
  await page.waitForSelector('input[name="loginId"]', { timeout: 15000 });
  await page.fill('input[name="loginId"]', config.blog.loginEmail);
  await page.fill('input[name="password"]', config.blog.loginPassword);

  try {
    const keepSignedIn = await page.$('label[for*="saveSignedIn"]');
    if (keepSignedIn) await keepSignedIn.click();
  } catch {}

  await page.click('button.btn_g.highlight.submit');
  await page.waitForTimeout(6000);

  if (page.url().includes('accounts.kakao.com') || page.url().includes('auth/login')) {
    throw new Error('자동 로그인 후에도 추가 인증 단계가 남아 있습니다. --headed로 다시 시도하세요.');
  }
}

async function promptManualLogin(page) {
  log('🟡 자동 로그인 실패. 브라우저를 열어 수동 로그인을 기다립니다.');
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.waitForURL(url => url.toString().includes('/manage'), { timeout: 180000 });
}

async function openAuthenticatedSession({ headed = false, allowManualFallback = true, targetUrl = NEWPOST_URL } = {}) {
  let browser = await chromium.launch({ headless: !headed, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  let context = fs.existsSync(config.paths.authState)
    ? await browser.newContext({ storageState: config.paths.authState })
    : await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      });
  let page = await context.newPage();

  if (await isLoggedIn(page)) {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    return { browser, context, page, loginMode: 'saved-state' };
  }

  await context.close();
  await browser.close();

  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  });
  page = await context.newPage();

  try {
    log('🔄 저장된 세션이 없거나 만료되어 자동 로그인을 시도합니다.');
    await tryAutoLogin(page);
    if (!(await isLoggedIn(page))) throw new Error('자동 로그인 후 티스토리 관리 화면 접근에 실패했습니다.');
    await saveAuthState(context);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    return { browser, context, page, loginMode: 'auto-login' };
  } catch (error) {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});

    if (!allowManualFallback) throw error;

    browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    });
    page = await context.newPage();
    await promptManualLogin(page);
    await saveAuthState(context);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    return { browser, context, page, loginMode: 'manual-fallback' };
  }
}

module.exports = { LOGIN_URL, MANAGE_URL, NEWPOST_URL, log, openAuthenticatedSession };
