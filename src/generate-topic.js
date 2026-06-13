const { chat } = require('./llm');
const { config } = require('./config');

function inferCategory(topic) {
  const normalized = String(topic || '').toLowerCase();
  if (/claude|claude code|claude cli|mcp|agent/.test(normalized)) return '클로드코드';
  if (/openclaw|오픈클로|게이트웨이|cron|크론|skill|스킬/.test(normalized)) return '오픈클로';
  if (/cursor|antigravity|vibe|바이브코딩|ai 코딩/.test(normalized)) return '바이브코딩';
  if (/chatgpt|gemini|openai|anthropic|ai 뉴스|ai 동향/.test(normalized)) return '최신AI동향';
  if (/geo|seo|검색엔진|생성형엔진/.test(normalized)) return 'GEO 마케팅';
  if (/전자책|pod|출판|강사|마케팅/.test(normalized)) return '전자출판·교육마케팅';
  return '최신AI동향';
}

function normalizeTags(tags) {
  return [...new Set((tags || []).map(tag => String(tag).trim()).filter(Boolean))].slice(0, 10);
}

function buildAuthorCard() {
  const website = config.blog.siteUrl
    ? `<a href="${config.blog.siteUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#1e40af;color:#fff;text-decoration:none;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:600;">🌐 사이트</a>`
    : '';
  const phone = config.blog.phone
    ? `<a href="tel:${config.blog.phone}" style="display:inline-flex;align-items:center;gap:6px;background:#0ea5e9;color:#fff;text-decoration:none;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:600;">📞 ${config.blog.phone}</a>`
    : '';

  return `
<hr style="margin:48px 0;border:none;border-top:2px solid #e2e8f0;"/>
<div style="background:linear-gradient(135deg,#f8faff 0%,#eff6ff 100%);border:1px solid #dbeafe;border-radius:16px;padding:28px 32px;margin:32px 0;">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#1e40af,#0ea5e9);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">✍️</div>
    <div>
      <p style="margin:0;font-size:19px;font-weight:800;color:#1e3a8a;">${config.blog.authorName}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#0ea5e9;font-weight:600;">${config.blog.authorRole}</p>
    </div>
  </div>
  <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.8;">${config.blog.authorBio}</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;">${website}${phone}</div>
</div>`;
}

function buildCtaBox() {
  const badges = config.blog.ctaBadges
    .map(badge => `<span style="background:rgba(255,255,255,0.2);border-radius:20px;padding:6px 14px;font-size:14px;">✅ ${badge}</span>`)
    .join('');
  const website = config.blog.siteUrl
    ? `📌 <a href="${config.blog.siteUrl}" target="_blank" style="color:#bfdbfe;font-weight:700;">${config.blog.siteUrl}</a>`
    : '';
  const phone = config.blog.phone
    ? ` &nbsp;|&nbsp; 📞 <a href="tel:${config.blog.phone}" style="color:#bfdbfe;font-weight:700;">${config.blog.phone}</a>`
    : '';

  return `
<div style="background:linear-gradient(135deg,#1e40af,#0ea5e9);border-radius:16px;padding:28px;margin:36px 0;color:#fff;">
<h3 style="color:#fff;margin:0 0 16px;font-size:20px;">🎓 ${config.blog.ctaTitle}</h3>
<p style="color:#bfdbfe;margin:0 0 16px;font-size:15px;">${config.blog.ctaText}</p>
<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;">${badges}</div>
<p style="margin:0;font-size:15px;">${website}${phone}</p>
</div>`;
}

async function generateTopicPost({ topic, category, tags = [], visibility }) {
  if (!topic) throw new Error('topic이 필요합니다.');

  const chosenCategory = category || inferCategory(topic);
  const today = new Date().toLocaleDateString('ko-KR');

  const metaPrompt = `오늘(${today}) 발행할 티스토리 블로그 글 메타데이터를 JSON으로 작성하세요.\n주제: ${topic}\n카테고리: ${chosenCategory}\n조건:\n- 한국어만 사용\n- 제목은 클릭하고 싶지만 과장되지 않게\n- summary는 2문장\n- tags는 6~10개\n- JSON만 출력\n{"title":"제목","summary":"요약","tags":["태그1"]}`;

  const metaText = await chat([
    { role: 'system', content: '당신은 한국의 실전형 블로그 편집자입니다. JSON만 출력하세요.' },
    { role: 'user', content: metaPrompt }
  ], { json: true });

  let meta = { title: topic, summary: '', tags: [] };
  try {
    meta = JSON.parse(metaText);
  } catch {}

  const bodyPrompt = `제목: ${meta.title || topic}\n주제: ${topic}\n카테고리: ${chosenCategory}\n날짜: ${today}\n블로그명: ${config.blog.name}\n저자: ${config.blog.authorName} (${config.blog.authorRole})\n\n티스토리용 순수 HTML 본문을 작성하세요.\n규칙:\n- <h2>로 바로 시작\n- 전체 2500자 이상\n- 존댓말\n- 도입부에 현장/실무 관점 공감 문장 1~2개\n- H2/H3 구조 사용\n- 각 주요 섹션 아래에 핵심 요약 박스 넣기\n- 체크리스트 박스 최소 2개\n- 중간에 조언용 blockquote 1개\n- Q&A 4개 이상\n- 마지막 부분에 주의/한계 섹션 포함\n- 외부 이미지와 <img> 태그 금지\n- 중국어/일본어 한자 금지\n- 본문 중간에 아래 CTA 박스를 자연스럽게 넣기\n\n핵심 요약 박스 예시:\n<div style="background:linear-gradient(135deg,#f0f7ff,#e8f4fd);border-radius:12px;padding:20px 24px;margin:16px 0 28px;border-left:4px solid #1e40af;">\n<p style="margin:0;font-size:15px;color:#1e3a8a;line-height:1.8;"><strong>💡 핵심 요약:</strong> 요약 내용</p>\n</div>\n\n체크리스트 박스 예시:\n<div style="background:#f8faff;border:1px solid #dbeafe;border-radius:12px;padding:20px 24px;margin:24px 0;">\n<h4 style="color:#1e40af;margin:0 0 12px;font-size:16px;">✅ 핵심 포인트</h4>\n<ul style="margin:0;padding-left:20px;color:#374151;line-height:2;">\n<li>포인트 1</li>\n</ul>\n</div>\n\n강사/운영자 조언 인용구 예시:\n<blockquote style="border-left:4px solid #0ea5e9;padding:16px 24px;background:#f0f9ff;margin:28px 0;border-radius:0 12px 12px 0;color:#0c4a6e;font-style:italic;line-height:1.8;">\n\"실전 조언\"<br/><small style="color:#0369a1;font-style:normal;">— ${config.blog.authorName}</small>\n</blockquote>\n\nCTA 박스:\n${buildCtaBox()}\n\nHTML 태그만 출력하세요.`;

  const body = await chat([
    { role: 'system', content: '당신은 한국의 실전형 AI/디지털 블로그 작가입니다. 순수 HTML만 출력하세요.' },
    { role: 'user', content: bodyPrompt }
  ]);

  const cleanBody = String(body).replace(/^```html\n?/i, '').replace(/```$/i, '').trim();

  return {
    title: meta.title || topic,
    category: chosenCategory,
    tags: normalizeTags([...(meta.tags || []), ...tags]),
    summary: meta.summary || '',
    visibility: visibility || config.blog.defaultVisibility,
    topic,
    content: `${cleanBody}${buildAuthorCard()}`
  };
}

module.exports = { generateTopicPost, inferCategory, normalizeTags };
