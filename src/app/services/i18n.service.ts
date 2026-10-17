import { Injectable, computed, signal } from '@angular/core';

export type AppLang = 'ko' | 'en';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  /**
   * Default language is Korean ('ko') as requested by user.
   * Can be toggled to English ('en') and persisted in localStorage.
   */
  readonly currentLang = signal<AppLang>(this.getInitialLanguage());

  readonly isKorean = computed(() => this.currentLang() === 'ko');

  private getInitialLanguage(): AppLang {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('fresnel_lang');
      if (saved === 'en' || saved === 'ko') {
        return saved;
      }
    }
    // Default is Korean
    return 'ko';
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
    const lang = this.currentLang();
    const table = lang === 'ko' ? KO_TRANSLATIONS : EN_TRANSLATIONS;
    let text = table[key] || EN_TRANSLATIONS[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  /**
   * Translates or adapts commit titles to Korean when Korean is selected
   */
  translateCommitTitle(title: string): string {
    if (this.currentLang() === 'en') return title;

    const lower = title.toLowerCase();
    if (lower.includes('preconnect') || lower.includes('font-display')) {
      return '웹 폰트 preconnect 리소스 힌트 추가 및 font-display:swap 적용';
    }
    if (lower.includes('srcset') || lower.includes('hero image') || lower.includes('dimensions')) {
      return '히어로 이미지 반응형 srcset 및 명시적 가로/세로 규격(CLS 방지) 추가';
    }
    if (lower.includes('skip link') || lower.includes('focus outlines') || lower.includes('contrast')) {
      return '본문 바로가기(Skip-link) 및 WCAG 고대비 포커스 아웃라인 추가';
    }
    if (lower.includes('innerhtml') || lower.includes('xss') || lower.includes('sanitize')) {
      return 'DOMPurify 정책을 적용한 위험 innerHTML XSS 싱크 소독';
    }
    if (lower.includes('security-policy') || lower.includes('content-type-options') || lower.includes('csp')) {
      return 'Content-Security-Policy 및 X-Content-Type-Options 보안 헤더 강화';
    }
    if (lower.includes('meta description') || lower.includes('structured') || lower.includes('json-ld') || lower.includes('seo')) {
      return '검색엔진 최적화 메타 설명 태그 및 Schema.org JSON-LD 구조화 데이터 추가';
    }
    if (lower.includes('aria-label') || lower.includes('button')) {
      return '스크린 리더 사용자를 위한 식별 가능한 버튼 aria-label 추가';
    }
    if (lower.includes('render-blocking') || lower.includes('defer')) {
      return '렌더링 차단 스크립트 제거 및 비동기 defer 로드 적용';
    }
    if (lower.includes('aspect-ratio') || lower.includes('layout shift')) {
      return '이미지 컨테이너 aspect-ratio 적용으로 누적 레이아웃 이동(CLS) 제거';
    }

    return title;
  }

  /**
   * Translates or adapts commit summaries to Korean when Korean is selected
   */
  translateCommitSummary(summary: string): string {
    if (this.currentLang() === 'en') return summary;

    const lower = summary.toLowerCase();
    if (lower.includes('preconnect') || lower.includes('font-display')) {
      return '구글 폰트 도메인에 대한 사전 연결(preconnect) 힌트를 삽입하고, 동기식 폰트 로드로 인한 텍스트 깜빡임(FOIT)을 방지하도록 font-display:swap 속성을 적용했습니다.';
    }
    if (lower.includes('srcset') || lower.includes('hero image') || lower.includes('dimensions')) {
      return '반응형 디바이스 해상도에 맞춘 srcset 및 sizes 속성을 지정하고, 이미지 고유 가로/세로 너비를 명시하여 레이아웃 밀림(CLS) 현상을 완전히 해결했습니다.';
    }
    if (lower.includes('skip link') || lower.includes('focus outline')) {
      return '키보드 및 스크린 리더 사용자가 본문으로 즉시 이동할 수 있는 건너뛰기 링크를 추가하고, 포커스 시 WCAG AA 기준을 충족하는 2px 고대비 테두리를 제공합니다.';
    }
    if (lower.includes('xss') || lower.includes('dompurify') || lower.includes('sanitize')) {
      return '사용자 입력값이 직접 렌더링되던 비안전한 innerHTML 대입 지점을 감지하여, DOMPurify 살균 및 신뢰할 수 있는 텍스트 노드 처리로 대체했습니다.';
    }
    if (lower.includes('meta') || lower.includes('seo') || lower.includes('schema.org')) {
      return '120~160자의 정밀한 meta description과 OpenGraph 소셜 카드, 구글 및 AI 검색엔진이 직접 인용할 수 있는 Schema.org JSON-LD 정형 데이터를 주입했습니다.';
    }

    return summary;
  }

  /**
   * Translates telemetry step headlines to Korean
   */
  translateTelemetryHeadline(headline: string): string {
    if (this.currentLang() === 'en') return headline;

    const lower = headline.toLowerCase();
    if (lower.includes('inspect repository') || lower.includes('source tree')) {
      return '저장소 소스 트리 및 메타데이터 정밀 분석';
    }
    if (lower.includes('audit performance') || lower.includes('lcp') || lower.includes('render-blocking')) {
      return '성능 핵심 지표(LCP, CLS, 렌더링 차단) 점검';
    }
    if (lower.includes('audit accessibility') || lower.includes('wcag') || lower.includes('a11y')) {
      return '웹 접근성 표준(WCAG AA, 스킵 링크, 명도 대비) 점검';
    }
    if (lower.includes('scan security') || lower.includes('sinks') || lower.includes('xss')) {
      return '웹 애플리케이션 보안 취약점(XSS, 오픈 리다이렉트) 진단';
    }
    if (lower.includes('seo') || lower.includes('best practices') || lower.includes('meta')) {
      return '검색엔진 최적화(SEO, AEO, GEO) 및 웹 모범 사례 분석';
    }
    if (lower.includes('synthesize') || lower.includes('commits')) {
      return '원자적 Git 수정 커밋 및 패치 번들 생성';
    }
    return headline;
  }

  /**
   * Translates telemetry narrative to Korean
   */
  translateTelemetryNarrative(narrative: string): string {
    if (this.currentLang() === 'en') return narrative;

    const lower = narrative.toLowerCase();
    if (lower.includes('scanning templates') || lower.includes('stylesheets')) {
      return '템플릿, 스타일시트, 라우팅 및 번들링 파이프라인 전반을 분석하여 주요 성능 병목과 접근성 결함을 감지하고 있습니다.';
    }
    if (lower.includes('inspecting font') || lower.includes('resource hints')) {
      return '웹 폰트 로드 전략과 렌더링 차단 CSS 요소를 분석하여 LCP 및 FCP 지연 요소를 격리하고 있습니다.';
    }
    if (lower.includes('verifying keyboard') || lower.includes('skip-link')) {
      return '키보드 탭 내비게이션, 스킵 링크 유무, 포커스 가시성 및 ARIA 레이블 적합성을 검증하고 있습니다.';
    }
    if (lower.includes('auditing dom xss') || lower.includes('client secrets')) {
      return '클라이언트 사이드 XSS 싱크, 하드코딩된 토큰 스토리지 패턴, 안전하지 않은 리다이렉트 흐름을 점검하고 있습니다.';
    }
    return narrative;
  }
}

