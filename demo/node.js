const express = require('express');
const http = require('http'); // Expressサーバーに必要
const WebSocket = require('ws');
const path = require('path'); // ファイルパスの解決に必要

const app = express();
const server = http.createServer(app); // ExpressアプリからHTTPサーバーを作成
const wss = new WebSocket.Server({ server }); // HTTPサーバー上でWebSocketサーバーを起動

const PORT = process.env.PORT || 3000; // 環境変数があればそれを使用、なければ3000番ポート

// --- 静的ファイルの配信 (HTML, CSS, JSなど) ---
// ルートパス (/) にアクセスされたときにindex.htmlの内容を返す
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>シンプルなチャット (単一ファイル)</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                #messages { border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px; margin-bottom: 10px; }
                #messageInput { width: 80%; padding: 8px; }
                #sendButton { padding: 8px 15px; }
            </style>
        </head>
        <body>
            <h1>シンプルなチャット (単一ファイル)</h1>
            <div id="messages"></div>
            <input type="text" id="messageInput" placeholder="メッセージを入力してください">
            <button id="sendButton">送信</button>

            <script>
                const messagesDiv = document.getElementById('messages');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');

                // WebSocketサーバーへの接続
                // この場合、HTMLを提供しているのと同じサーバーに接続します
                const ws = new WebSocket('ws://' + window.location.host);

                ws.onopen = () => {
                    console.log('WebSocketサーバーに接続しました。');
                    messagesDiv.innerHTML += '<p><em>チャットに接続しました。</em></p>';
                };

                ws.onmessage = event => {
                    // サーバーからメッセージを受信したとき
                    const message = event.data;
                    messagesDiv.innerHTML += `<p>${message}</p>`;
                    messagesDiv.scrollTop = messagesDiv.scrollHeight; // スクロールを一番下へ
                };

                ws.onclose = () => {
                    console.log('WebSocketサーバーから切断されました。');
                    messagesDiv.innerHTML += '<p><em>チャットから切断されました。</em></p>';
                };

                ws.onerror = error => {
                    console.error('WebSocketエラー:', error);
                    messagesDiv.innerHTML += `<p style="color: red;"><em>エラーが発生しました: ${error.message}</em></p>`;
                };

                sendButton.onclick = () => {
                    const message = messageInput.value;
                    if (message) {
                        ws.send(message); // メッセージをサーバーに送信
                        messageInput.value = ''; // 入力フィールドをクリア
                    }
                };

                // Enterキーでメッセージを送信
                messageInput.addEventListener('keypress', event => {
                    if (event.key === 'Enter') {
                        sendButton.click();
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// --- WebSocketチャット機能 ---
console.log('WebSocketサーバーが起動中...');

const clients = new Set(); // 接続中のクライアントを格納するセット

wss.on('connection', ws => {
    console.log('新しいクライアントが接続しました。');
    clients.add(ws); // クライアントをセットに追加

    ws.on('message', message => {
        const messageString = message.toString();
        console.log(`メッセージを受信しました: ${messageString}`);

        // 全ての接続中のクライアントにメッセージをブロードキャスト
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    });

    ws.on('close', () => {
        console.log('クライアントが切断しました。');
        clients.delete(ws); // クライアントをセットから削除
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
