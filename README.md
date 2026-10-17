# 웹사이트 접근성 및 성능 점검 도구 (Website Checker — Fresnel)

> **Lighthouse 지표 분석부터 실제 수정 코드와 1-클릭 Git 커밋 및 PR 자동 생성까지**  
> Google AI Studio & Gemini 기반의 풀스택 웹 품질 자동 개선 도구입니다.

- **🌐 GitHub Pages 실시간 배포 URL:** [https://djai32521.github.io/Website_Checker/](https://djai32521.github.io/Website_Checker/)
- **📝 티스토리 블로그 완벽 가이드 (AEO/GEO/SEO):** [`TISTORY_BLOG_POST.md`](./TISTORY_BLOG_POST.md)
- **🐙 GitHub 저장소:** [https://github.com/djai32521/Website_Checker](https://github.com/djai32521/Website_Checker)

---

## 🌟 주요 특징 (Key Features)

1. **기본 한국어(KO) 및 다국어(EN) 완벽 지원 (Bilingual Support)**
   - 기본 언어는 한국어로 설정되어 있으며, 헤더의 `KO / EN` 버튼 클릭 시 전체 UI 및 감사 결과 설명이 즉시 반응형으로 전환됩니다.
2. **5대 핵심 영역 정밀 분석 (Static Code Audit)**
   - **성능 (Performance):** 폰트 preconnect 힌트, `font-display:swap`, 히어로 이미지 `srcset` 및 고유 width/height 규격(CLS 방지) 지정
   - **웹 접근성 (Accessibility):** 본문 바로가기 스킵 링크(`skip-to-main-content`), WCAG AA 포커스 아웃라인, 아이콘 버튼 `aria-label` 누락 보정
   - **모범 사례 (Best Practices):** `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `rel="noopener noreferrer"` 자동 적용
   - **검색엔진 최적화 (SEO):** 140자 최적화 `meta description`, OpenGraph 소셜 카드, Schema.org JSON-LD 구조화 데이터 자동 주입
   - **웹 보안 취약점 (Security - Light):** DOM XSS 싱크 소독(`textContent`/`DOMPurify`), 클라이언트 시크릿 노출 방지
3. **Lighthouse JSON (LHR) 2회차 심층 분석**
   - 로컬에서 측정한 `lighthouse-report.json` 파일을 드래그&드롭하거나 붙여넣으면, 실제 감지된 DOM 셀렉터와 `metricSavings`(예: LCP 1,180ms 절감)에 1:1로 매핑되는 정밀 패치 생성.
4. **1-클릭 터미널 PR 자동화 (`git am` + `gh pr create`)**
   - 브라우저에 GitHub 토큰을 입력할 필요 없이, 터미널에 복사-붙여넣기 한 번만 하면 브랜치 체크아웃, 원자적 커밋 자동 적용, 원격 푸시, 풀 리퀘스트 생성까지 자동 완료.
5. **듀얼 엔진 아키텍처 (Full-Stack + Static Client Fallback)**
   - Google Cloud Run 및 Node.js 서버 환경에서는 Gemini Managed Agent와 실시간 통신.
   - GitHub Pages 정적 호스팅 환경에서는 클라이언트 사이드 시뮬레이션 엔진이 즉각 가동되어 100% 정상 작동.

---

## 🚀 빠른 시작 (Getting Started)

### 1. 로컬 개발 환경 실행
```bash
# 의존성 설치
npm install

# 풀스택 개발 서버 실행 (Node.js Express + Angular)
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

### 2. 프로덕션 빌드 & GitHub Pages 배포 준비
```bash
# 프로덕션 빌드 및 GitHub Pages 배포용 docs/ 디렉토리 생성
npm run build:gh-pages
```

---

## 📁 프로젝트 구조 (Project Structure)

```text
Website_Checker/
├── src/                                          # Angular 19 프론트엔드 소스
│   ├── index.html                                # 메타 태그, OpenGraph, JSON-LD 스키마 포함
│   ├── main.ts                                   # Angular 엔트리포인트 (Zoneless)
│   ├── styles.scss                               # 디자인 시스템 & 다크 모드
│   └── app/
│       ├── app.component.ts                      # 멀티스텝 컨트롤러 & Signal 상태 관리
│       ├── app.component.html                    # 1~7단계 템플릿 & 다국어 바인딩
│       ├── services/
│       │   ├── audit.service.ts                  # 감사 엔진, 텔레메트리, 패치 생성, 폴백
│       │   └── i18n.service.ts                   # 한/영 다국어 사전 및 번역 서비스
│       └── components/
│           └── fresnel-logo/                     # 프레넬 로고 & 브랜드 스토리 툴팁
├── server/                                       # Node.js 백엔드 & 에이전트 브릿지
│   ├── index.js                                  # HTTP REST API 및 정적 서빙
│   └── agent-client.js                           # Gemini Managed Agent 클라이언트
├── scripts/
│   ├── build.mjs                                 # Angular 프로덕션 빌드 스크립트
│   └── prepare-gh-pages.mjs                      # GitHub Pages 배포 번들 생성 (base-href, 404.html)
├── docs/                                         # GitHub Pages 정적 배포 번들
├── TISTORY_BLOG_POST.md                          # 티스토리 블로그 배포용 심층 기술 문서
└── README.md
```

---

## 📄 라이선스
MIT License. 자유롭게 포크하고 여러분의 웹사이트 품질 점검에 활용하세요!
