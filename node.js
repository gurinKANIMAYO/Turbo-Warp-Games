// node.js
const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});
const target = 'risk-olympus.gl.at.ply.gg:2416';

const server = http.createServer((req, res) => {
  proxy.web(req, res, { target, changeOrigin: true }, (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502);
    res.end('Bad gateway');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Reverse proxy running on http://localhost:${PORT} → ${target}`);
});
