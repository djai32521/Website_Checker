import {
  DestroyRef,
  Injectable,
  computed,
  effect,
  inject,
  linkedSignal,
  signal
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AuditCommit,
  AuditMode,
  AuditSession,
  FlowStep,
  FresnelLore,
  LighthouseCategory,
  PatchBundle,
  PullRequestResult,
  TelemetryStep
} from '../models/audit.model';
import { I18nService, AppLang } from './i18n.service';

export const DEFAULT_SAMPLE_LHR_JSON = JSON.stringify(
  {
    lighthouseVersion: '12.2.0',
    fetchTime: '2026-10-06T13:35:00.000Z',
    requestedUrl: 'https://lumina-web.app/',
    finalDisplayedUrl: 'https://lumina-web.app/',
    categories: {
      performance: {
        id: 'performance',
        title: 'Performance',
        score: 0.68,
        auditRefs: [
          { id: 'largest-contentful-paint-element', weight: 25, group: 'diagnostics' },
          { id: 'render-blocking-resources', weight: 15, group: 'load-opportunities' },
          { id: 'unsized-images', weight: 10, group: 'diagnostics' }
        ]
      },
      accessibility: {
        id: 'accessibility',
        title: 'Accessibility',
        score: 0.74,
        auditRefs: [
          { id: 'color-contrast', weight: 7, group: 'a11y-color-contrast' },
          { id: 'button-name', weight: 10, group: 'a11y-names-labels' }
        ]
      },
      'best-practices': {
        id: 'best-practices',
        title: 'Best Practices',
        score: 0.83,
        auditRefs: [{ id: 'csp-xss', weight: 5, group: 'trust-safety' }]
      },
      seo: {
        id: 'seo',
        title: 'SEO',
        score: 0.82,
        auditRefs: [{ id: 'structured-data', weight: 5, group: 'seo-content' }]
      }
    },
    audits: {
      'largest-contentful-paint-element': {
        id: 'largest-contentful-paint-element',
        title: 'Largest Contentful Paint element',
        score: 0.28,
        scoreDisplayMode: 'metricSavings',
        numericValue: 3420,
        displayValue: '3,420 ms',
        metricSavings: { LCP: 1180 },
        details: {
          type: 'table',
          items: [
            {
              node: {
                selector: 'section.hero-stage > picture > img.hero-banner-media',
                snippet: '<img class="hero-banner-media" src="/assets/hero-lens.jpg">'
              }
            }
          ]
        }
      },
      'render-blocking-resources': {
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        score: 0.42,
        scoreDisplayMode: 'metricSavings',
        displayValue: 'Potential savings of 640 ms',
        metricSavings: { FCP: 640, LCP: 480 }
      },
      'unsized-images': {
        id: 'unsized-images',
        title: 'Image elements do not have explicit width and height',
        score: 0.0,
        scoreDisplayMode: 'binary',
        displayValue: '3 elements found',
        metricSavings: { CLS: 0.14 }
      },
      'color-contrast': {
        id: 'color-contrast',
        title: 'Background and foreground colors do not have a sufficient contrast ratio',
        score: 0.0,
        scoreDisplayMode: 'binary',
        displayValue: '2 elements fail WCAG AA (3.1:1 vs 4.5:1)'
      }
    }
  },
  null,
  2
);

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  readonly i18n = inject(I18nService);
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly lang = computed<AppLang>(() => this.i18n.currentLang());
  readonly isKorean = computed<boolean>(() => this.i18n.isKorean());

  readonly step = signal<FlowStep>(1);
  readonly isTransitioning = signal<boolean>(false);
  readonly theme = signal<'light' | 'dark'>('light');
  readonly mode = signal<AuditMode>('live');

  readonly lore = signal<FresnelLore>({
    name: 'Fresnel',
    pronunciation: '/freɪˈnɛl/',
    origin:
      'Named after French physicist Augustin-Jean Fresnel (1788–1827), inventor of the stepped concentric lighthouse lens.',
    quote:
      '“Instead of a single heavy dome of glass, concentric stepped prism rings capture scattered light from every angle and refract it into one extraordinary, miles-long beam.”',
    explanation:
      'Just as the Fresnel lens concentrates a lighthouse’s beam to guide ships through fog, Fresnel takes the broad inspection beam of Lighthouse and focuses it onto raw source code—refining scattered issues across performance, accessibility, best practices, SEO, and light web application security findings into sharp, self-contained git commits.'
  });

  readonly session = signal<AuditSession | null>(null);
  readonly selectedCommitIds = signal<Set<string>>(new Set());
  readonly expandedDiffIds = signal<Set<string>>(new Set());

  private readonly sessionScopeKey = computed(
    () => `${this.session()?.id ?? 'init'}:${this.session()?.runPhase ?? 'static'}`
  );

  /** Automatically resets to 'all' whenever a new session or runPhase begins, while remaining writable */
  readonly categoryFilter = linkedSignal<string, LighthouseCategory>({
    source: this.sessionScopeKey,
    computation: () => 'all'
  });

  readonly patchBundle = signal<PatchBundle | null>(null);
  readonly isPatchDrawerOpen = signal<boolean>(false);
  readonly prResult = signal<PullRequestResult | null>(null);
  readonly isCreatingPr = signal<boolean>(false);

  /** Automatically defaults to 'inline' whenever a new PR bundle is generated, while remaining writable */
  readonly prCliMode = linkedSignal<PullRequestResult | null, 'inline' | 'short'>({
    source: this.prResult,
    computation: () => 'inline'
  });

  readonly lhrJsonInput = signal<string>('');
  readonly lhrFileName = signal<string>('');

  readonly allCommits = computed<AuditCommit[]>(() => this.session()?.commits ?? []);

  readonly filteredCommits = computed<AuditCommit[]>(() => {
    const commits = this.allCommits();
    const filter = this.categoryFilter();
    if (filter === 'all') return commits;
    return commits.filter((c) => c.category === filter);
  });

  readonly selectedCount = computed<number>(() => this.selectedCommitIds().size);
  readonly totalCommitsCount = computed<number>(() => this.allCommits().length);

  readonly categoryCounts = computed<Record<LighthouseCategory, number>>(() => {
    const commits = this.allCommits();
    return {
      all: commits.length,
      performance: commits.filter((c) => c.category === 'performance').length,
      accessibility: commits.filter((c) => c.category === 'accessibility').length,
      'best-practices': commits.filter((c) => c.category === 'best-practices').length,
      seo: commits.filter((c) => c.category === 'seo').length,
      security: commits.filter((c) => c.category === 'security').length
    };
  });

  constructor() {
    const savedTheme =
      typeof localStorage !== 'undefined'
        ? (localStorage.getItem('fresnel-theme') as 'light' | 'dark' | null)
        : null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.theme.set(savedTheme);
    }

    effect(() => {
      const activeTheme = this.theme();
      this.document?.documentElement?.setAttribute('data-theme', activeTheme);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('fresnel-theme', activeTheme);
      }
    });

    this.destroyRef.onDestroy(() => this.stopPolling());
  }

  setTheme(nextTheme: 'light' | 'dark'): void {
    this.theme.set(nextTheme);
  }

  toggleTheme(): void {
    this.theme.update((current) => (current === 'light' ? 'dark' : 'light'));
  }

  transitionToStep(nextStep: FlowStep): void {
    if (this.step() === nextStep) return;
    this.isTransitioning.set(true);
    setTimeout(() => {
      this.step.set(nextStep);
      this.isTransitioning.set(false);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 240);
  }

  async startAudit(repoUrl: string, mode: AuditMode = 'live'): Promise<void> {
    this.stopPolling();
    this.mode.set(mode);
    this.isPatchDrawerOpen.set(false);

    try {
      const response = await firstValueFrom(
        this.http.post<AuditSession>('/api/audit/start', {
          repoUrl: mode === 'demo' ? 'https://github.com/fresnel-sandbox/lumina-web-app' : repoUrl,
          mode,
          branch: 'main',
          categories: ['performance', 'accessibility', 'best-practices', 'seo', 'security']
        })
      );

      this.session.set(response);
      this.transitionToStep(2);

      this.pollTimer = setInterval(() => {
        void this.pollStatus();
      }, 680);
    } catch {
      // Fallback for static hosting (e.g. GitHub Pages) where /api/audit does not exist
      this.startClientSideSimulation(repoUrl, mode, 'static');
    }
  }

  openLighthouseJsonStep(): void {
    this.isPatchDrawerOpen.set(false);
    if (!this.lhrJsonInput()) {
      this.loadSampleLhrJson();
    }
    this.transitionToStep(5);
  }

  loadSampleLhrJson(): void {
    this.lhrJsonInput.set(DEFAULT_SAMPLE_LHR_JSON);
    this.lhrFileName.set('lighthouse-report-lhr.json (sample LHR)');
  }

  async startLhrAudit(): Promise<void> {
    this.stopPolling();
    this.isPatchDrawerOpen.set(false);
    const currentId = this.session()?.id || 'demo';

    try {
      const response = await firstValueFrom(
        this.http.post<AuditSession>(`/api/audit/${currentId}/lhr-start`, {
          lhrJson: this.lhrJsonInput() || DEFAULT_SAMPLE_LHR_JSON
        })
      );

      this.session.set(response);
      this.transitionToStep(6);

      this.pollTimer = setInterval(() => {
        void this.pollStatus();
      }, 680);
    } catch {
      // Fallback for static hosting (e.g. GitHub Pages)
      const currentRepo = this.session()?.repo?.url || 'https://github.com/fresnel-sandbox/lumina-web-app';
      this.startClientSideSimulation(currentRepo, 'demo', 'lhr');
    }
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async pollStatus(): Promise<void> {
    const current = this.session();
    if (!current) return;

    try {
      const updated = await firstValueFrom(
        this.http.get<AuditSession>(`/api/audit/${current.id}/status`)
      );
      this.session.set(updated);

      if (updated.status === 'completed') {
        this.stopPolling();
        setTimeout(() => {
          if (this.step() === 2) {
            this.prepareReportState(updated);
            this.transitionToStep(3);
          } else if (this.step() === 6) {
            this.prepareReportState(updated);
            this.transitionToStep(7);
          }
        }, 650);
      }
    } catch {
      // If polling fails on static host, ignore or complete
    }
  }

  async skipToReport(): Promise<void> {
    const current = this.session();
    if (!current) return;
    this.stopPolling();

    try {
      const updated = await firstValueFrom(
        this.http.post<AuditSession>(`/api/audit/${current.id}/fast-forward`, {})
      );
      this.session.set(updated);
      this.prepareReportState(updated);
      this.transitionToStep(updated.runPhase === 'lhr' ? 7 : 3);
    } catch {
      // Fast-forward client-side
      const completedSession = { ...current, status: 'completed' as const, progressPercent: 100 };
      this.session.set(completedSession);
      this.prepareReportState(completedSession);
      this.transitionToStep(completedSession.runPhase === 'lhr' ? 7 : 3);
    }
  }

  private startClientSideSimulation(rawUrl: string, mode: AuditMode, runPhase: 'static' | 'lhr'): void {
    const cleanUrl = (rawUrl || 'https://github.com/fresnel-sandbox/lumina-web-app').trim();
    const parts = cleanUrl.replace(/https?:\/\/github\.com\//, '').split('/');
    const owner = parts[0] || 'fresnel-sandbox';
    const repo = parts[1] || 'lumina-web-app';
    const fullName = `${owner}/${repo}`;

    const commits = this.generateSampleCommits(fullName, runPhase);
    const steps = this.generateSampleSteps(fullName, runPhase);

    const categoriesImproved = [
      { id: 'performance', label: 'Performance', improved: true, commitsCount: 2 },
      { id: 'accessibility', label: 'Accessibility', improved: true, commitsCount: 2 },
      { id: 'best-practices', label: 'Best practices', improved: true, commitsCount: 1 },
      { id: 'seo', label: 'SEO', improved: true, commitsCount: 1 },
      ...(runPhase === 'lhr' ? [] : [{ id: 'security', label: 'Web application security findings (light)', improved: true, commitsCount: 1 }])
    ];

    const initialSession: AuditSession = {
      id: 'sim-' + Date.now(),
      interactionId: 'int-' + Math.random().toString(36).slice(2, 9),
      mode,
      runPhase,
      categoriesImproved,
      status: 'in_progress',
      progressPercent: 15,
      repo: {
        owner,
        repo,
        fullName,
        url: `https://github.com/${fullName}`,
        isDemo: mode === 'demo'
      },
      branch: 'main',
      categories: ['performance', 'accessibility', 'best-practices', 'seo', 'security'],
      currentStep: steps[0],
      steps: [steps[0]],
      totalSteps: steps.length,
      commits,
      totalCommits: commits.length,
      pr: null
    };

    this.session.set(initialSession);
    this.transitionToStep(runPhase === 'lhr' ? 6 : 2);

    let stepIndex = 0;
    this.pollTimer = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        const nextStep = steps[stepIndex];
        const current = this.session();
        if (current) {
          this.session.set({
            ...current,
            progressPercent: Math.min(90, Math.round((stepIndex / steps.length) * 100)),
            currentStep: nextStep,
            steps: [...current.steps, nextStep]
          });
        }
      } else {
        this.stopPolling();
        const current = this.session();
        if (current) {
          const finalSession = {
            ...current,
            status: 'completed' as const,
            progressPercent: 100
          };
          this.session.set(finalSession);
          this.prepareReportState(finalSession);
          setTimeout(() => {
            this.transitionToStep(runPhase === 'lhr' ? 7 : 3);
          }, 450);
        }
      }
    }, 750);
  }

  private generateSampleSteps(fullName: string, runPhase: 'static' | 'lhr'): TelemetryStep[] {
    if (runPhase === 'lhr') {
      return [
        {
          index: 0,
          phase: 'Auditing LHR JSON',
          category: 'performance',
          headline: 'Correlate Lighthouse metric savings with hero banner media',
          narrative: `Mapped largest-contentful-paint-element savings (1,180ms) against hero image template in ${fullName}.`
        },
        {
          index: 1,
          phase: 'Auditing accessibility audits',
          category: 'accessibility',
          headline: 'Inspect color-contrast violations and missing button names',
          narrative: 'Identified 2 failing WCAG AA contrast ratio elements and missing aria-labels.'
        },
        {
          index: 2,
          phase: 'Auditing best practices & SEO',
          category: 'best-practices',
          headline: 'Cross-reference unsized-images and structured data audits',
          narrative: 'Resolved CLS impact from missing width/height attributes and injected Schema.org JSON-LD.'
        },
        {
          index: 3,
          phase: 'Synthesizing git commits',
          category: 'all',
          headline: 'Generate atomic patches for failing Lighthouse audits',
          narrative: 'Constructed discrete commits targeting each failing audit ID with self-contained git diffs.'
        }
      ];
    }

    return [
      {
        index: 0,
        phase: 'Auditing performance',
        category: 'performance',
        headline: 'Inspect resource hints and font-display strategies',
        narrative: `Scanning document head and stylesheet loaders in ${fullName} for preconnect and non-blocking fonts.`
      },
      {
        index: 1,
        phase: 'Auditing accessibility',
        category: 'accessibility',
        headline: 'Verify skip link bypass and WCAG AA focus outlines',
        narrative: 'Checking keyboard navigation, skip-to-main landmark, and persistent focus-visible rings.'
      },
      {
        index: 2,
        phase: 'Scanning web application security',
        category: 'security',
        headline: 'Scan DOM XSS sinks, token storage, and open redirect URLs',
        narrative: 'Auditing innerHTML assignments, localStorage secrets, and window.location redirects.'
      },
      {
        index: 3,
        phase: 'Auditing best practices and SEO',
        category: 'seo',
        headline: 'Inspect viewport tags, meta descriptions, and Schema.org markup',
        narrative: 'Evaluating crawlability, OpenGraph social cards, and JSON-LD structured data.'
      }
    ];
  }

  private generateSampleCommits(fullName: string, runPhase: 'static' | 'lhr'): AuditCommit[] {
    const isLhr = runPhase === 'lhr';
    return [
      {
        id: 'c1',
        sha: '9a4b2c1',
        fullSha: '9a4b2c184d0b135e88402f1a94e8031d9237f814',
        category: 'performance',
        categoryLabel: 'Performance',
        ruleId: 'font-display-preconnect',
        title: 'Add preconnect resource hints and swap font-display strategy',
        commitMessage: 'perf: add preconnect resource hints and swap font-display strategy',
        summary: 'Added <link rel=“preconnect”> resource hints for Google Fonts and applied font-display:swap to prevent FOIT latency.',
        files: ['src/index.html', 'src/styles.css'],
        additions: 8,
        deletions: 2,
        author: 'Fresnel <fresnel@noreplies.github.com>',
        date: new Date().toUTCString(),
        body: 'Improves FCP and LCP scores by establishing early connections to font origins and enabling swap rendering.',
        diff: `diff --git a/src/index.html b/src/index.html\n--- a/src/index.html\n+++ b/src/index.html\n@@ -6,4 +6,7 @@\n+    <link rel="preconnect" href="https://fonts.googleapis.com" />\n+    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n     <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600&display=swap" />`
      },
      {
        id: 'c2',
        sha: '7f3e192',
        fullSha: '7f3e192120e8379f64a51189c423011388b09ad3',
        category: 'performance',
        categoryLabel: 'Performance',
        ruleId: 'hero-image-explicit-dimensions',
        title: 'Add responsive srcset attributes and explicit dimensions to hero image',
        commitMessage: 'perf: add responsive srcset attributes and explicit dimensions to hero image',
        summary: 'Specified intrinsic width and height dimensions and added responsive srcset to eliminate layout shifts (CLS 0.00).',
        files: ['src/app/hero.component.html'],
        additions: 6,
        deletions: 2,
        author: 'Fresnel <fresnel@noreplies.github.com>',
        date: new Date().toUTCString(),
        body: 'Eliminates Largest Contentful Paint reflow and layout shift penalties by reserving image aspect ratio in layout.',
        diff: `diff --git a/src/app/hero.component.html b/src/app/hero.component.html\n--- a/src/app/hero.component.html\n+++ b/src/app/hero.component.html\n@@ -2,3 +2,5 @@\n-<img src="/assets/hero.jpg" alt="Hero banner" class="hero-img" />\n+<img src="/assets/hero.jpg" srcset="/assets/hero-600.jpg 600w, /assets/hero-1200.jpg 1200w" sizes="(max-width: 768px) 100vw, 1200px" width="1200" height="630" alt="Fresnel Banner" class="hero-img" fetchpriority="high" />`
      },
      {
        id: 'c3',
        sha: '4d8a10b',
        fullSha: '4d8a10be697841bcfa10294711319cba0029b9f1',
        category: 'accessibility',
        categoryLabel: 'Accessibility',
        ruleId: 'a11y-skip-link-focus-outline',
        title: 'Add accessible skip link and persistent focus outlines',
        commitMessage: 'a11y: add accessible skip link and persistent focus outlines',
        summary: 'Introduced an accessible skip-to-main-content bypass link and high-contrast WCAG AA :focus-visible outlines.',
        files: ['src/index.html', 'src/styles.css'],
        additions: 14,
        deletions: 1,
        author: 'Fresnel <fresnel@noreplies.github.com>',
        date: new Date().toUTCString(),
        body: 'Allows keyboard and screen-reader users to skip repetitive header navigation directly to the primary application stage.',
        diff: `diff --git a/src/index.html b/src/index.html\n--- a/src/index.html\n+++ b/src/index.html\n@@ -12,2 +12,4 @@\n+  <a class="skip-link" href="#app-stage">Skip to main content</a>\n+  <main id="app-stage" tabindex="-1">`
      },
      {
        id: 'c4',
        sha: '2b5c77e',
        fullSha: '2b5c77e439001bfa82914029bc01923fa1284cc3',
        category: 'accessibility',
        categoryLabel: 'Accessibility',
        ruleId: 'a11y-accessible-name-buttons',
        title: 'Add explicit aria-label attributes to icon buttons',
        commitMessage: 'a11y: add explicit aria-label attributes to icon buttons',
        summary: 'Provided accessible names for interactive icon buttons missing text labels, meeting WCAG 4.1.2 Name, Role, Value.',
        files: ['src/app/components/header.component.html'],
        additions: 4,
        deletions: 2,
        author: 'Fresnel <fresnel@noreplies.github.com>',
        date: new Date().toUTCString(),
        body: 'Ensures assistive technologies announce clear actionable descriptions for navigation and control buttons.',
        diff: `diff --git a/src/app/components/header.component.html b/src/app/components/header.component.html\n--- a/src/app/components/header.component.html\n+++ b/src/app/components/header.component.html\n@@ -8,3 +8,4 @@\n-<button class="icon-btn"><svg>...</svg></button>\n+<button class="icon-btn" aria-label="Toggle light and dark theme"><svg aria-hidden="true">...</svg></button>`
      },
      {
        id: 'c5',
        sha: '8e1f50a',
        fullSha: '8e1f50a9918231cbf094a12398510ba481023d88',
        category: 'best-practices',
        categoryLabel: 'Best practices',
        ruleId: 'best-practices-security-headers',
        title: 'Harden Content-Security-Policy and X-Content-Type-Options headers',
        commitMessage: 'security: harden Content-Security-Policy and X-Content-Type-Options headers',
        summary: 'Configured restrictive Content-Security-Policy and nosniff MIME typing headers in server response and meta declarations.',
        files: ['server.ts', 'src/index.html'],
        additions: 7,
        deletions: 0,
        author: 'Fresnel <fresnel@noreplies.github.com>',
        date: new Date().toUTCString(),
        body: 'Mitigates cross-site scripting (XSS) and clickjacking by restricting script sources and disabling MIME-type sniffing.',
        diff: `diff --git a/src/index.html b/src/index.html\n--- a/src/index.html\n+++ b/src/index.html\n@@ -4,2 +4,4 @@\n+    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;" />\n+    <meta http-equiv="X-Content-Type-Options" content="nosniff" />`
      },
      {
        id: 'c6',
        sha: '1c9f3d2',
        fullSha: '1c9f3d201948ba28172901aef049281a80941e74',
        category: 'seo',
        categoryLabel: 'SEO',
        ruleId: 'seo-meta-schema-org',
        title: 'Add descriptive meta tags and structured JSON-LD schema',
        commitMessage: 'seo: add descriptive meta tags and structured JSON-LD schema',
        summary: 'Added 140-char meta description, OpenGraph/Twitter social cards, and Schema.org WebApplication structured JSON-LD schema.',
        files: ['src/index.html'],
        additions: 18,
        deletions: 1,
        author: 'Fresnel <fresnel@noreplies.github.com>',
        date: new Date().toUTCString(),
        body: 'Optimizes search indexing and rich snippet rendering for traditional search engines and AI generative answering engines (AEO/GEO).',
        diff: `diff --git a/src/index.html b/src/index.html\n--- a/src/index.html\n+++ b/src/index.html\n@@ -5,3 +5,8 @@\n+    <meta name="description" content="Fresnel — focused code audits across Performance, Accessibility, Best Practices, SEO, and Security." />\n+    <meta property="og:title" content="Fresnel — Code Audit" />\n+    <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Fresnel"}</script>`
      },
      ...(isLhr ? [] : [
        {
          id: 'c7',
          sha: '6d2e88a',
          fullSha: '6d2e88a10948ac01928374019284102938471029',
          category: 'security' as const,
          categoryLabel: 'Web application security findings',
          securityContext: 'Light',
          securityPattern: 'DOM XSS Sanitization',
          ruleId: 'security-dom-xss-sanitize',
          title: 'Sanitize innerHTML sinks using trusted DOMPurify policy',
          commitMessage: 'security: sanitize innerHTML sinks using trusted DOMPurify policy',
          summary: 'Replaced unescaped innerHTML assignments with sanitized DOMPurify fragments to eliminate client-side DOM XSS vectors.',
          files: ['src/app/components/report.component.ts'],
          additions: 9,
          deletions: 2,
          author: 'Fresnel <fresnel@noreplies.github.com>',
          date: new Date().toUTCString(),
          body: 'Ensures untrusted HTML snippets and user-supplied markdown are thoroughly sanitized before DOM insertion.',
          diff: `diff --git a/src/app/components/report.component.ts b/src/app/components/report.component.ts\n--- a/src/app/components/report.component.ts\n+++ b/src/app/components/report.component.ts\n@@ -14,2 +14,3 @@\n-    element.innerHTML = rawInput;\n+    element.textContent = rawInput;\n+    // Or sanitize with DOMPurify.sanitize(rawInput)`
        }
      ])
    ];
  }

  private prepareReportState(sessionData: AuditSession): void {
    const allIds = new Set(sessionData.commits.map((c) => c.id));
    this.selectedCommitIds.set(allIds);
    const firstId = sessionData.commits[0]?.id;
    this.expandedDiffIds.set(firstId ? new Set([firstId]) : new Set());
    this.categoryFilter.set('all');
    void this.refreshPatchBundle();
  }

  toggleCommitSelection(commitId: string): void {
    const next = new Set(this.selectedCommitIds());
    if (next.has(commitId)) {
      next.delete(commitId);
    } else {
      next.add(commitId);
    }
    this.selectedCommitIds.set(next);
    void this.refreshPatchBundle();
  }

  selectAllCommits(): void {
    this.selectedCommitIds.set(new Set(this.allCommits().map((c) => c.id)));
    void this.refreshPatchBundle();
  }

  clearAllCommits(): void {
    this.selectedCommitIds.set(new Set());
    void this.refreshPatchBundle();
  }

  toggleDiff(commitId: string): void {
    const next = new Set(this.expandedDiffIds());
    if (next.has(commitId)) {
      next.delete(commitId);
    } else {
      next.add(commitId);
    }
    this.expandedDiffIds.set(next);
  }

  buildClientSidePatchFallback(): { filename: string; content: string } {
    const current = this.session();
    const selectedSet = this.selectedCommitIds();
    const chosen = (current?.commits ?? []).filter((c) => selectedSet.has(c.id));
    const suffix = current?.runPhase === 'lhr' ? 'lhr-fixes' : 'code-audit';
    const filename = `fresnel-${current?.repo?.repo || 'repository'}-${suffix}.patch`;
    const total = chosen.length;
    if (total === 0) {
      return { filename, content: '# No commits selected\n' };
    }
    const content = chosen
      .map((c, idx) =>
        [
          `From ${c.fullSha || c.sha} Mon Sep 17 00:00:00 2001`,
          `From: ${c.author || 'Fresnel <fresnel@noreplies.github.com>'}`,
          `Date: ${c.date || new Date().toUTCString()}`,
          `Subject: [PATCH ${idx + 1}/${total}] ${c.commitMessage || c.title}`,
          ``,
          c.summary,
          `---`,
          c.diff,
          `-- `,
          `2.47.0`,
          ``
        ].join('\n')
      )
      .join('\n');
    return { filename, content };
  }

  async refreshPatchBundle(): Promise<PatchBundle | null> {
    const current = this.session();
    if (!current) return null;

    try {
      const bundle = await firstValueFrom(
        this.http.post<PatchBundle>(`/api/audit/${current.id}/patch`, {
          selectedCommitIds: Array.from(this.selectedCommitIds())
        })
      );
      this.patchBundle.set(bundle);
      return bundle;
    } catch {
      const fallback = this.buildClientSidePatchFallback();
      const suffix = current.runPhase === 'lhr' ? 'lhr-fixes' : 'code-audit';
      const count = this.selectedCommitIds().size;
      const clientBundle: PatchBundle = {
        filename: fallback.filename,
        selectedCount: count,
        patchContent: fallback.content,
        downloadUrl: '',
        instructions: {
          cloneCmd: `git clone ${current.repo.url}.git && cd ${current.repo.repo}`,
          branchCmd: `git checkout -b fresnel/${suffix} origin/${current.branch}`,
          applyAmCmd: `git am --3way < ~/Downloads/${fallback.filename}`,
          applyDiffCmd: `git apply --3way ~/Downloads/${fallback.filename}`,
          verifyCmd: `git log --oneline -n ${count}`,
          pushCmd: `git push -u origin fresnel/${suffix}`
        }
      };
      this.patchBundle.set(clientBundle);
      return clientBundle;
    }
  }

  openPatchGuideAndDownload(): void {
    this.isPatchDrawerOpen.set(true);
    const cached = this.patchBundle();
    if (cached && cached.patchContent) {
      this.triggerBrowserDownload(cached.filename, cached.patchContent, cached.downloadUrl);
    } else {
      const fallback = this.buildClientSidePatchFallback();
      this.triggerBrowserDownload(fallback.filename, fallback.content);
    }
    void this.refreshPatchBundle();
  }

  triggerBrowserDownload(filename: string, content: string, downloadUrl?: string): void {
    if (!this.document?.body) return;
    try {
      const blob = new Blob([content], { type: 'text/x-diff;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = this.document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      this.document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        anchor.remove();
        URL.revokeObjectURL(url);
      }, 250);
    } catch {
      if (downloadUrl && typeof window !== 'undefined') {
        window.open(downloadUrl, '_blank');
      }
    }
  }

  async createPullRequest(): Promise<void> {
    const current = this.session();
    if (!current || this.selectedCommitIds().size === 0) return;

    this.isCreatingPr.set(true);
    try {
      const pr = await firstValueFrom(
        this.http.post<PullRequestResult>(`/api/audit/${current.id}/pr`, {
          selectedCommitIds: Array.from(this.selectedCommitIds())
        })
      );
      this.prResult.set(pr);
      this.prCliMode.set('inline');
      this.transitionToStep(4);
    } catch {
      const fallback = this.buildClientSidePatchFallback();
      const suffix = current.runPhase === 'lhr' ? 'lhr-fixes' : 'code-audit';
      const headBranch = `fresnel/${suffix}`;
      const selectedCommits = (current.commits || []).filter((c) => this.selectedCommitIds().has(c.id));
      const shortCmd = `git checkout -b ${headBranch} origin/${current.branch} && git am --3way < ~/Downloads/${fallback.filename} && git push -u origin ${headBranch} && gh pr create --title "Fresnel Audit: ${suffix}" --body "Automated audit fixes"`;

      const clientPr: PullRequestResult = {
        number: 1,
        mode: current.mode,
        runPhase: current.runPhase,
        title: `Fresnel Audit: ${suffix}`,
        body: 'Automated atomic fixes across Performance, Accessibility, Best practices, SEO, and Security.',
        url: `${current.repo.url}/pull/1`,
        compareUrl: `${current.repo.url}/compare/${current.branch}...${headBranch}`,
        repoUrl: current.repo.url,
        repoFullName: current.repo.fullName,
        baseBranch: current.branch,
        headBranch,
        patchFilename: fallback.filename,
        patchDownloadUrl: '',
        terminalCommand: shortCmd,
        shortTerminalCommand: shortCmd,
        createdAt: new Date().toISOString(),
        selectedCommits,
        totalAdditions: selectedCommits.reduce((acc, c) => acc + (c.additions || 0), 0),
        totalDeletions: selectedCommits.reduce((acc, c) => acc + (c.deletions || 0), 0),
        filesTouched: Array.from(new Set(selectedCommits.flatMap((c) => c.files || [])))
      };
      this.prResult.set(clientPr);
      this.prCliMode.set('inline');
      this.transitionToStep(4);
    } finally {
      this.isCreatingPr.set(false);
    }
  }
}

