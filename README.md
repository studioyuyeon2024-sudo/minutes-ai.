# 회의록 AI 분석 시스템

전북특별자치도의회 교육위원회 회의록을 AI로 자동 분석·요약하는 웹 애플리케이션입니다.

## 주요 기능

- **텍스트 붙여넣기**: 전자회의록에서 복사한 텍스트를 바로 분석
- **URL 입력**: 전자회의록 페이지 URL에서 자동으로 텍스트 추출
- **AI 구조화 요약**: 안건별 요약, 발언자별 핵심 발언, 의결사항, 후속조치 자동 분류
- **결과 내보내기**: 분석 결과를 JSON으로 다운로드

## 기술 스택

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- OpenAI GPT-4o-mini, Cheerio (HTML 파싱)
- Vercel 배포

## 설치 및 실행

```bash
npm install
cp .env.local.example .env.local  # OPENAI_API_KEY 설정
npm run dev
```

## 배포

Vercel에 GitHub 리포지토리 연결 → 환경변수 `OPENAI_API_KEY` 설정 → 자동 배포

---

*전북특별자치도의회 교육위원회 · 2026년 AI·데이터 분석 전문인재 양성과정 프로젝트*
