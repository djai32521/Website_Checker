# [Google AI Studio x Gemini] 웹사이트 접근성·성능·보안 점검 도구(Website Checker) 개발기 및 AEO·GEO·SEO 검색 최적화 완벽 가이드

> **부제:** 단순 점수 측정을 넘어 실제 수정 코드와 1-클릭 Git 커밋을 자동 생성하는 풀스택 웹 애플리케이션 아키텍처 및 차세대 생성형 AI 검색엔진(Perplexity, ChatGPT Search, Google AI Overviews) 완벽 대응 전략

---

## 📌 목차
1. [들어가며: 웹 품질 관리의 페인포인트와 해결책](#1-들어가며-웹-품질-관리의-페인포인트와-해결책)
2. [Fresnel(Website Checker) 프로젝트 개요 및 핵심 철학](#2-fresnelwebsite-checker-프로젝트-개요-및-핵심-철학)
3. [Google AI Studio 기반 개발 워크플로우 & 풀스택 환경 구성](#3-google-ai-studio-기반-개발-워크플로우--풀스택-환경-구성)
4. [핵심 아키텍처 & 실전 코드 예시 (Deep Dive)](#4-핵심-아키텍처--실전-코드-예시-deep-dive)
   - 4.1. 백엔드: Gemini Managed Agent & 정적 분석 파이프라인
   - 4.2. Lighthouse LHR JSON 파서 & DOM 1:1 매핑 패치 생성기
   - 4.3. 프론트엔드: Angular 19/21 Zoneless Signal & i18n 다국어 시스템
   - 4.4. 원클릭 터미널 자동화: `git am` + `gh pr create` 파이프라인
5. [AEO · GEO · SEO & AI SEO 검색 최적화 완벽 가이드](#5-aeo--geo--seo--ai-seo-검색-최적화-완벽-가이드)
   - 5.1. 전통 SEO vs AEO vs GEO의 개념 비교
   - 5.2. AI 검색엔진이 인용하는 콘텐츠의 공통 패턴과 전략
   - 5.3. Schema.org JSON-LD 구조화 데이터 실전 코드
   - 5.4. 실무 개발자를 위한 성능 & 접근성 핵심 체크리스트
6. [GitHub Pages 정적 배포 및 클라이언트 폴백 아키텍처](#6-github-pages-정적-배포-및-클라이언트-폴백-아키텍처)
7. [맺음말: AI 코딩 에이전트와 웹 프론트엔드의 미래](#7-맺음말-ai-코딩-에이전트와-웹-프론트엔드의-미래)

---

## 1. 들어가며: 웹 품질 관리의 페인포인트와 해결책

현대 웹 개발에서 **웹 성능(Core Web Vitals)**, **웹 접근성(Accessibility/WCAG)**, **검색엔진 최적화(SEO)**, 그리고 **기본 보안(Security)**은 서비스의 성공을 결정짓는 핵심 요소입니다. 구글 검색 순위 알고리즘은 LCP(Largest Contentful Paint), CLS(Cumulative Layout Shift), INP(Interaction to Next Paint)를 직접 반영하며, 미국과 유럽을 비롯한 글로벌 시장에서는 장애인 차별 금지 및 웹 접근성 표준(WCAG 2.1 AA) 준수가 법적 의무로 강화되고 있습니다.

하지만 수많은 개발팀이 직면하는 현실적인 문제는 다음과 같습니다:

1. **"Lighthouse를 돌려 점수가 낮게 나오는 것은 알겠는데, 내 소스 코드 어디를 어떻게 고쳐야 할지 모르겠다."**
2. **"검사 도구의 제안이 너무 추상적이거나(`Eliminate render-blocking resources`, `Ensure text remains visible during webfont load`), 실제 프레임워크(Angular, React, Vue)에 맞는 코드로 변환하기 번거롭다."**
3. **"보안 취약점이나 메타 태그 누락은 별도의 도구를 써야 해서 파편화된다."**

이러한 문제를 해결하기 위해, Google AI Studio와 최신 Gemini AI 모델(Gemini 2.5 Flash, Gemini Managed Agent)을 기반으로 **"GitHub 저장소 주소나 Lighthouse JSON 리포트만 입력하면, 문제점을 진단하고 실제 적용 가능한 원자적 Git 커밋(Patch)과 PR 생성 스크립트까지 자동으로 만들어주는 웹사이트 점검 도구(Website Checker / Fresnel)"**를 개발하게 되었습니다.

---

## 2. Fresnel(Website Checker) 프로젝트 개요 및 핵심 철학

본 프로젝트의 이름인 **Fresnel(프레넬)**은 프랑스의 물리학자 **오귀스탱 장 프레넬(Augustin-Jean Fresnel, 1788–1827)**의 이름에서 유래했습니다. 

> *“단일하고 무거운 유리 돔 대신, 동심원 형태의 계단식 프리즘 링이 사방으로 흩어지는 빛을 모아 수 마일을 뻗어나가는 하나의 선명한 광선으로 굴절시킵니다.”*

프레넬 렌즈가 등대의 빛을 하나로 집중시켜 짙은 안개 속 배들을 안내하듯, 이 도구는 **Lighthouse 검사 지표와 소스 코드에 흩어져 있는 수십 가지 결함을 집중 분석하여, 깃허브에서 바로 병합할 수 있는 깨끗한 Git 커밋들로 집약**합니다.

### 주요 기능 요약
- **5대 핵심 영역 정밀 정적 분석:**
  1. **성능(Performance):** 폰트 preconnect 힌트, `font-display:swap`, 히어로 이미지 `srcset` 및 고유 width/height 규격 자동 산정 (CLS 방지)
  2. **접근성(Accessibility):** 본문 바로가기 스킵 링크(`skip-to-main-content`), 키보드 포커스 아웃라인(`:focus-visible`), 아이콘 버튼의 `aria-label` 누락 자동 보정
  3. **모범 사례(Best Practices):** `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, 외부 링크의 `rel="noopener noreferrer"` 자동 적용
  4. **검색엔진 최적화(SEO):** 140자 최적화 `meta description`, OpenGraph 소셜 카드, Schema.org JSON-LD 구조화 데이터 자동 주입
  5. **웹 보안 취약점(Security - Light):** 위험한 `innerHTML` 대입 지점(DOM XSS) 소독, 클라이언트 스토리지 내 시크릿 노출 감지
- **Lighthouse JSON (LHR) 2회차 심층 분석:** 로컬에서 측정한 `lighthouse-report.json`을 업로드하면, 실제 감지된 DOM 셀렉터와 `metricSavings`(예: LCP 1,180ms 절감)에 1:1로 매핑되는 정밀 패치 생성
- **1-클릭 터미널 PR 자동화:** `git am`과 GitHub CLI(`gh pr create`)를 결합하여 개발자가 터미널에 복사-붙여넣기 한 번만 하면 브랜치 생성, 커밋 적용, 원격 푸시, 풀 리퀘스트 생성까지 원스톱 완료
- **한국어/영어 완벽 다국어(i18n) 지원:** 기본 한국어 지원 및 원클릭 영문 전환

---

## 3. Google AI Studio 기반 개발 워크플로우 & 풀스택 환경 구성

Google AI Studio는 아이디어 구상부터 실시간 프로토타이핑, 프롬프트 튜닝, 풀스택 코드 생성 및 Cloud Run 배포까지 하나의 환경에서 처리할 수 있는 강력한 플랫폼입니다.

```
+---------------------------------------------------------------------------------+
|                                Google AI Studio                                 |
+---------------------------------------------------------------------------------+
          |                                                   |
          v                                                   v
+-----------------------+                           +-------------------+
| Node.js Express Server| <--- HTTP / REST API ---> | Angular 19 Client |
| (SSR & Gemini Proxy)  |                           | (Zoneless Signals)|
+-----------------------+                           +-------------------+
          |                                                   |
          v                                                   v
+-----------------------+                           +-------------------+
|  Gemini AI API /      |                           | GitHub Pages /    |
|  Managed Agent Client |                           | Static Deployment |
+-----------------------+                           +-------------------+
```

### 3.1. 아키텍처 구성 원칙
1. **API 키의 클라이언트 노출 절대 금지:**
   - 브라우저 클라이언트 코드(`src/app/*`)에는 절대 `GEMINI_API_KEY`를 하드코딩하지 않습니다.
   - 모든 AI 추론 및 고수준 분석 요청은 Express 백엔드 프록시(`/api/audit/*`)를 통과하며, 환경 변수는 `.env.example` 및 서버 런타임에서 안전하게 관리됩니다.
2. **하이브리드 렌더링 & 빌드 파이프라인:**
   - 개발 환경 및 Cloud Run 배포 환경에서는 `server.ts`가 정적 파일 서빙과 API 엔드포인트를 동시에 담당합니다.
   - GitHub Pages와 같은 완전한 정적 호스팅 환경에서도 데모 및 분석 기능을 100% 체험할 수 있도록 클라이언트 사이드 시뮬레이션 폴백 엔진을 이중 탑재했습니다.

---

## 4. 핵심 아키텍처 & 실전 코드 예시 (Deep Dive)

### 4.1. 백엔드: Gemini Managed Agent & 정적 분석 파이프라인

Gemini의 시스템 프롬프트(System Instruction)를 설계할 때 가장 중요한 것은 **환각(Hallucination) 방지**와 **엄격한 출력 제약조건 부여**입니다. Fresnel 에이전트는 불필요한 빌드 스크립트 실행이나 런타임 브라우저 구동을 엄격히 배제하고, 오직 순수 정적 코드 분석(Static Code Analysis)과 원자적 Git 커밋 포맷만을 생성하도록 지시합니다.

```javascript
// server/agent-client.js 발췌: 시스템 프롬프트 및 에이전트 설정
export const FRESNEL_AGENT_CONFIG = {
  gcpProject: 'phantom-gdemo-1',
  model: 'gemini-4-argon',
  fallbackModel: 'gemini-3.8-flash',
  executionPolicy: 'STATIC_CODE_ONLY_NO_RUNTIME',
  systemInstruction: `You are Fresnel, an autonomous static code audit agent.

STRICT AUDIT CONSTRAINTS:
- Perform a comprehensive STATIC CODE AUDIT ONLY. Do NOT start dev servers, do NOT run build scripts or test suites, and do NOT launch headless browsers.
- Inspect templates, components, stylesheets, routing definitions, document head metadata, and static asset pipelines across:
  1. Performance (LCP resource prioritization, render-blocking elimination, CLS intrinsic sizing, font-display:swap & resource hints)
  2. Accessibility (skip-to-main-content bypass link, route-specific document titles, WCAG AA focus-visible outlines, ARIA names)
  3. Best practices (Content-Security-Policy & X-Content-Type-Options hardening, rel="noopener noreferrer" on external links)
  4. SEO (viewport meta config, descriptive meta description & OpenGraph tags, canonical URLs, structured JSON-LD schema)
  5. Web application security findings (light) - scan for DOM XSS sinks, hardcoded secrets, unvalidated open redirects.
- Synthesize small, self-contained, atomic git commits where each commit focuses on doing ONE thing cleanly.`
};
```

---

### 4.2. Lighthouse LHR JSON 파서 & DOM 1:1 매핑 패치 생성기

사용자가 Lighthouse 검사 결과 파일(`lighthouse-report.json`)을 업로드하면, 백엔드 및 클라이언트 파서가 이를 분석하여 점수 뒤에 숨겨진 실제 타겟 노드를 발라냅니다.

```javascript
// Lighthouse LHR JSON 파싱 로직
export function analyzeLighthouseReportJson(lhrJsonString) {
  const lhr = typeof lhrJsonString === 'string' ? JSON.parse(lhrJsonString) : lhrJsonString;
  const audits = lhr.audits || {};
  const findings = [];

  // 1. LCP (Largest Contentful Paint) 타겟 엘리먼트 감지
  const lcpAudit = audits['largest-contentful-paint-element'];
  if (lcpAudit && lcpAudit.score < 0.9) {
    const selector = lcpAudit.details?.items?.[0]?.node?.selector || 'img.hero-banner';
    findings.push({
      category: 'performance',
      auditId: 'largest-contentful-paint-element',
      targetSelector: selector,
      metricSavings: lcpAudit.metricSavings?.LCP || 0,
      solution: 'Add responsive srcset, intrinsic dimensions, and fetchpriority="high"'
    });
  }

  // 2. 누적 레이아웃 이동(CLS) 방지: width/height 누락 이미지
  const unsizedImages = audits['unsized-images'];
  if (unsizedImages && unsizedImages.score < 1.0) {
    findings.push({
      category: 'performance',
      auditId: 'unsized-images',
      metricSavings: unsizedImages.metricSavings?.CLS || 0.1,
      solution: 'Specify explicit width and height attributes or CSS aspect-ratio'
    });
  }

  // 3. WCAG 명도 대비 미달 엘리먼트
  const colorContrast = audits['color-contrast'];
  if (colorContrast && colorContrast.score < 1.0) {
    findings.push({
      category: 'accessibility',
      auditId: 'color-contrast',
      solution: 'Adjust foreground/background colors to meet WCAG AA 4.5:1 ratio'
    });
  }

  return findings;
}
```

---

### 4.3. 프론트엔드: Angular 19/21 Zoneless Signal & i18n 다국어 시스템

최신 Angular에서는 레거시 `zone.js`를 제거하고 신호(`signal`, `computed`, `linkedSignal`) 기반의 고성능 Zoneless 아키텍처를 권장합니다. 본 프로젝트는 상태 전환의 반응성을 극대화하기 위해 완전한 Signal 기반으로 작성되었습니다.

또한, 기본 언어는 **한국어**로 설정되어 있으며, 사용자가 언제든 영문으로 전환할 수 있는 `I18nService`를 싱글톤으로 주입하여 뷰 전체가 리렌더링 없이 즉시 전환됩니다.

```typescript
// src/app/services/i18n.service.ts 발췌
import { Injectable, computed, signal } from '@angular/core';

export type AppLang = 'ko' | 'en';

@Injectable({ providedIn: 'root' })
export class I18nService {
  // 기본 언어: 한국어 (사용자 브라우저 설정 또는 로컬 스토리지 유지)
  readonly currentLang = signal<AppLang>(this.getInitialLanguage());
  readonly isKorean = computed(() => this.currentLang() === 'ko');

  private getInitialLanguage(): AppLang {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('fresnel_lang');
      if (saved === 'en' || saved === 'ko') return saved;
    }
    return 'ko'; // 기본값 한국어
  }

  setLang(lang: AppLang): void {
    this.currentLang.set(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fresnel_lang', lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  toggleLang(): void {
    this.setLang(this.currentLang() === 'ko' ? 'en' : 'ko');
  }

  t(key: string, params?: Record<string, string | number>): string {
    const table = this.currentLang() === 'ko' ? KO_TRANSLATIONS : EN_TRANSLATIONS;
    let text = table[key] || EN_TRANSLATIONS[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }
}
```

컴포넌트 템플릿에서는 아래와 같이 단방향 신호 바인딩으로 깔끔하게 소비됩니다:

```html
<!-- src/app/app.component.html 발췌: 상단 다국어 토글 및 헤더 -->
<header class="topbar" role="banner">
  <div class="topbar__left">
    @if (audit.step() > 1) {
      <button type="button" class="icon-pill-btn" (click)="onBack()">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">...</svg>
      </button>
    }
  </div>

  <div class="topbar__center">
    <span class="step-counter">
      {{ audit.step() <= 4 ? t('stepCounterRun1', { step: audit.step() }) : t('stepCounterRun2', { step: audit.step() - 4 }) }}
    </span>
  </div>

  <div class="topbar__right">
    <!-- 한/영 원클릭 전환 버튼 -->
    <button type="button" class="icon-pill-btn lang-toggle-btn" (click)="i18n.toggleLang()">
      <span class="lang-pill-text">{{ i18n.isKorean() ? 'KO' : 'EN' }}</span>
    </button>
    <button type="button" class="icon-pill-btn" (click)="audit.toggleTheme()">
      <!-- 테마 토글 아이콘 -->
    </button>
  </div>
</header>
```

---

### 4.4. 원클릭 터미널 자동화: `git am` + `gh pr create` 파이프라인

단순히 수정할 코드를 보여주는 것에 그치지 않고, 개발자가 터미널에 한 줄만 실행하면 브랜치 체크아웃부터 PR 생성까지 완료되는 커맨드라인 번들을 생성합니다:

```bash
# Fresnel이 생성하는 1-클릭 터미널 실행 명령어 예시
git checkout -b fresnel/code-audit origin/main && \
git am --3way < ~/Downloads/fresnel-my-repo-code-audit.patch && \
git push -u origin fresnel/code-audit && \
gh pr create \
  --title "Fresnel Audit: Web Accessibility & Performance Fixes" \
  --body "### Automated Audit Fixes
- Added preconnect hints and font-display:swap
- Prevented CLS with explicit image dimensions
- Introduced WCAG AA accessible skip-link
- Sanitized dangerous innerHTML XSS sinks"
```

이 접근 방식의 장점은 다음과 같습니다:
1. **GitHub 토큰 불필요:** 웹 서버에 사용자의 개인 GitHub 토큰을 전송할 필요 없이, 개발자 로컬 머신에 이미 인증된 `git`과 `gh` 자격 증명을 그대로 활용하므로 보안상 매우 안전합니다.
2. **원자적 커밋 히스토리 보존:** 한 번에 뭉뚱그려 커밋하는 것이 아니라, 각 이슈별(성능 1개, 접근성 1개, 보안 1개)로 분리된 깨끗한 커밋 히스토리가 Git 트리에 기록됩니다.

---

## 5. AEO · GEO · SEO & AI SEO 검색 최적화 완벽 가이드

최근 검색 시장의 판도가 급변하고 있습니다. 기존 구글, 네이버 같은 전통적 검색엔진뿐만 아니라, **ChatGPT Search, Perplexity AI, Google AI Overviews, Claude**와 같은 대화형/생성형 AI 검색 엔진이 유저 트래픽의 상당 부분을 흡수하고 있습니다.

따라서 웹사이트와 블로그를 운영할 때는 과거의 단순 키워드 반복식 SEO를 넘어 **AEO(Answer Engine Optimization)**와 **GEO(Generative Engine Optimization)**를 반드시 함께 고려해야 합니다.

### 5.1. 전통 SEO vs AEO vs GEO의 개념 비교

| 구분 | 대상 플랫폼 | 핵심 목표 | 주요 랭킹 및 인용 요소 |
| :--- | :--- | :--- | :--- |
| **SEO** (Search Engine Optimization) | Google, Naver, Bing | 검색 결과 페이지(SERP) 상위 노출 및 클릭 유도 | 백링크, 키워드 밀도, 사이트맵, 페이지 속도(Core Web Vitals) |
| **AEO** (Answer Engine Optimization) | Google 피처드 스니펫, Siri, Google 어시스턴트 | 질문에 대한 1차 직접 답변(Featured Snippet) 채택 | 질문-답변 구조(Q&A), 간결한 정의문(40~60단어), 리스트/테이블 태그 |
| **GEO** (Generative Engine Optimization) | ChatGPT Search, Perplexity, Google AI Overviews | 생성형 AI의 답변 요약문에 출처(Citation)로 인용 | 고유한 데이터 및 통계, 권위 있는 출처 인용, 인과관계가 명확한 설명문, Schema.org 구조화 데이터 |

---

### 5.2. AI 검색엔진이 인용하는 콘텐츠의 공통 패턴과 전략

Perplexity나 SearchGPT 같은 AI 검색 모델이 웹 문서를 읽고 답변의 출처로 채택하기 위해 선호하는 패턴은 명확합니다:

1. **직접적이고 명쾌한 정의문 배치 (BLUF 원칙: Bottom Line Up Front):**
   - 질문형 소제목(`H2`, `H3`) 바로 아래의 첫 2문장에 핵심 결론을 배치해야 합니다. AI는 서론이 길고 모호한 글보다 즉시 답변으로 활용할 수 있는 단락을 우선 스크랩합니다.
2. **정량적 수치와 비교 데이터 제시:**
   - *"속도가 빨라집니다"*보다는 *"LCP 지표가 3,420ms에서 1,180ms로 약 65% 개선됩니다"*와 같이 구체적인 숫자가 포함된 문장이 AI 답변에 직접 인용될 확률이 3배 이상 높습니다.
3. **완결성 있는 코드 블록과 주석:**
   - 기술 블로그의 경우, 생략(`...`)이 너무 많은 코드보다 실제 동작 가능한 최소 예제(Minimal Working Example)와 주석이 풍부한 코드가 AI의 코딩 추천 데이터베이스에 잘 반영됩니다.

---

### 5.3. Schema.org JSON-LD 구조화 데이터 실전 코드

구조화 데이터는 검색 로봇과 LLM 크롤러에게 웹페이지의 엔티티(Entity)와 의미를 기계 판독 가능한 표준 규격으로 전달하는 핵심 기술입니다.

본 프로젝트의 `src/index.html`에 실제로 적용된 `SoftwareApplication` 구조화 데이터 예제입니다:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "웹사이트 접근성 및 성능 점검 도구 (Fresnel)",
  "alternateName": "Website Accessibility & Performance Checker",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web",
  "description": "Lighthouse 결과 및 소스 코드를 바탕으로 성능, 웹 접근성, 보안, SEO 결함을 정밀 분석하고 원자적 Git 커밋 및 PR을 자동 생성하는 도구.",
  "inLanguage": ["ko", "en"],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  },
  "featureList": [
    "웹 접근성(WCAG AA) 정적 분석 및 자동 수정",
    "Core Web Vitals (LCP, CLS, FCP) 성능 최적화 패치",
    "Lighthouse JSON(LHR) 리포트 1:1 심층 분석",
    "DOM XSS 및 웹 보안 취약점 경량 스캔",
    "터미널 1-클릭 Git 커밋 적용 및 GitHub PR 생성"
  ],
  "author": {
    "@type": "Person",
    "name": "djai32521",
    "url": "https://github.com/djai32521"
  }
}
</script>
```

---

### 5.4. 실무 개발자를 위한 성능 & 접근성 핵심 체크리스트

| 점검 영역 | 핵심 규칙 | 실전 적용 코드 예시 | 기대 효과 |
| :--- | :--- | :--- | :--- |
| **성능 (LCP)** | 웹 폰트 로드 최적화 | `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`<br>`font-display: swap;` | FOIT(글꼴 깜빡임) 방지, FCP/LCP 최대 600ms 단축 |
| **성능 (CLS)** | 이미지 크기 명시 | `<img src="hero.webp" width="1200" height="630" style="aspect-ratio: 1200/630" />` | 레이아웃 밀림 지수(CLS) 0.00 달성 |
| **접근성 (A11y)** | 본문 건너뛰기 링크 | `<a class="skip-link" href="#main-content">본문 바로가기</a>` | 키보드 사용자의 탐색 시간 80% 단축 (WCAG 2.4.1) |
| **접근성 (A11y)** | 포커스 링 보존 | `button:focus-visible { outline: 2px solid #713fb9; outline-offset: 2px; }` | 키보드 내비게이션 시각 피드백 보장 (WCAG 2.4.7) |
| **보안 (Security)** | DOM XSS 방어 | `el.textContent = userInput;`<br>`// 또는 DOMPurify.sanitize(html)` | 비신뢰 입력으로 인한 클라이언트 세션 탈취 차단 |
| **SEO / 소셜** | 메타 태그 최적화 | `<meta name="description" content="120~160자의 정밀한 요약문">`<br>`<meta property="og:title" ...>` | 클릭률(CTR) 향상 및 SNS 공유 카드 자동 생성 |

---

## 6. GitHub Pages 정적 배포 및 클라이언트 폴백 아키텍처

많은 개발자들이 백엔드(Node.js / Python)가 포함된 웹 애플리케이션을 GitHub Pages에 배포할 때 404 라우팅 오류나 API 호출 실패 문제를 겪습니다. GitHub Pages는 순수 정적 파일(HTML, CSS, JS)만을 호스팅하기 때문입니다.

본 프로젝트에서는 이를 해결하기 위해 **이중 실행 엔진(Hybrid Dual-Engine)**을 구축했습니다:

1. **풀스택 환경 (Google Cloud Run / 로컬 Node 서버):**
   - Express 백엔드가 동작하며 실제 Gemini Managed Agent API와 통신하여 실시간 저장소 분석 수행.
2. **정적 호스팅 환경 (GitHub Pages):**
   - 백엔드 엔드포인트(`/api/audit/*`) 호출 시 네트워크 실패(404)를 감지하면, Angular 서비스 내부의 `startClientSideSimulation()` 엔진이 즉시 가동.
   - 실제와 동일한 텔레메트리 진행 애니메이션, 7개의 정밀 커밋 생성, 인터랙티브 Diff 뷰어, `.patch` 다운로드, 그리고 Base64 인코딩 기반의 단일 쉘 명령어를 클라이언트 사이드에서 즉각 연산하여 제공.

### 배포 URL 및 소스 코드 저장소
- **GitHub Pages 공식 배포 URL:** [https://djai32521.github.io/Website_Checker/](https://djai32521.github.io/Website_Checker/)
- **GitHub 오픈소스 저장소:** [https://github.com/djai32521/Website_Checker](https://github.com/djai32521/Website_Checker)

---

## 7. 맺음말: AI 코딩 에이전트와 웹 프론트엔드의 미래

지금까지 Google AI Studio와 Gemini를 활용하여 **웹사이트 접근성·성능·보안 점검 도구**를 구축한 과정과, 현대 웹 개발자가 반드시 알아두어야 할 **AEO·GEO·SEO 검색 최적화 전략**을 자세히 살펴보았습니다.

이제 AI는 단순히 채팅창에서 질문에 답해주는 단계를 넘어, **"Lighthouse 진단 결과를 읽고, 소스 코드의 결함을 분석하며, 정확한 Git 커밋과 PR을 생성해 개발자의 생산성을 10배 끌어올리는 자율 에이전트"**로 진화하고 있습니다.

이 글에서 다룬 소스 코드와 배포 결과물을 직접 체험해보시고, 여러분의 웹 프로젝트에도 최신 성능 최적화와 생성형 AI 검색(GEO) 전략을 적극적으로 도입해보시길 권장합니다!

---
*작성자: djai32521 | 기술 스택: Google AI Studio, Gemini 2.5/Managed Agent, Angular 19/21, Node.js Express, Tailwind CSS, TypeScript*
