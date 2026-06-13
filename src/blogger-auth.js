const fs = require('fs');
const { chromium } = require('playwright');
const { config } = require('./config');

function log(message) {
  const time = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  console.log(`[${time}] ${message}`);
}

async function saveBloggerState(context, page) {
  const state = await context.storageState();
  fs.writeFileSync(config.paths.bloggerAuthState, JSON.stringify(state, null, 2));
  const cookies = await context.cookies();
  fs.writeFileSync(config.paths.bloggerCookies, JSON.stringify(cookies, null, 2));
  log(`🔐 Blogger 인증 상태 저장 완료 (${cookies.length} cookies)`);
}

async function isLoggedIn(page) {
  await page.goto(config.blogger.newPostUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  const url = page.url();
  return url.includes('blogger.com/blog/post/edit') && !url.includes('accounts.google.com');
}

async function promptManualLogin(page) {
  log('🟡 Google/Blogger 수동 로그인이 필요합니다. 열린 브라우저에서 로그인을 완료해 주세요.');
  await page.goto(config.blogger.newPostUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForURL(url => url.toString().includes('blogger.com/blog/post/edit'), { timeout: 180000 });
}

async function openBloggerSession({ headed = false, allowManualFallback = true } = {}) {
  let browser = await chromium.launch({ headless: !headed, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  let context = fs.existsSync(config.paths.bloggerAuthState)
    ? await browser.newContext({ storageState: config.paths.bloggerAuthState })
    : await browser.newContext();
  let page = await context.newPage();

  if (await isLoggedIn(page)) {
    await page.goto(config.blogger.newPostUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    return { browser, context, page, loginMode: 'saved-state' };
  }

  await context.close().catch(() => {});
  await browser.close().catch(() => {});

  if (!allowManualFallback) {
    throw new Error('Blogger 저장된 세션이 없거나 만료되었습니다. headed 모드로 다시 시도하세요.');
  }

  browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  context = await browser.newContext();
  page = await context.newPage();
  await promptManualLogin(page);
  await saveBloggerState(context, page);
  await page.goto(config.blogger.newPostUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  return { browser, context, page, loginMode: 'manual-fallback' };
}

module.exports = { openBloggerSession, log };
