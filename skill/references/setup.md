# Setup

## Clone

```powershell
git clone https://github.com/mintorain/tistory-openclaw-publisher.git
cd tistory-openclaw-publisher
npm install
Copy-Item .env.example .env
```

## Fill `.env`

Minimum required keys:

- `KAKAO_EMAIL`
- `KAKAO_PASSWORD`
- `TISTORY_BLOG`
- `OPENAI_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Optional branding keys:

- `BLOG_NAME`
- `BLOG_AUTHOR_NAME`
- `BLOG_AUTHOR_ROLE`
- `BLOG_AUTHOR_BIO`
- `BLOG_SITE_URL`
- `BLOG_PHONE`
- `BLOG_THUMBNAIL_URL`
- `BLOG_CTA_TITLE`
- `BLOG_CTA_TEXT`
- `BLOG_CTA_BADGES`
- `BLOG_DEFAULT_VISIBILITY`

## Draft first

```powershell
node src/post-topic.js --draft --topic "오픈클로로 티스토리 자동화하는 법"
```

## Publish

```powershell
node src/post-topic.js --topic "오픈클로로 티스토리 자동화하는 법"
```

## Login recovery

If Kakao blocks headless login, rerun with:

```powershell
node src/post-topic.js --topic "주제" --headed
```

## OpenClaw usage pattern

Typical request:

- clone/setup the package
- create a draft first
- inspect `temp-post.json`
- publish only after the draft looks acceptable
