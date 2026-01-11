import { supabase } from '../lib/supabase.js';
import { authenticate } from '../lib/auth.js';
import { uploadImage, deleteImage } from '../lib/cloudinary.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

  try {
    if (req.method === 'GET') {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      if (!settings || settings.length === 0) {
        const defaultSettings = [
          { key: 'restaurant_name', value: 'Gümüş Pastanesi' },
          { key: 'restaurant_description', value: '1985\'ten beri taze lezzetler' },
          { key: 'currency', value: '₺' },
          { key: 'logo_url', value: '' }
        ];

        await supabase.from('settings').insert(defaultSettings);
        
        const settingsObj = {};
        defaultSettings.forEach(s => { settingsObj[s.key] = s.value; });
        return res.json(settingsObj);
      }

      const settingsObj = {};
      settings.forEach(s => { settingsObj[s.key] = s.value; });
      return res.json(settingsObj);
    }

    if (req.method === 'PUT') {
      const { logo, remove_logo, ...otherSettings } = req.body;

      if (logo) {
        const { data: currentLogo } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'logo_url')
          .single();

        if (currentLogo?.value) {
          await deleteImage(currentLogo.value);
        }

        const logoUrl = await uploadImage(logo, 'logos');
        otherSettings.logo_url = logoUrl;
      }

      if (remove_logo) {
        const { data: currentLogo } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'logo_url')
          .single();

        if (currentLogo?.value) {
          await deleteImage(currentLogo.value);
        }
        otherSettings.logo_url = '';
      }

      for (const [key, value] of Object.entries(otherSettings)) {
        await supabase
          .from('settings')
          .upsert({ key, value }, { onConflict: 'key' });
      }

      const { data: settings } = await supabase
        .from('settings')
        .select('key, value');

      const settingsObj = {};
      settings?.forEach(s => { settingsObj[s.key] = s.value; });
      return res.json(settingsObj);
    }

    return res.status(404).json({ error: 'Endpoint bulunamadı' });
  } catch (error) {
    console.error('Settings error:', error);
    return res.status(500).json({ error: error.message });
  }
};