const KO_TRANSLATIONS: Record<string, string> = {
  // Topbar
  skipLink: '본문으로 건너뛰기',
  backBtn: '이전 단계로 돌아가기',
  stepCounterRun1: '1회차 · {step}단계 / 4단계',
  stepCounterRun2: '2회차 (Lighthouse JSON) · {step}단계 / 3단계',
  themeToggle: '다크 / 라이트 모드 전환',
  langToggle: 'English / 한국어 전환',

  // Step 1: Intro
  brandTitle: '웹사이트 접근성 및 성능 점검 도구',
  brandLoreHeader: '오귀스탱 장 프레넬 (Augustin-Jean Fresnel, 1788–1827)',
  brandLoreQuote:
    '“단일 무거운 유리 돔 대신, 동심원 계단식 프리즘 링이 사방으로 흩어지는 빛을 모아 수 마일을 뻗어나가는 하나의 강력하고 정교한 광선으로 굴절시킵니다.”',
  brandLoreDesc:
    '프레넬 렌즈가 등대의 빛을 하나로 모아 짙은 안개 속 항해를 인도하듯, 본 도구는 광범위한 Lighthouse 및 웹 점검 지표를 소스 코드 레벨로 투영합니다. 성능, 웹 접근성, 모범 사례, SEO, 웹 보안 취약점을 정밀 분석하여 즉시 적용 가능한 원자적 Git 커밋으로 집약합니다.',
  repoLabel: 'GitHub 저장소 URL',
  repoPlaceholder: 'https://github.com/소유자/저장소 주소 입력',
  startAuditBtn: '감사 시작',
  tryDemoBtn: '또는 데모 모드로 체험하기',
  legalDisclaimer:
    '본 기능을 사용함으로써 업로드하는 소스 코드 및 데이터에 대한 적법한 권리를 보유하고 있음을 확인합니다. 타인의 지식재산권 또는 개인정보를 침해하는 콘텐츠를 생성하지 마십시오. 본 생성형 AI 서비스 이용은 Google AI 사용 정책 및 약관을 준수합니다.',

  // Step 2: Working
  auditingAccessibility: '웹 접근성 정밀 점검 중',
  auditingPerformance: '성능 최적화 지표 분석 중',
  auditingSecurity: '웹 애플리케이션 보안 취약점 진단 중',
  auditingSeo: 'SEO 및 검색엔진 친화도 분석 중',
  inspectingRepo: '저장소 소스 트리 및 컴포넌트 정밀 점검 진행 중',
  analyzingLhrFor: 'Lighthouse 실행 결과(LHR) 정밀 분석 중: {repo}',
  inspectingRepoFor: '저장소 분석 중: {repo}',
  skipToReport: '결과 보고서로 바로가기 →',
  completedNotes: '완료된 정밀 검사 항목',

  // Step 3: Report
  reportTitleStatic: '웹사이트 코드 감사 결과 보고서',
  reportTitleLhr: 'Lighthouse JSON 심층 감사 보고서',
  reportSubStatic:
    '풀 리퀘스트(PR)에 포함하거나 로컬 패치 파일로 다운로드할 원자적 수정 커밋들을 선택하세요. 필요 시 2회차에서 Lighthouse JSON 리포트를 업로드하여 실측 성능 지표 기반 2차 감사를 진행할 수 있습니다.',
  reportSubLhr:
    'Lighthouse 실행 결과(LHR) JSON의 실패 지표 및 DOM 셀렉터에 1:1로 매핑된 수정 코드 커밋입니다.',
  improvedCategoriesTitle: '코드로 개선된 핵심 영역',
  improvedCategoriesNote: '정적 코드 감사 · 커밋 검증 완료',
  improvedWithCode: '코드로 개선됨',
  commitsCount: '{count}개 커밋',

  // Categories
  catAll: '전체',
  catPerformance: '성능',
  catAccessibility: '웹 접근성',
  catBestPractices: '모범 사례',
  catSeo: 'SEO',
  catSecurity: '웹 보안 취약점',
  badgeLight: '경량',

  selectAll: '전체 선택',
  clearAll: '선택 해제',

  securityNoteTitle: '웹 애플리케이션 보안 취약점 점검',
  securityNoteDesc:
    'DOM XSS 취약점, 클라이언트 시크릿 노출, 신뢰할 수 없는 리다이렉트 등 웹 애플리케이션의 대표적인 보안 위험 패턴을 진단하는 경량 정적 점검입니다. (Lighthouse JSON 단독 실행 시에는 제외됩니다.)',

  viewDiff: '코드 변경사항 보기',
  hideDiff: '변경사항 숨기기',
  categoryAndAuditImproved: '개선된 카테고리 및 감사 항목:',
  jsonTargetNode: 'JSON 타겟 DOM 셀렉터:',

  secondRunBannerBadge: '2회차 · 심층 분석',
  secondRunBannerTitle: 'Lighthouse JSON 리포트가 있으신가요?',
  secondRunBannerDesc:
    'Lighthouse 실행 결과(LHR) .json 파일을 업로드하면 실패한 지표와 DOM 셀렉터를 정확히 겨냥한 2차 심층 코드 수정을 진행합니다.',
  secondRunBannerBtn: 'Lighthouse JSON 추가하기 →',

  applyCommitsLocally: '로컬 환경에 커밋 적용하기',
  patchGeneratedDesc: '선택하신 커밋들로 구성된 패치 파일이 생성되었습니다:',
  copyPatchBtn: '패치 내용 복사',
  copiedPatchBtn: '패치 내용 복사됨!',
  downloadPatchAgain: '패치 파일 다시 다운로드',

  step1Branch: '1. 새 브랜치 생성',
  step2Apply: '2. 패치 적용',
  step3Push: '3. 검증 및 푸시',
  copyBtn: '복사',
  copiedBtn: '복사됨!',

  selectedSummary: '총 {total}개 중 {selected}개 선택됨',
  downloadPatch: '패치 파일 다운로드 (.diff)',
  createPr: '풀 리퀘스트(PR) 생성',
  preparingPr: '풀 리퀘스트 준비 중...',

  // Step 4: PR
  prDoneTitle: '터미널에서 1-클릭으로 풀 리퀘스트 생성',
  prDoneSub:
    '아래 터미널 명령어를 로컬 저장소 터미널에 붙여넣으면 새 브랜치 생성, git am을 통한 원자적 커밋 자동 적용, 원격 푸시 및 gh pr create를 통한 PR 생성까지 한 번에 완료됩니다.',
  tabInline: '단일 실행형 (인라인 패치 + PR 생성)',
  tabShort: '다운로드된 .patch 파일 활용형',
  copyTerminalCmd: '터미널 명령어 복사',
  copiedTerminalCmd: '✓ 클립보드에 복사 완료!',
  includedCommits: '포함된 커밋 목록',
  notQuiteDone: '아직 점검할 항목이 남으셨나요?',
  notQuiteDoneDesc:
    'Lighthouse 실행 결과(LHR) .json 리포트를 업로드하여 실제 성능 지표에 맞춘 2차 정밀 수정을 진행해보세요.',
  addLhrBtn: 'Lighthouse JSON 리포트 추가',
  backToReport: '← 결과 보고서로 돌아가기',
  newAudit: '새 감사 시작',

  // Step 5: LHR Upload
  lhrInputBadge: '2회차 · Lighthouse JSON 심층 분석',
  lhrInputTitle: 'Lighthouse JSON 리포트 추가',
  lhrInputSubtitle:
    'Lighthouse Result (LHR) .json 파일을 제공하여 실패한 감사 항목(audits), 절감 예상 시간(metricSavings), DOM 셀렉터에 대응하는 맞춤형 코드 패치를 생성합니다.',
  uploadJsonFile: 'JSON 파일 업로드',
  loadSampleLhr: '샘플 Lighthouse JSON 로드',
  fileLoaded: '로드된 파일: ',
  runLhrAuditBtn: 'Lighthouse JSON 기반 코드 감사 실행'
};

