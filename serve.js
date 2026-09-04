const http = require("http");
const fs = require("fs");
const path = require("path");
const root = __dirname;
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(root, url === "/" ? "/index.html" : url);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    const ext = path.extname(file).toLowerCase();
    const type = ext === ".html" ? "text/html; charset=utf-8" : ext === ".js" ? "text/javascript" : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  });
}).listen(8731, "0.0.0.0", () => console.log("serving on http://0.0.0.0:8731 (LAN accessible)"));
