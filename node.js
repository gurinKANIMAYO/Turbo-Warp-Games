const WebSocket = require('ws');

// WebSocketサーバーをポート8080で起動
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server is running on ws://localhost:8080');

wss.on('connection', function connection(ws) {
  console.log('Client connected.');

  ws.on('message', function incoming(message) {
    console.log('Received:', message.toString());

    // 全クライアントにメッセージをブロードキャスト
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});
