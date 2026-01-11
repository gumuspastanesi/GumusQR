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

      // 1. Kullanıcıyı bul
      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      // 2. Kullanıcı hiç yoksa veya şifre uyuşmuyorsa "Otomatik Tamir" mekanizması
      if (username === 'admin' && password === 'gumus123') {
        const newHash = hashPassword('gumus123');
        
        if (!user) {
          // Kullanıcı yoksa oluştur
          const { data: newUser } = await supabase
            .from('users')
            .insert({ username: 'admin', password_hash: newHash })
            .select()
            .single();
          user = newUser;
        } else if (!comparePassword(password, user.password_hash)) {
          // Kullanıcı var ama şifre (hash) uyumsuzsa, hash'i güncelle
          await supabase
            .from('users')
            .update({ password_hash: newHash })
            .eq('username', 'admin');
          user.password_hash = newHash;
        }
      }

      // 3. Kontrol (Eğer yukarıdaki tamir işe yaradıysa user artık geçerli olmalı)
      if (!user || !comparePassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Geçersiz giriş bilgileri' });
      }

      const token = generateToken(user);
      return res.json({ token, user: { id: user.id, username: user.username } });
    }

    // verify ve diğer kısımlar aynı kalabilir...
    if (req.method === 'GET' && action === 'verify') {
      const token = getTokenFromHeader(req);
      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ error: 'Geçersiz token' });
      const { data: user } = await supabase.from('users').select('id, username').eq('id', decoded.id).maybeSingle();
      return res.json({ user });
    }

  } catch (error) {
    console.error("Auth Hatası:", error);
    return res.status(500).json({ error: error.message });
  }
}