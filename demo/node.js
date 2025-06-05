const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// --- 静的ファイルの配信 (HTML、CSS、JSをここで提供する) ---
// ここでクライアントに送るHTML文字列を定義します。
// このHTML文字列の中に、ブラウザで動くJavaScriptを含めます。
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>シンプルなチャット</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                #messages { border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px; margin-bottom: 10px; }
                #messageInput { width: 80%; padding: 8px; }
                #sendButton { padding: 8px 15px; }
            </style>
        </head>
        <body>
            <h1>シンプルなチャット</h1>
            <div id="messages"></div>
            <input type="text" id="messageInput" placeholder="メッセージを入力してください">
            <button id="sendButton">送信</button>

            <script>
                // ****** ここからがブラウザで実行されるJavaScriptです ******
                const messagesDiv = document.getElementById('messages');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');

                const ws = new WebSocket('ws://' + window.location.host);

                ws.onopen = () => {
                    console.log('WebSocketサーバーに接続しました。');
                    messagesDiv.innerHTML += '<p><em>チャットに接続しました。</em></p>';
                };

                ws.onmessage = event => {
                    const message = event.data;
                    messagesDiv.innerHTML += \`<p>\${message}</p>\`; // <= エラーになった行はここにあるべき
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                };

                ws.onclose = () => {
                    console.log('WebSocketサーバーから切断されました。');
                    messagesDiv.innerHTML += '<p><em>チャットから切断されました。</em></p>';
                };

                ws.onerror = error => {
                    console.error('WebSocketエラー:', error);
                    messagesDiv.innerHTML += \`<p style="color: red;"><em>エラーが発生しました: \${error.message}</em></p>\`;
                };

                sendButton.onclick = () => {
                    const message = messageInput.value;
                    if (message) {
                        ws.send(message);
                        messageInput.value = '';
                    }
                };

                messageInput.addEventListener('keypress', event => {
                    if (event.key === 'Enter') {
                        sendButton.click();
                    }
                });
                // ****** ここまでがブラウザで実行されるJavaScriptです ******
            </script>
        </body>
        </html>
    `);
});

// --- WebSocketチャット機能 (サーバーサイドのロジック) ---
console.log('WebSocketサーバーが起動中...');

const clients = new Set();

wss.on('connection', ws => {
    console.log('新しいクライアントが接続しました。');
    clients.add(ws);

    ws.on('message', message => {
        const messageString = message.toString();
        console.log(`メッセージを受信しました: ${messageString}`);

        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    });

    ws.on('close', () => {
        console.log('クライアントが切断しました。');
        clients.delete(ws);
    });

    ws.on('error', error => {
        console.error('WebSocketエラーが発生しました:', error);
    });
});

// --- サーバー起動 ---
server.listen(PORT, () => {
    console.log(`サーバーが http://localhost:${PORT} で起動しました。`);
    console.log(`ブラウザで http://localhost:${PORT} にアクセスしてください。`);
});
```
