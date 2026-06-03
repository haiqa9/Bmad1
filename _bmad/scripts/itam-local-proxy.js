/**
 * ITAM Local Proxy
 * Forwards http://localhost:3000 → http://192.168.1.38:3000
 * Run with: node itam-local-proxy.js
 */
const http = require('http');
const net = require('net');

const LOCAL_PORT = 3000;
const REMOTE_HOST = '192.168.1.38';
const REMOTE_PORT = 3000;

function log(...args) {
  const ts = new Date().toISOString();
  console.log(`[${ts}]`, ...args);
}

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: REMOTE_HOST,
    port: REMOTE_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: `${REMOTE_HOST}:${REMOTE_PORT}`,
    },
  };

  log(`${clientReq.method} ${clientReq.url}`);

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    log('Proxy request error:', err.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end(`ITAM VM (${REMOTE_HOST}:${REMOTE_PORT}) is not reachable.\nError: ${err.message}\n`);
    }
  });

  clientReq.pipe(proxyReq, { end: true });
});

// Handle WebSocket upgrade (Next.js dev HMR, etc.)
server.on('upgrade', (clientReq, clientSocket, head) => {
  const proxySocket = net.connect(REMOTE_PORT, REMOTE_HOST, () => {
    proxySocket.write(
      `${clientReq.method} ${clientReq.url} HTTP/1.1\r\n` +
      Object.entries(clientReq.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n') +
      '\r\n\r\n'
    );
    proxySocket.write(head);
    clientSocket.pipe(proxySocket);
    proxySocket.pipe(clientSocket);
  });

  proxySocket.on('error', (err) => {
    log('WebSocket proxy error:', err.message);
    clientSocket.destroy();
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    log(`Port ${LOCAL_PORT} is already in use.`);
    process.exit(1);
  }
  log('Server error:', err.message);
});

server.listen(LOCAL_PORT, '127.0.0.1', () => {
  log(`ITAM Local Proxy running on http://127.0.0.1:${LOCAL_PORT} → http://${REMOTE_HOST}:${REMOTE_PORT}`);
  log('Press Ctrl+C to stop.');
});
