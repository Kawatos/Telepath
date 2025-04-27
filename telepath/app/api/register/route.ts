import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../lib/supabase';

const ENC_KEY = Buffer.from(process.env.ENC_KEY!, 'utf-8'); // 32 bytes
const IV_LENGTH = 16; // Tamanho do vetor de inicialização (IV) para o AES-256-CBC

export async function POST(req: Request) {
  try {
    const { userName, password } = await req.json();

    if (!userName || !password) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Criptografar nome de usuário
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipherUserName = crypto.createCipheriv('aes-256-cbc', ENC_KEY, iv);
    let encryptedUserName = cipherUserName.update(userName, 'utf8', 'hex');
    encryptedUserName += cipherUserName.final('hex');

    // Criptografar senha
    const cipherPassword = crypto.createCipheriv('aes-256-cbc', ENC_KEY, iv);
    let encryptedPassword = cipherPassword.update(password, 'utf8', 'hex');
    encryptedPassword += cipherPassword.final('hex');

    // Inserir no banco de dados
    const { error } = await supabase
      .from('users')
      .insert([{
        username: encryptedUserName,
        password: encryptedPassword,
        iv: iv.toString('hex'),
      }])

    if (error) {
      console.error('Erro ao inserir no banco:', error);
      return NextResponse.json(
        { error: 'Erro ao realizar cadastro' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Cadastro realizado com sucesso!' },
      { status: 200 }
    );

  } catch (err) {
    console.error('Erro no registro:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
