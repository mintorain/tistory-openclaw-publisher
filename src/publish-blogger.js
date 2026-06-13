const fs = require('fs');
const { config } = require('./config');
const { openBloggerSession, log } = require('./blogger-auth');

async function switchToHtmlMode(page) {
  const htmlToggleSelectors = [
    'button[aria-label*="HTML"]',
    'button[data-tooltip*="HTML"]',
    '[role="button"][aria-label*="HTML"]'
  ];

  for (const selector of htmlToggleSelectors) {
    const handle = await page.$(selector);
    if (handle) {
      await handle.click();
      await page.waitForTimeout(1200);
      return true;
    }
  }

  return await page.evaluate(() => {
    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const button of buttons) {
      const label = `${button.textContent || ''} ${button.getAttribute('aria-label') || ''} ${button.getAttribute('data-tooltip') || ''}`;
      if (/html/i.test(label)) {
        button.click();
        return true;
      }
    }
    return false;
  });
}

async function fillTitle(page, title) {
  const selectors = [
    '[aria-label="제목"]',
    '[aria-label="Title"]',
    '[placeholder="제목"]',
    '.post-title-container input',
    'input[spellcheck="false"]'
  ];

  for (const selector of selectors) {
    const handle = await page.$(selector);
    if (handle) {
      await handle.click({ clickCount: 3 }).catch(() => {});
      await handle.fill(title).catch(async () => {
        await page.evaluate(({ selector: innerSelector, innerTitle }) => {
          const el = document.querySelector(innerSelector);
          if (el) {
            el.value = innerTitle;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, { selector, innerTitle: title });
      });
      return true;
    }
  }

  return false;
}

async function fillHtmlContent(page, html) {
  return await page.evaluate(content => {
    const textarea = document.querySelector('textarea') || document.querySelector('.post-body textarea');
    if (textarea) {
      textarea.value = content;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      return 'textarea';
    }

    const editor = document.querySelector('[contenteditable="true"][role="textbox"]') || document.querySelector('[contenteditable="true"]');
    if (editor) {
      editor.innerHTML = content;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      return 'contenteditable';
    }

    return '';
  }, html);
}

async function fillLabels(page, tags) {
  const tagString = Array.isArray(tags) ? tags.join(', ') : String(tags || '');
  if (!tagString) return;

  await page.evaluate(labelText => {
    const maybeOpen = Array.from(document.querySelectorAll('button, [role="button"]')).find(button => {
      const text = `${button.textContent || ''} ${button.getAttribute('aria-label') || ''}`;
      return /라벨|labels/i.test(text);
    });
    if (maybeOpen) maybeOpen.click();
  }, tagString);
  await page.waitForTimeout(1000);

  const success = await page.evaluate(labelText => {
    const input = document.querySelector('input[aria-label*="라벨"]')
      || document.querySelector('input[aria-label*="Label"]')
      || document.querySelector('input[placeholder*="라벨"]')
      || document.querySelector('.label-input input')
      || Array.from(document.querySelectorAll('input')).find(el => /라벨|labels/i.test(`${el.getAttribute('aria-label') || ''} ${el.placeholder || ''}`));

    if (!input) return false;
    input.focus();
    input.value = labelText;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, tagString);

  if (success) {
    await page.keyboard.press('Enter').catch(() => {});
    await page.waitForTimeout(800);
  }
}

async function clickPublish(page) {
  const publishClicked = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const button of buttons) {
      const text = (button.textContent || '').trim();
      const label = button.getAttribute('aria-label') || '';
      if (/게시|발행|publish/i.test(`${text} ${label}`)) {
        button.click();
        return true;
      }
    }
    return false;
  });

  if (!publishClicked) throw new Error('Blogger 발행 버튼을 찾지 못했습니다.');
  await page.waitForTimeout(2500);

  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button, [role="button"]');
    for (const button of buttons) {
      const text = (button.textContent || '').trim();
      const label = button.getAttribute('aria-label') || '';
      if (/확인|게시|발행|publish|confirm/i.test(`${text} ${label}`)) {
        button.click();
        return true;
      }
    }
    return false;
  });
}

async function publishBloggerFromFile(filePath = config.paths.tempPost, options = {}) {
  const post = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  log(`Blogger posting: ${post.title}`);

  if (!config.blogger.blogId) {
    throw new Error('BLOGGER_BLOG_ID 환경변수가 필요합니다.');
  }

  const { browser, page, loginMode } = await openBloggerSession({
    headed: Boolean(options.headed),
    allowManualFallback: true
  });

  try {
    log(`🔐 Blogger 인증 모드: ${loginMode}`);
    await page.goto(config.blogger.newPostUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    log('🔄 HTML 모드 전환...');
    const htmlMode = await switchToHtmlMode(page);
    if (!htmlMode) {
      throw new Error('Blogger HTML 모드 전환에 실패했습니다.');
    }

    log('✍️ 제목 입력...');
    const titleOk = await fillTitle(page, post.title);
    if (!titleOk) throw new Error('Blogger 제목 입력창을 찾지 못했습니다.');
    await page.waitForTimeout(800);

    log('📝 본문 입력...');
    const contentMode = await fillHtmlContent(page, post.content);
    if (!contentMode) throw new Error('Blogger 본문 입력 영역을 찾지 못했습니다.');
    await page.waitForTimeout(1200);

    log('🏷️ 라벨 입력...');
    await fillLabels(page, post.tags || []);

    log('🚀 Blogger 발행 중...');
    await clickPublish(page);
    await page.waitForTimeout(4000);

    const finalUrl = config.blogger.blogUrl || page.url();
    log(`✅ Blogger published! URL: ${finalUrl}`);
    return finalUrl;
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = { publishBloggerFromFile };
