const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 2009;
const DIST_DIR = path.resolve(__dirname, "dist");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

const server = http.createServer((req, res) => {
  // Normalize URL and remove query strings
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let safePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, "");
  let filePath = path.join(DIST_DIR, safePath);

  // Check if requested path exists
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      return serveFile(filePath, res);
    }

    if (!err && stats.isDirectory()) {
      const indexFile = path.join(filePath, "index.html");
      if (fs.existsSync(indexFile)) {
        return serveFile(indexFile, res);
      }
    }

    // SPA Fallback: serve dist/index.html for client-side routing
    const spaIndex = path.join(DIST_DIR, "index.html");
    fs.stat(spaIndex, (errSpa, spaStats) => {
      if (!errSpa && spaStats.isFile()) {
        return serveFile(spaIndex, res);
      }

      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found - Please run 'npm run build' first to generate dist directory.");
    });
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`500 Internal Server Error: ${err.message}`);
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    });
    res.end(content);
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Chatbot Manager] Server is running at http://localhost:${PORT}`);
  console.log(`[Chatbot Manager] Serving static directory: ${DIST_DIR}`);
});
