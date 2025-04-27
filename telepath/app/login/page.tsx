"use client";

import { useState } from "react";
import LoginForm from './LoginForm';  // Certifique-se de que o caminho do import está correto
import RegisterForm from './RegisterForm';  // Este form ainda precisa ser criado ou ajustado, se for necessário

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-gray-800 p-4 rounded-full mb-4">
          {/* Usando como uma imagem estática */}
          <img
            src="/images/Telepath Logo 1 - White.svg"
            alt="Logo Telepath"
            className="w-16 h-16 object-cover"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">Telepath</h1>
        <p className="text-gray-400 text-center">
          Mensagens ultra seguras que desaparecem após a entrega
        </p>
      </div>

      {/* Botão Entrar sem Login */}
      <button
        className="w-full max-w-sm bg-white text-black py-2 rounded-lg font-semibold mb-4 transition hover:bg-gray-300"
        onClick={() => {
          // Aqui você pode redirecionar direto para a página de mensagens
          console.log("Entrar sem login");
        }}
      >
        Entrar sem Login
      </button>

      {/* Botões de Login/Registrar */}
      <div className="flex w-full max-w-sm mb-6">
        <button
          className={`w-1/2 py-2 rounded-l-lg font-semibold ${
            !isRegister ? "bg-white text-black" : "bg-gray-800 text-white"
          }`}
          onClick={() => setIsRegister(false)}
        >
          Login
        </button>
        <button
          className={`w-1/2 py-2 rounded-r-lg font-semibold ${
            isRegister ? "bg-white text-black" : "bg-gray-800 text-white"
          }`}
          onClick={() => setIsRegister(true)}
        >
          Registrar
        </button>
      </div>

      {/* Formulário */}
      {isRegister ? (
        <RegisterForm />  // Aqui você deve criar o RegisterForm ou ajustar o formulário de registro
      ) : (
        <LoginForm />  // Aqui o LoginForm será exibido
      )}

      {/* Rodapé */}
      <p className="text-gray-400 text-xs text-center mt-8">
        All communications are encrypted and automatically deleted after
        reading. <br />© 2025 TELEPATH SECURE COMMUNICATIONS
      </p>
    </div>
  );
}
