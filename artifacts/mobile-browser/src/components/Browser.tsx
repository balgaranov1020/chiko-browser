import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Globe,
  Search,
  Moon,
  Sun,
  ShieldAlert,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "../App";

// ── Helpers ────────────────────────────────────────────────────────────────

function normalise(input: string): string {
  const s = input.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  // Looks like a domain (has a dot, no spaces) → add https
  if (!s.includes(" ") && s.includes(".")) return `https://${s}`;
  // Otherwise treat as a search query
  return `https://www.google.com/search?q=${encodeURIComponent(s)}`;
}

function proxyUrl(url: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

// ── Types ──────────────────────────────────────────────────────────────────

type ErrorKind = "blocked" | "network" | "timeout" | "unknown";

interface LoadError {
  kind: ErrorKind;
  url: string;
}

// ── Quick links ────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Main_Page" },
  { name: "GitHub", url: "https://github.com" },
  { name: "MDN", url: "https://developer.mozilla.org" },
  { name: "BBC News", url: "https://www.bbc.com/news" },
];

// Sites that are known to block all forms of embedding
const EMBED_BLOCKERS = [
  "google.com", "google.", "youtube.com", "youtu.be",
  "facebook.com", "instagram.com", "twitter.com", "x.com",
  "linkedin.com", "netflix.com", "twitch.tv", "tiktok.com",
];

