// chat_app.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"; // http/server.ts のパスは変更なし
import {
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
} from "https://deno.land/std@0.224.0/ws/mod.ts"; // <-- ここを /ws/mod.ts に変更

const clients = new Map<string, WebSocket>(); // クライアントを管理するためのMap

async function handleWs(sock: WebSocket, clientId: string) {
  console.log(`新しいクライアントが接続しました: ${clientId}`);
  clients.set(clientId, sock); // クライアントを追加

  try {
    for await (const ev of sock) {
      if (typeof ev === "string") {
        // テキストメッセージを受信
        console.log(`メッセージ受信 from ${clientId}: ${ev}`);
        // 全てのクライアントにメッセージをブロードキャスト
        for (const [id, clientSock] of clients) {
          if (clientSock.readyState === WebSocket.OPEN) {
            await clientSock.send(`${clientId}: ${ev}`);
          }
        }
      } else if (isWebSocketPingEvent(ev)) {
        // Pingイベントを受信 (Denoが自動的にPongを返します)
        // console.log("Ping受信");
      } else if (isWebSocketCloseEvent(ev)) {
        // クローズイベントを受信
        const { code, reason } = ev;
        console.log(`WebSocketが閉じられました ${clientId}: ${code} ${reason ? reason : ""}`);
        clients.delete(clientId); // クライアントを削除
      }
    }
  } catch (err) {
    console.error(`WebSocketエラー ${clientId}: ${err}`);
  } finally {
    clients.delete(clientId); // エラー時もクローズ時もクライアントを削除
    console.log(`クライアントが切断されました: ${clientId}`);
  }
}

async function handler(req: Request) {
  // WebSocket接続のアップグレード
  if (req.url.endsWith("/ws")) {
    try {
      const { socket, response } = Deno.upgradeWebSocket(req);
      const clientId = crypto.randomUUID(); // ユニークなクライアントIDを生成
      handleWs(socket, clientId);
      return response;
    } catch (err) {
      console.error("WebSocketアップグレードエラー:", err);
      return new Response("WebSocket接続に失敗しました", { status: 400 });
    }
  }

  // 静的ファイル (index.html) の提供
  const url = new URL(req.url);
  const filePath = url.pathname === "/" ? "./index.html" : `.${url.pathname}`;

  if (filePath === "./index.html") {
    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deno WebSocket Chat</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        #messages { border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: scroll; margin-bottom: 10px; }
        #messageInput { width: calc(100% - 70px); padding: 8px; }
        #sendButton { padding: 8px 15px; }
    </style>
</head>
<body>
    <h1>Deno WebSocket Chat</h1>

    <div id="messages"></div>

    <input type="text" id="messageInput" placeholder="メッセージを入力...">
    <button id="sendButton">送信</button>

    <script>
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        // WebSocket接続
        // サーバーが同じホストで動作している場合、window.location.host を使用します
        const ws = new WebSocket(\`ws://\${window.location.host}/ws\`);

        ws.onopen = (event) => {
            console.log('WebSocket接続が確立されました');
            messagesDiv.innerHTML += '<p><em>チャットに接続しました。</em></p>';
        };

        ws.onmessage = (event) => {
            const message = event.data;
            messagesDiv.innerHTML += \`<p>\${message}</p>\`;
            messagesDiv.scrollTop = messagesDiv.scrollHeight; // スクロールを一番下へ
        };

        ws.onclose = (event) => {
            console.log('WebSocket接続が閉じられました:', event.code, event.reason);
            messagesDiv.innerHTML += '<p><em>チャットから切断されました。</em></p>';
        };

        ws.onerror = (error) => {
            console.error('WebSocketエラー:', error);
            messagesDiv.innerHTML += '<p style="color: red;"><em>WebSocketエラーが発生しました。</em></p>';
        };

        sendButton.addEventListener('click', () => {
            sendMessage();
        });

        messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });

        function sendMessage() {
            const message = messageInput.value.trim();
            if (message) {
                ws.send(message);
                messageInput.value = ''; // 入力フィールドをクリア
            }
        }
    </script>
</body>
</html>
    `;
    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // その他の静的ファイルは現状サポートしません
  return new Response("Not Found", { status: 404 });
}

console.log("WebSocketチャットサーバーが http://localhost:8000 で起動しました");
await serve(handler, { port: 8000 });
