import { useState } from 'react';
import { useRouter } from 'next/navigation';

const RegisterForm = () => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');  // Mensagem de sucesso
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName, password }), // Envia nome de usuário e senha em texto plano
      });

      let result;
      try {
        result = await response.json();
      } catch {
        // corpo vazio ou não-JSON
        setError('Resposta inesperada do servidor.');
        return;
      }


      if (response.ok) {
        setSuccessMessage("Cadastro realizado com sucesso!");
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(result.error || 'Erro ao registrar. Tente novamente.');
      }
    } catch (error) {
      setError("Erro ao registrar. Tente novamente.");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome de Usuário</label>
        <input
          type="text"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none"
          placeholder="Seu nome de usuário"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
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
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Confirmar Senha</label>
        <input
          type="password"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none"
          placeholder="Confirmar sua senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <p className="text-red-500 text-xs mt-1">{error}</p>
      </div>

      {successMessage && (
        <p className="text-green-500 text-sm mt-2">{successMessage}</p>  // Mensagem de sucesso
      )}

      <button
        type="submit"
        className="w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
      >
        Registrar
      </button>
    </form>
  );
};

export default RegisterForm;
