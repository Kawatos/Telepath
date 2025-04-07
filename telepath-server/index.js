import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });
const users = new Map(); // userId -> ws

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    
    if (msg.type === 'register') {
      userId = msg.userId;
      users.set(userId, ws);
      console.log(`[+] ${userId} conectado`);
    }

    if (msg.type === 'message') {
      const { to, content } = msg;
      const recipient = users.get(to);

      if (recipient && recipient.readyState === WebSocket.OPEN) {
        recipient.send(JSON.stringify({
          type: 'message',
          from: userId,
          content,
        }));
        console.log(`[>] Mensagem enviada de ${userId} para ${to}`);
      }
    }
  });

  ws.on('close', () => {
    if (userId) {
      users.delete(userId);
      console.log(`[-] ${userId} desconectado`);
    }
  });
});

console.log('🔐 Servidor Telepath rodando na porta 3001');
