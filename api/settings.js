import { supabase } from '../lib/supabase.js';
import { authenticate } from '../lib/auth.js';
import { uploadImage, deleteImage } from '../lib/cloudinary.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { data: settings, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const settingsObj = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
      return res.json(settingsObj);
    }

    const user = authenticate(req);
    if (!user) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

    if (req.method === 'PUT') {
      const { logo, remove_logo, ...otherSettings } = req.body;

      if (remove_logo || logo) {
        const { data: currentLogo } = await supabase.from('settings').select('value').eq('key', 'logo_url').maybeSingle();
        if (currentLogo?.value) await deleteImage(currentLogo.value);
        const newLogoUrl = logo ? await uploadImage(logo, 'logos') : '';
        await supabase.from('settings').upsert({ key: 'logo_url', value: newLogoUrl });
      }

      for (const [key, value] of Object.entries(otherSettings)) {
        await supabase.from('settings').upsert({ key, value });
      }

      return res.json({ message: 'Ayarlar güncellendi' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}