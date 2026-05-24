import { Router, type IRouter } from "express";

const router: IRouter = Router();

const STRIP_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "cross-origin-embedder-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
]);

// Headers we must never forward to the client
const SKIP_FORWARD = new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "te",
  "trailer",
  "upgrade",
]);

router.get("/proxy", async (req, res) => {
  const raw = req.query.url;

  if (!raw || typeof raw !== "string") {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    res.status(400).json({ error: "Only http/https URLs are supported" });
    return;
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });

    // Expose the final URL after redirects so the client can update its address bar
    res.setHeader("X-Final-Url", upstream.url);
    res.setHeader("Access-Control-Expose-Headers", "X-Final-Url");

    const contentType = upstream.headers.get("content-type") ?? "";

    // Forward safe headers
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (STRIP_HEADERS.has(lower) || SKIP_FORWARD.has(lower)) return;
      res.setHeader(key, value);
    });

    // Explicitly allow framing
    res.removeHeader("x-frame-options");

    if (contentType.includes("text/html")) {
      let html = await upstream.text();

      // Inject <base> so relative links/assets resolve against the real origin
      const base = `<base href="${new URL(upstream.url).origin}/">`;
      if (/<head[\s>]/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (m) => `${m}\n  ${base}`);
      } else {
        html = `<html><head>${base}</head><body>${html}</body></html>`;
      }

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(upstream.status).send(html);
    } else {
      // Stream binary / CSS / JS as-is
      const buf = await upstream.arrayBuffer();
      res.status(upstream.status).send(Buffer.from(buf));
    }
  } catch (err: unknown) {
    req.log.error({ err }, "Proxy request failed");
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "The request timed out"
        : "Failed to reach the requested site";
    res.status(502).json({ error: message });
  }
});

export default router;
