# Tistory OpenClaw Publisher

오픈클로(OpenClaw) 사용자용 **티스토리 블로그 글 자동 생성 + 자동 발행 패키지**입니다.

이 저장소는 다음 흐름을 제공합니다.

1. 주제를 입력합니다.
2. LLM이 제목, 요약, 태그, 카테고리, HTML 본문을 생성합니다.
3. `temp-post.json`에 저장합니다.
4. Playwright가 티스토리에 로그인해서 자동 발행합니다.

## 특징

- 티스토리 글 **초안 생성** / **즉시 발행** 지원
- OpenAI 호환 API 사용 가능
  - OpenAI
  - Groq
  - OpenRouter
  - 기타 OpenAI-compatible endpoint
- 저장된 로그인 세션 재사용
- 세션 만료 시 자동 로그인 시도
- 실패 시 headed 브라우저로 수동 로그인 fallback
- OpenClaw cron/작업 자동화에 연결하기 쉬운 CLI 구조

## 준비물

- Node.js 20+
- npm
- 카카오 로그인 가능한 티스토리 계정
- OpenAI 호환 LLM API 키

## 설치

```bash
git clone https://github.com/YOUR_ID/tistory-openclaw-publisher.git
cd tistory-openclaw-publisher
npm install
cp .env.example .env
```

Windows PowerShell에서는 `cp` 대신 아래를 써도 됩니다.

```powershell
Copy-Item .env.example .env
```

## 환경변수 설정

`.env`에서 최소한 아래 6개는 채워야 합니다.

- `KAKAO_EMAIL`
- `KAKAO_PASSWORD`
- `TISTORY_BLOG`
- `OPENAI_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

예시:

```env
KAKAO_EMAIL=you@example.com
KAKAO_PASSWORD="your-password"
TISTORY_BLOG=myblog
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=llama-3.3-70b-versatile
```

## 사용법

### 1) 초안만 생성

```bash
node src/post-topic.js --draft --topic "오픈클로 자동화로 블로그 운영하는 법"
```

생성 결과는 `temp-post.json`에 저장됩니다.

### 2) 바로 발행

```bash
node src/post-topic.js --topic "오픈클로 자동화로 블로그 운영하는 법"
```

### 3) 카테고리/태그 직접 지정

```bash
node src/post-topic.js --topic "Claude CLI 활용법" --category "클로드코드" --tags "Claude CLI,MCP,AI코딩"
```

### 4) 로그인 막힐 때 브라우저 띄우기

```bash
node src/post-topic.js --topic "티스토리 자동화" --headed
```

## OpenClaw에서 쓰는 방법

OpenClaw에서 이 패키지를 호출하는 방식은 간단합니다.

예시 프롬프트:

- "`tistory-openclaw-publisher` 저장소를 설치해 두고, 주제를 받아 초안을 만든 뒤 발행해줘"
- 또는 OpenClaw cron에서 아래처럼 실행

```powershell
cd C:\path\to\tistory-openclaw-publisher
node src/post-topic.js --topic "오늘의 AI 동향"
```

크론 예시는 저장소의 `openclaw-cron-example.json` 파일을 참고하면 됩니다.

## 기본 카테고리 추론 규칙

- Claude / Claude Code / MCP / agent → `클로드코드`
- OpenClaw / 게이트웨이 / cron / 스킬 → `오픈클로`
- Cursor / Antigravity / 바이브코딩 → `바이브코딩`
- ChatGPT / Gemini / OpenAI / Anthropic / AI 뉴스 → `최신AI동향`
- GEO / SEO / 검색 최적화 → `GEO 마케팅`
- 전자책 / POD / 출판 / 강사 마케팅 → `전자출판·교육마케팅`

## 파일 구조

```text
src/
  auth.js            # 티스토리 로그인/세션 관리
  config.js          # 환경변수/브랜딩 설정
  llm.js             # OpenAI 호환 API 호출
  generate-topic.js  # 제목/요약/태그/본문 생성
  publish-post.js    # 티스토리 에디터 자동 발행
  post-topic.js      # CLI 진입점
```

## 주의사항

- 티스토리 로그인 정책이 바뀌면 selector 수정이 필요할 수 있습니다.
- 2차 인증/추가 인증이 걸리면 `--headed`로 수동 로그인을 마쳐야 합니다.
- 공개 썸네일 URL을 쓰는 방식이 가장 안정적입니다.
- 계정/쿠키/세션 파일은 절대 GitHub에 올리지 마세요.

## 라이선스

MIT
