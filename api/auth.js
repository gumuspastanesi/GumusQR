import { supabase } from '../lib/supabase.js';
import { generateToken, verifyToken, hashPassword, comparePassword, getTokenFromHeader } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    if (req.method === 'POST' && action === 'login') {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Eksik bilgi' });

      const { data: user } = await supabase.from('users').select('*').eq('username', username).maybeSingle();

      if (!user || !comparePassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Geçersiz giriş' });
      }

      const token = generateToken(user);
      return res.json({ token, user: { id: user.id, username: user.username } });
    }

    if (req.method === 'GET' && action === 'verify') {
      const token = getTokenFromHeader(req);
      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ error: 'Geçersiz token' });
      const { data: user } = await supabase.from('users').select('id, username').eq('id', decoded.id).maybeSingle();
      return res.json({ user });
    }

    return res.status(404).end();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}