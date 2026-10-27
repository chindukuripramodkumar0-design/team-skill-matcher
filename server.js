/**
 * Team Skill Matcher — zero-dependency Node HTTP server
 * Serves static files from /public and a small JSON health/info API.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Cache-Control": "no-cache",
    ...headers,
  });
  res.end(body);
}

function json(res, status, data) {
  send(res, status, JSON.stringify(data, null, 2), {
    "Content-Type": "application/json; charset=utf-8",
  });
}

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent(reqPath.split("?")[0]);
  const joined = path.normalize(path.join(root, decoded));
  if (!joined.startsWith(root)) return null;
  return joined;
}

function serveStatic(req, res) {
  let urlPath = req.url.split("?")[0];
  if (urlPath === "/") urlPath = "/index.html";

  const filePath = safeJoin(PUBLIC_DIR, urlPath);
  if (!filePath) return json(res, 400, { error: "Invalid path" });

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA fallback
      const index = path.join(PUBLIC_DIR, "index.html");
      return fs.readFile(index, (e2, buf) => {
        if (e2) return json(res, 404, { error: "Not found" });
        send(res, 200, buf, { "Content-Type": MIME[".html"] });
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (e2, buf) => {
      if (e2) return json(res, 500, { error: "Read failed" });
      send(res, 200, buf, { "Content-Type": MIME[ext] || "application/octet-stream" });
    });
  });
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];

  // Netlify Functions are not executed by this static Docker server. Return
  // JSON instead of the SPA HTML fallback so the frontend can show a useful message.
  if (urlPath === "/.netlify/functions/bitbucket") {
    return json(res, 503, {
      error: "Bitbucket integration requires Netlify Functions. Run this project with `netlify dev` and configure BITBUCKET_TOKEN, or deploy it to Netlify."
    });
  }

  if (urlPath === "/api/health") {
    return json(res, 200, { ok: true, service: "team-skill-matcher", time: new Date().toISOString() });
  }

  if (urlPath === "/api/info") {
    return json(res, 200, {
      name: "Team Skill Matcher",
      version: "1.0.0",
      storage: "localStorage (key: grok_team_matcher_db)",
      demo: { email: "demo@acme.ai", password: "demo123" },
    });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return json(res, 405, { error: "Method not allowed" });
  }

  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Team Skill Matcher running at http://${HOST}:${PORT}`);
});
