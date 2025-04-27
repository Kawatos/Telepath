"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LoginForm = () => {
  const [userNameInput, setUserNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [welcome, setWelcome] = useState('');   // para mensagem de boas-vindas
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWelcome('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: userNameInput, password }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Usuário ou senha incorretos.');
        return;
      }

      // recebe do backend o nome decifrado
      setWelcome(`Bem‐vindo, ${result.userName}!`);

      // depois de 1.5s, redireciona
      setTimeout(() => {
        router.push('/chat');
      }, 1500);

    } catch (err) {
      console.error(err);
      setError('Erro ao realizar o login. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
      {welcome && (
        <p className="text-green-500 text-sm mb-2">{welcome}</p>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Nome de Usuário</label>
        <input
          type="text"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none"
          placeholder="Seu nome de usuário"
          value={userNameInput}
          onChange={e => setUserNameInput(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Senha</label>
        <input
          type="password"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none"
          placeholder="Sua senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;
