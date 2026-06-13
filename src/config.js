const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 환경변수가 필요합니다.`);
  return value;
}

function optional(name, fallback = '') {
  return process.env[name] || fallback;
}

function csv(name, fallback = '') {
  return optional(name, fallback)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

const config = {
  blog: {
    name: optional('BLOG_NAME', '내 블로그'),
    slug: required('TISTORY_BLOG'),
    loginEmail: required('KAKAO_EMAIL'),
    loginPassword: required('KAKAO_PASSWORD'),
    defaultVisibility: optional('BLOG_DEFAULT_VISIBILITY', 'public'),
    thumbnailUrl: optional('BLOG_THUMBNAIL_URL', ''),
    siteUrl: optional('BLOG_SITE_URL', ''),
    phone: optional('BLOG_PHONE', ''),
    authorName: optional('BLOG_AUTHOR_NAME', '홍길동'),
    authorRole: optional('BLOG_AUTHOR_ROLE', 'AI 활용 실무 강사'),
    authorBio: optional('BLOG_AUTHOR_BIO', '실무에서 바로 쓰는 AI 활용법을 정리합니다.'),
    ctaTitle: optional('BLOG_CTA_TITLE', 'AI 실전 강의 안내'),
    ctaText: optional('BLOG_CTA_TEXT', '실전형 AI 교육이나 컨설팅이 필요하시면 문의해 주세요.'),
    ctaBadges: csv('BLOG_CTA_BADGES', '생성형AI,업무자동화,블로그자동화')
  },
  llm: {
    baseUrl: required('OPENAI_BASE_URL').replace(/\/$/, ''),
    apiKey: required('OPENAI_API_KEY'),
    model: required('OPENAI_MODEL')
  },
  paths: {
    root: path.join(__dirname, '..'),
    authState: path.join(__dirname, '..', 'auth-state.json'),
    cookies: path.join(__dirname, '..', 'cookies.json'),
    tempPost: path.join(__dirname, '..', 'temp-post.json')
  }
};

module.exports = { config };
