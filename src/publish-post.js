const fs = require('fs');
const { config } = require('./config');
const { openAuthenticatedSession, log } = require('./auth');

function buildThumbnailHtml() {
  if (!config.blog.thumbnailUrl) return '';
  return `<div style="text-align:center;margin:0 0 32px;"><img src="${config.blog.thumbnailUrl}" alt="thumbnail" style="max-width:100%;border-radius:12px;" /></div>`;
}

function composeContent(post) {
  return `${buildThumbnailHtml()}${post.content}`;
}

async function doPost(page, post, fullContent) {
  log('✍️ 제목 입력...');
  const titleInput = await page.$('#post-title-inp');
  if (!titleInput) throw new Error('제목 입력창을 찾지 못했습니다. 셀렉터가 바뀌었을 수 있습니다.');
  await titleInput.click();
  await titleInput.fill(post.title);
  await page.waitForTimeout(500);

  log('📝 본문 입력...');
  const editorFrame = page.frameLocator('#editor-tistory_ifr');
  await editorFrame.locator('body').waitFor({ timeout: 10000 });
  await editorFrame.locator('body').evaluate((body, html) => {
    body.innerHTML = html;
  }, fullContent);

  await page.evaluate(() => {
    const editor = globalThis.tinymce?.get('editor-tistory');
    if (editor) editor.undoManager.add();
  });
  await page.waitForTimeout(1000);

  log(`📁 카테고리: ${post.category}`);
  try {
    await page.click('#category-btn');
    await page.waitForTimeout(1000);
    await page.evaluate((categoryName) => {
      const items = document.querySelectorAll('#category-list [role="option"]');
      for (const item of items) {
        if (item.textContent?.trim() === categoryName) {
          item.click();
          return;
        }
      }
      for (const item of items) {
        if (item.textContent?.trim().replace(/\s/g, '').includes(categoryName.replace(/\s/g, ''))) {
          item.click();
          return;
        }
      }
    }, post.category);
    await page.waitForTimeout(500);
  } catch (error) {
    log(`⚠️ 카테고리 선택 실패: ${error.message}`);
  }

  log('🏷️ 태그 입력...');
  try {
    const tagInput = await page.$('#tagText');
    const tagList = Array.isArray(post.tags) ? post.tags : [];
    if (tagInput) {
      for (const tag of tagList.slice(0, 12)) {
        await tagInput.click();
        await tagInput.fill('');
        await page.keyboard.type(tag, { delay: 40 });
        await page.waitForTimeout(250);
        await tagInput.press('Enter');
        await page.waitForTimeout(250);
      }
    }
  } catch (error) {
    log(`⚠️ 태그 입력 실패: ${error.message}`);
  }

  log('🚀 발행 중...');
  await page.click('#publish-layer-btn');
  await page.waitForTimeout(2000);

  if ((post.visibility || 'public') === 'private') {
    log('🔒 비공개 설정...');
    await page.click('#open0');
  } else {
    log('🔓 공개 설정...');
    await page.click('#open20');
  }

  await page.waitForTimeout(1000);
  await page.click('#publish-btn');
  await page.waitForTimeout(3000);
  log(`✅ Published! URL: ${page.url()}`);
  return page.url();
}

async function publishPostFromFile(filePath = config.paths.tempPost, options = {}) {
  const post = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  log(`Posting: ${post.title}`);

  const { browser, page, loginMode } = await openAuthenticatedSession({
    headed: Boolean(options.headed),
    allowManualFallback: true
  });

  try {
    log(`🔐 인증 모드: ${loginMode}`);
    const fullContent = composeContent(post);
    return await doPost(page, post, fullContent);
  } finally {
    await browser.close();
  }
}

module.exports = { publishPostFromFile, composeContent, doPost };
