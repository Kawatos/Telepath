import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../lib/supabase';

const ENC_KEY  = Buffer.from(process.env.ENC_KEY!,  'utf-8');
const HMAC_KEY = Buffer.from(process.env.HMAC_KEY!, 'hex');

export async function POST(req: Request) {
  try {
    const { userName, password } = await req.json();
    if (!userName || !password) {
      return NextResponse.json({ error: 'Usuário e senha obrigatórios' }, { status: 400 });
    }

    // 1) Gera HMAC para lookup
    const usernameHmac = crypto
      .createHmac('sha256', HMAC_KEY)
      .update(userName)
      .digest('hex');

    // 2) Busca no Supabase
    const { data, error } = await supabase
      .from('users')
      .select('username, password, iv')
      .eq('username_hmac', usernameHmac)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 3) Decriptografa senha e compara
    const iv = Buffer.from(data.iv, 'hex');
    const decipherPwd = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, iv);
    let decPwd = decipherPwd.update(data.password, 'hex', 'utf8');
    decPwd += decipherPwd.final('utf8');
    if (decPwd !== password) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    // 4) Decriptografa userName para retornar
    const decipherUser = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, iv);
    let decUser = decipherUser.update(data.username, 'hex', 'utf8');
    decUser += decipherUser.final('utf8');

    return NextResponse.json({
      message: 'Login OK',
      userName: decUser
    });
  } catch (err) {
    console.error('Login route error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
