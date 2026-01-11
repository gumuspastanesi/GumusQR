// api/auth.js
import { supabase } from '../lib/supabase.js';
import { generateToken, verifyToken, hashPassword, comparePassword, getTokenFromHeader } from '../lib/auth.js';

export default async function handler(req, res) {
  // CORS Ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    // LOGIN İŞLEMİ
    if (req.method === 'POST' && action === 'login') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
      }

      // Başlangıçta kullanıcı yoksa default admin oluştur
      const { data: users } = await supabase.from('users').select('*').limit(1);
      
      if (!users || users.length === 0) {
        const hash = hashPassword('gumus123');
        await supabase.from('users').insert({ username: 'admin', password_hash: hash });
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (userError || !user || !comparePassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
      }

      const token = generateToken(user);
      return res.json({ token, user: { id: user.id, username: user.username } });
    }

    // TOKEN DOĞRULAMA (VERIFY)
    if (req.method === 'GET' && action === 'verify') {
      const token = getTokenFromHeader(req);
      if (!token) return res.status(401).json({ error: 'Token gerekli' });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ error: 'Geçersiz token' });

      const { data: user } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', decoded.id)
        .maybeSingle();

      if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });

      return res.json({ user });
    }

    // ŞİFRE DEĞİŞTİRME
    if (req.method === 'POST' && action === 'change-password') {
      const token = getTokenFromHeader(req);
      if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ error: 'Geçersiz token' });

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Mevcut ve yeni şifre gerekli' });
      }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (!comparePassword(currentPassword, user.password_hash)) {
        return res.status(401).json({ error: 'Mevcut şifre yanlış' });
      }

      const newHash = hashPassword(newPassword);
      await supabase.from('users').update({ password_hash: newHash }).eq('id', decoded.id);

      return res.json({ message: 'Şifre başarıyla değiştirildi' });
    }

    return res.status(404).json({ error: 'Endpoint bulunamadı' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: error.message });
  }
}