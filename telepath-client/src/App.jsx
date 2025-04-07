// Estrutura mínima do Telepath: Cliente (React) + Servidor (Node + WebSocket + Criptografia E2EE)

import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const ws = new WebSocket("ws://localhost:3001");

function App() {
  const [message, setMessage] = useState("");
  const [inbox, setInbox] = useState([]);
  const [clientId] = useState(uuidv4());
  const [targetId, setTargetId] = useState("");
  const inboxRef = useRef([]);

  useEffect(() => {
    ws.onmessage = (event) => {
      const { from, encrypted } = JSON.parse(event.data);
      // Simula descriptografar a mensagem
      const decrypted = window.atob(encrypted);
      inboxRef.current = [...inboxRef.current, { from, decrypted }];
      setInbox([...inboxRef.current]);
    };
  }, []);

  const sendMessage = () => {
    const encrypted = window.btoa(message); // Simula criptografia (usar libsodium real depois)
    ws.send(JSON.stringify({
      type: "message",
      to: targetId,
      from: clientId,
      encrypted
    }));
    setMessage("");
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Telepath</h1>
      <input
        className="border p-2 w-full"
        placeholder="ID do destinatário"
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
      />
      <textarea
        className="border p-2 w-full"
        placeholder="Digite sua mensagem..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button className="bg-blue-600 text-white p-2 rounded" onClick={sendMessage}>
        Enviar mensagem segura
      </button>
      <div>
        <h2 className="font-semibold">Caixa de Entrada</h2>
        {inbox.map((msg, i) => (
          <div key={i} className="border p-2 mt-1">
            <strong>De:</strong> {msg.from}<br />
            <span>{msg.decrypted}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
