import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Globe, Loader2, Info, Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "../App";

function Browser() {
  const { theme, toggleTheme } = useTheme();
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputValue, setInputValue] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isHome, setIsHome] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentUrl = historyIndex >= 0 ? history[historyIndex] : "";
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  useEffect(() => {
    if (!isHome && currentUrl) {
      setInputValue(currentUrl);
      setIsLoading(true);
      setIframeError(false);
    } else if (isHome) {
      setInputValue("");
    }
  }, [currentUrl, iframeKey, isHome]);

  const navigateTo = (url: string) => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }
    
    if (finalUrl === currentUrl && !isHome) {
      setIframeKey((k) => k + 1);
      return;
    }

    const newHistory = [...history.slice(0, historyIndex + 1), finalUrl];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setIsHome(false);
    inputRef.current?.blur();
  };

  const handleGoBack = () => {
    if (canGoBack) {
      setHistoryIndex((i) => i - 1);
      setIsHome(false);
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      setHistoryIndex((i) => i + 1);
      setIsHome(false);
    }
  };

  const handleRefresh = () => {
    setIframeKey((k) => k + 1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      navigateTo(inputValue);
    }
  };

  const goHome = () => {
    setIsHome(true);
  };

  const quickLinks = [
    { name: "Example", url: "https://example.com" },
    { name: "Wikipedia", url: "https://wikipedia.org" },
    { name: "GitHub", url: "https://github.com" },
    { name: "MDN", url: "https://developer.mozilla.org" }
  ];

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background text-foreground overflow-hidden relative">
      {isHome ? (
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
            <div className="mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-105" onClick={goHome} data-testid="logo-large">
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
                type="url"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
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
              {quickLinks.map((link) => (
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
      ) : (
        <>
          <div className="flex items-center gap-2 px-2 py-2 bg-background/80 backdrop-blur-md border-b border-border shadow-sm z-40 relative">
            <div 
              className="flex items-center justify-center shrink-0 mr-1 h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm cursor-pointer ml-1 transition-transform hover:scale-105" 
              onClick={goHome}
              data-testid="logo-chiko"
            >
              <span className="text-white font-bold text-sm leading-none" style={{ fontFamily: "Georgia, serif" }}>C</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={handleGoBack}
              disabled={!canGoBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={handleGoForward}
              disabled={!canGoForward}
              data-testid="button-forward"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
              data-testid="button-refresh"
            >
              <RotateCw className="h-5 w-5" />
            </Button>

            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="url"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onFocus={(e) => e.target.select()}
                className="w-full h-9 px-4 bg-input/50 backdrop-blur-sm border border-border rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
                placeholder="Search or enter website name"
                data-testid="input-address"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground ml-1"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>

          <div className="relative flex-1 bg-muted/10 overflow-hidden">
            {isLoading && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 z-10 animate-pulse" />
            )}
            
            {iframeError && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none p-6 text-center">
                <div className="max-w-sm w-full bg-card border border-border rounded-xl shadow-lg p-6 flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Info className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Content Blocked</h3>
                    <p className="text-sm text-muted-foreground">This site doesn't allow embedding inside other applications.</p>
                  </div>
                </div>
              </div>
            )}

            {currentUrl && (
              <iframe
                key={`${currentUrl}-${iframeKey}`}
                src={currentUrl}
                className="w-full h-full border-none bg-background"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerPolicy="no-referrer"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setIframeError(true);
                }}
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