function isEmbedBlocker(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return EMBED_BLOCKERS.some((b) => host === b || host.endsWith(`.${b}`));
  } catch {
    return false;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

function Browser() {
  const { theme, toggleTheme } = useTheme();

  // Navigation history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // UI state
  const [inputValue, setInputValue] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [isHome, setIsHome] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUrl = historyIndex >= 0 ? history[historyIndex] : "";
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  // ── Progress bar animation ───────────────────────────────────────────────

  const startProgress = useCallback(() => {
    setProgress(5);
    setLoadState("loading");
    let p = 5;
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      // Slow down as we approach 85%
      const step = p < 30 ? 8 : p < 60 ? 4 : p < 80 ? 1.5 : 0.3;
      p = Math.min(p + step, 85);
      setProgress(p);
    }, 200);
  }, []);

  const finishProgress = useCallback((success: boolean) => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setProgress(success ? 100 : 0);
    setLoadState("done");
    setTimeout(() => setProgress(0), 400);
  }, []);

  useEffect(() => () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
  }, []);

  // Sync address bar with current URL
  useEffect(() => {
    if (!isHome && currentUrl) {
      setInputValue(currentUrl);
    } else if (isHome) {
      setInputValue("");
    }
  }, [currentUrl, isHome]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const navigateTo = useCallback((raw: string) => {
    const url = normalise(raw);
    if (!url) return;

    setLoadError(null);
    startProgress();

    if (url === currentUrl && !isHome) {
      setIframeKey((k) => k + 1);
      return;
    }

    setHistory((prev) => {
      const next = [...prev.slice(0, historyIndex + 1), url];
      setHistoryIndex(next.length - 1);
      return next;
    });
    setIsHome(false);
    inputRef.current?.blur();
  }, [currentUrl, historyIndex, isHome, startProgress]);

  const goBack = () => {
    if (!canGoBack) return;
    setLoadError(null);
    startProgress();
    setHistoryIndex((i) => i - 1);
    setIsHome(false);
  };

  const goForward = () => {
    if (!canGoForward) return;
    setLoadError(null);
    startProgress();
    setHistoryIndex((i) => i + 1);
    setIsHome(false);
  };

  const refresh = () => {
    setLoadError(null);
    startProgress();
    setIframeKey((k) => k + 1);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") navigateTo(inputValue);
    if (e.key === "Escape") inputRef.current?.blur();
  };

  const handleLoad = () => {
    finishProgress(true);
  };

  const handleError = () => {
    finishProgress(false);
    setLoadError({ kind: "network", url: currentUrl });
  };

  // ── Pre-flight check before proxying ────────────────────────────────────

  // Before loading in iframe, check if it's a known embed-blocker
  const iframeSource = currentUrl ? proxyUrl(currentUrl) : "";
  const knownBlocker = isEmbedBlocker(currentUrl);

  // Show blocked message immediately for known blockers instead of failing
  useEffect(() => {
    if (!isHome && currentUrl && knownBlocker) {
      finishProgress(false);
      setLoadError({ kind: "blocked", url: currentUrl });
    }
  }, [currentUrl, isHome, knownBlocker, finishProgress]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background text-foreground overflow-hidden relative">

      {/* ── HOME SCREEN ──────────────────────────────────────────────────── */}
      {isHome && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-50 bg-background transition-colors duration-300">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-10 w-10 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            data-testid="theme-toggle-home"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
            <div
              className="mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-105"
              data-testid="logo-large"
            >
              <span className="text-white font-bold text-3xl leading-none" style={{ fontFamily: "Georgia, serif" }}>C</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-widest text-foreground mb-3 text-center">
              CHIKO BROWSER
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mb-10 text-center">
              Search the web, your way.
            </p>

            <div className="w-full max-w-lg relative mb-12 flex items-center group">
              <Search className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKey}
                className="w-full h-14 pl-12 pr-14 bg-input/50 backdrop-blur-sm border border-border rounded-full text-base outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground shadow-sm"
                placeholder="Search or enter a URL..."
                data-testid="input-home-search"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 h-10 w-10 rounded-full text-primary hover:bg-primary/10"
                onClick={() => navigateTo(inputValue)}
                data-testid="button-home-go"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.name}
                  onClick={() => navigateTo(link.url)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted border border-border/50 transition-colors text-sm font-medium"
                  data-testid={`quick-link-${link.name.toLowerCase()}`}
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {link.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BROWSER CHROME (toolbar + viewport) ──────────────────────────── */}
      {!isHome && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-background/90 backdrop-blur-md border-b border-border shadow-sm z-40 relative">
            {/* Logo → home */}
            <div
              className="flex items-center justify-center shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm cursor-pointer transition-transform hover:scale-105 mr-0.5"
              onClick={() => setIsHome(true)}
              data-testid="logo-chiko"
            >
              <span className="text-white font-bold text-sm leading-none" style={{ fontFamily: "Georgia, serif" }}>C</span>
            </div>

            <Button variant="ghost" size="icon"
              className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground disabled:opacity-30"
              onClick={goBack} disabled={!canGoBack} data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon"
              className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground disabled:opacity-30"
              onClick={goForward} disabled={!canGoForward} data-testid="button-forward">
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon"
              className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={refresh} data-testid="button-refresh">
              {loadState === "loading"
                ? <X className="h-4 w-4" />
                : <RotateCw className="h-4 w-4" />}
            </Button>

            {/* Address bar */}
            <div className="flex-1 relative flex items-center min-w-0">
              {loadState === "loading" && (
                <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKey}
                onFocus={(e) => e.target.select()}
                className={`w-full h-9 px-4 bg-muted/40 border border-border rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-all placeholder:text-muted-foreground truncate ${loadState === "loading" ? "pl-10" : ""}`}
                placeholder="Search or enter a URL..."
                data-testid="input-address"
              />
            </div>

            {/* Dark mode toggle */}
            <Button variant="ghost" size="icon"
              className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme} data-testid="theme-toggle">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>

          {/* Progress bar */}
          <div className="relative h-0.5 bg-transparent overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400 transition-all duration-200 ease-out"
              style={{
                width: `${progress}%`,
                opacity: progress > 0 && progress < 100 ? 1 : 0,
                boxShadow: "0 0 8px 1px rgba(99,102,241,0.6)",
              }}
            />
          </div>

          {/* Viewport */}
          <div className="relative flex-1 overflow-hidden bg-white dark:bg-zinc-900">

            {/* Error states */}
            {loadError && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background p-6">
                <div className="max-w-sm w-full rounded-2xl border border-border bg-card shadow-lg p-8 flex flex-col items-center gap-4 text-center">
                  {loadError.kind === "blocked" ? (
                    <>
                      <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                        <ShieldAlert className="h-7 w-7 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold mb-1">Embedding blocked</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          <span className="font-medium text-foreground">{new URL(currentUrl).hostname}</span> actively
                          prevents all web embedding — even through a proxy. This is enforced by
                          their own JavaScript and can't be bypassed in a web browser.
                        </p>
                      </div>
                      <div className="w-full rounded-xl bg-muted/50 border border-border p-4 text-left text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground mb-1">To browse this site:</p>
                        <p>Use the <span className="font-medium">Android app</span> we built — it runs a real WebView that loads any site including YouTube, Google, and Facebook.</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(currentUrl, "_blank")}
                      >
                        Open in new tab instead
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                        <WifiOff className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold mb-1">Could not load page</h3>
                        <p className="text-sm text-muted-foreground">
                          The page failed to load. Check the URL and try again.
                        </p>
                      </div>
                      <Button variant="outline" className="w-full" onClick={refresh}>
                        Try again
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* iframe — hidden for known blockers to avoid flicker */}
            {currentUrl && !knownBlocker && (
              <iframe
                key={`${currentUrl}-${iframeKey}`}
                src={iframeSource}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                onLoad={handleLoad}
                onError={handleError}
                data-testid="browser-viewport"
                title="Browser Viewport"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Browser;
