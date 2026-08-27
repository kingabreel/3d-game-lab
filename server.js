import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
};

const server = createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0];

  const fullPath = join(__dirname, 'dist', filePath);

  if (!existsSync(fullPath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(fullPath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (e) {
    res.writeHead(500);
    res.end('Server error');
  }
});

const wss = new WebSocketServer({ server });

const clients = new Map();

function broadcast(message, excludeId = null) {
  const data = JSON.stringify(message);
  for (const [id, client] of clients) {
    if (id !== excludeId && client.readyState === 1) {
      client.send(data);
    }
  }
}

wss.on('connection', (ws) => {
  const playerId = Math.random().toString(36).substring(2, 10);
  clients.set(playerId, ws);

  ws.send(JSON.stringify({
    type: 'init',
    playerId,
  }));

  ws.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData.toString());

      if (data.type === 'player_join') {
        const client = clients.get(playerId);
        if (client) {
          client.playerName = data.playerName;
          client.playerColor = data.playerColor;
          client.position = data.position;
          client.rotation = data.rotation;
          client.lastSeen = Date.now();
        }

        broadcast({
          type: 'player_join',
          playerId,
          playerName: data.playerName,
          playerColor: data.playerColor,
          position: data.position,
          rotation: data.rotation,
        }, playerId);

        for (const [id, client] of clients) {
          if (id !== playerId && client.playerName) {
            ws.send(JSON.stringify({
              type: 'player_join',
              playerId: id,
              playerName: client.playerName,
              playerColor: client.playerColor,
              position: client.position,
              rotation: client.rotation,
            }));
          }
        }
      }

      if (data.type === 'player_update') {
        const client = clients.get(playerId);
        if (client) {
          client.position = data.position;
          client.rotation = data.rotation;
          client.chatBubble = data.chatBubble;
        }
        broadcast({
          type: 'player_update',
          playerId,
          playerName: data.playerName,
          playerColor: data.playerColor,
          position: data.position,
          rotation: data.rotation,
          chatBubble: data.chatBubble,
        }, playerId);
      }

      if (data.type === 'chat_message') {
        broadcast({
          type: 'chat_message',
          playerId,
          playerName: data.playerName,
          playerColor: data.playerColor,
          text: data.text,
        }, playerId);
      }

      if (data.type === 'heartbeat') {
        const client = clients.get(playerId);
        if (client) {
          client.playerName = data.playerName;
          client.playerColor = data.playerColor;
          client.position = data.position;
          client.rotation = data.rotation;
          client.chatBubble = data.chatBubble;
          client.lastSeen = Date.now();
        }
      }

    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    const client = clients.get(playerId);
    if (client?.playerName) {
      broadcast({
        type: 'player_leave',
        playerId,
        playerName: client.playerName,
      });
    }
    clients.delete(playerId);
  });

  ws.on('error', (e) => {
    console.error('WebSocket error:', e);
    clients.delete(playerId);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, client] of clients) {
    if (client.lastSeen && now - client.lastSeen > 15000) {
      console.log('Removing inactive player:', id);
      if (client.playerName) {
        broadcast({
          type: 'player_leave',
          playerId: id,
          playerName: client.playerName,
        });
      }
      clients.delete(id);
      client.terminate();
    }
  }
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
});