const EN_TRANSLATIONS: Record<string, string> = {
  skipLink: 'Skip to main content',
  backBtn: 'Go to previous step',
  stepCounterRun1: 'Run 1 · Step {step} / 4',
  stepCounterRun2: 'Run 2 (Lighthouse JSON) · Step {step} / 3',
  themeToggle: 'Toggle light or dark mode',
  langToggle: 'Toggle English / Korean',

  brandTitle: 'Website Accessibility & Performance Checker',
  brandLoreHeader: 'Augustin-Jean Fresnel (1788–1827)',
  brandLoreQuote:
    '“Instead of a single heavy dome of glass, concentric stepped prism rings capture scattered light from every angle and refract it into one extraordinary, miles-long beam.”',
  brandLoreDesc:
    'Just as the Fresnel lens concentrates a lighthouse’s beam to guide ships through fog, Fresnel takes the broad inspection beam of Lighthouse and focuses it onto raw source code—refining scattered issues across performance, accessibility, best practices, SEO, and light web application security findings into sharp, self-contained git commits.',
  repoLabel: 'GitHub repository URL',
  repoPlaceholder: 'https://github.com/owner/repository',
  startAuditBtn: 'Start audit',
  tryDemoBtn: 'Or try demo mode',
  legalDisclaimer:
    'By using this feature, you confirm that you have the necessary rights to any content that you upload. Do not generate content that infringes on others’ intellectual property or privacy rights. Your use of this generative AI service is subject to our Prohibited Use Policy.',

  auditingAccessibility: 'Auditing accessibility',
  auditingPerformance: 'Auditing performance',
  auditingSecurity: 'Scanning security',
  auditingSeo: 'Checking best practices & SEO',
  inspectingRepo: 'Inspecting repository code',
  analyzingLhrFor: 'Analyzing Lighthouse report for {repo}',
  inspectingRepoFor: 'Inspecting {repo}',
  skipToReport: 'Skip to report →',
  completedNotes: 'Completed inspection notes',

  reportTitleStatic: 'Code audit report',
  reportTitleLhr: 'Lighthouse JSON audit report',
  reportSubStatic:
    'Select the static code commits you would like to include in a pull request, download as a patch, or continue to a second run with a Lighthouse JSON report.',
  reportSubLhr:
    'Targeted code commits mapped directly to failing audits and DOM selectors in your Lighthouse Result (LHR) JSON report.',
  improvedCategoriesTitle: 'Categories improved with code',
  improvedCategoriesNote: 'Static code audit · verified by commit coverage',
  improvedWithCode: 'Improved with code',
  commitsCount: '{count} commits',

  catAll: 'All',
  catPerformance: 'Performance',
  catAccessibility: 'Accessibility',
  catBestPractices: 'Best practices',
  catSeo: 'SEO',
  catSecurity: 'Web application security findings',
  badgeLight: 'Light',

  selectAll: 'Select all',
  clearAll: 'Clear',

  securityNoteTitle: 'Web application security findings',
  securityNoteDesc:
    'A lightweight static scan for top common web application security issues and unsafe patterns (DOM XSS sinks, exposed client secrets or token storage, and unvalidated open redirects) rather than a deep security audit. Excluded during Lighthouse JSON runs.',

  viewDiff: 'View diff',
  hideDiff: 'Hide diff',
  categoryAndAuditImproved: 'Category and audit improved:',
  jsonTargetNode: 'JSON target node:',

  secondRunBannerBadge: 'Run 2 · deeper analysis',
  secondRunBannerTitle: 'Have a Lighthouse report JSON?',
  secondRunBannerDesc:
    'Add a Lighthouse Result (LHR) .json file to run a second pass that identifies which categories improve with the code and targets specific failing LHR audits and DOM selectors.',
  secondRunBannerBtn: 'Add Lighthouse JSON →',

  applyCommitsLocally: 'Apply commits locally',
  patchGeneratedDesc: 'has been generated for your selected commits:',
  copyPatchBtn: 'Copy .patch content',
  copiedPatchBtn: 'Copied .patch!',
  downloadPatchAgain: 'Download .patch again',

  step1Branch: '1. Create a branch',
  step2Apply: '2. Apply patch',
  step3Push: '3. Verify and push',
  copyBtn: 'Copy',
  copiedBtn: 'Copied',

  selectedSummary: '{selected} of {total} selected',
  downloadPatch: 'Download .patch',
  createPr: 'Create pull request',
  preparingPr: 'Preparing pull request...',

  prDoneTitle: 'Submit pull request from terminal',
  prDoneSub:
    'Copy and run this command in your local repository terminal to create the branch, apply all selected atomic commits via git am, push, and open your pull request using your local git and gh credentials.',
  tabInline: 'Self-contained (inline patch + gh pr)',
  tabShort: 'With downloaded .patch file',
  copyTerminalCmd: 'Copy terminal command',
  copiedTerminalCmd: '✓ Copied to clipboard!',
  includedCommits: 'Included commits',
  notQuiteDone: 'Not quite done yet?',
  notQuiteDoneDesc:
    'Upload or paste a Lighthouse Result (LHR) .json report to see which categories improve with the code and generate targeted fixes for failing LHR audits.',
  addLhrBtn: 'Add Lighthouse report JSON',
  backToReport: '← Back to report',
  newAudit: 'New audit',

  lhrInputBadge: 'Second run · Lighthouse JSON',
  lhrInputTitle: 'Add Lighthouse report JSON',
  lhrInputSubtitle:
    'Provide a Lighthouse Result (LHR) .json file to correlate failing audits, metricSavings, and DOM selectors against the repository source code.',
  uploadJsonFile: 'Upload .json file',
  loadSampleLhr: 'Load sample Lighthouse JSON',
  fileLoaded: 'Loaded: ',
  runLhrAuditBtn: 'Run Lighthouse JSON audit'
};
