import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Globe, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const INITIAL_URL = "https://example.com";

function Browser() {
  const [history, setHistory] = useState<string[]>([INITIAL_URL]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputValue, setInputValue] = useState(INITIAL_URL);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentUrl = history[historyIndex];
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  useEffect(() => {
    setInputValue(currentUrl);
    setIsLoading(true);
    setIframeError(false);
  }, [currentUrl, iframeKey]);

  const navigateTo = (url: string) => {
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }
    
    if (finalUrl === currentUrl) {
      setIframeKey((k) => k + 1);
      return;
    }

    const newHistory = [...history.slice(0, historyIndex + 1), finalUrl];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    inputRef.current?.blur();
  };

  const handleGoBack = () => {
    if (canGoBack) setHistoryIndex((i) => i - 1);
  };

  const handleGoForward = () => {
    if (canGoForward) setHistoryIndex((i) => i + 1);
  };

  const handleRefresh = () => {
    setIframeKey((k) => k + 1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      navigateTo(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-2 bg-muted/30 border-b border-border shadow-sm">
        <div className="flex items-center gap-1.5 shrink-0 mr-1" data-testid="logo-chiko">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm leading-none" style={{ fontFamily: "Georgia, serif" }}>C</span>
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight hidden sm:block">Chiko</span>
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
            className="w-full h-10 px-4 bg-background border border-border rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
            placeholder="Search or enter website name"
            data-testid="input-address"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10 text-primary hover:bg-primary/10"
          onClick={() => navigateTo(inputValue)}
          data-testid="button-go"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative flex-1 bg-muted/10 overflow-hidden">
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 z-10 overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-1/3 rounded-full" />
          </div>
        )}
        
        {iframeError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none p-6 text-center">
            <div className="max-w-xs flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Info className="h-6 w-6" />
              </div>
              <p className="text-sm text-foreground font-medium">This site doesn't allow embedding</p>
              <p className="text-xs text-muted-foreground">Try another URL or search for something else.</p>
            </div>
          </div>
        )}

        <iframe
          key={`${currentUrl}-${iframeKey}`}
          src={currentUrl}
          className="w-full h-full border-none"
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
      </div>
    </div>
  );
}

export default Browser;
