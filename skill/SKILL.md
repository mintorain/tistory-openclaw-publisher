---
name: tistory-openclaw-publisher
description: "Install, configure, draft, or publish Tistory blog posts with the reusable GitHub package for OpenClaw users. Use when the user wants a portable Tistory automation workflow others can clone and run on their own OpenClaw setup."
---

# Tistory OpenClaw Publisher

Use the public package instead of the private workspace bot when the workflow should be portable.

## Package

- Repo: `https://github.com/mintorain/tistory-openclaw-publisher`
- Local clone target: choose a normal project path, then work inside that clone.

## Core workflow

1. Read `references/setup.md` before first use.
2. Confirm the repo is cloned locally.
3. Confirm `.env` exists and required values are filled.
4. Run `node src/post-topic.js --draft --topic "주제"` for a safe draft-first check.
5. Run `node src/post-topic.js --topic "주제"` for full publish.
6. Add `--category "카테고리명"` when the user wants a specific category.
7. Add `--tags "태그1,태그2"` when fixed tags are required.
8. Add `--headed` when Kakao/Tistory login recovery may need manual interaction.

## Required env keys

- `KAKAO_EMAIL`
- `KAKAO_PASSWORD`
- `TISTORY_BLOG`
- `OPENAI_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Category hints

- Claude / Claude Code / MCP / agent workflows → `클로드코드`
- OpenClaw / gateway / cron / skill topics → `오픈클로`
- Cursor / Antigravity / vibe coding → `바이브코딩`
- ChatGPT / Gemini / OpenAI / Anthropic / AI news → `최신AI동향`
- GEO / SEO / AI search optimization → `GEO 마케팅`
- ebook / POD / publishing / instructor marketing → `전자출판·교육마케팅`

## Validation

- Confirm `npm install` completed.
- Confirm `temp-post.json` was written for draft or publish runs.
- Confirm generated title/category/tags appeared in command output.
- For real publishes, confirm the final Tistory URL appears in output.
- If it fails, report the exact blocker: missing env key, login challenge, selector drift, or provider API error.
