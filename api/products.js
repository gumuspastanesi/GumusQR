import { supabase } from '../lib/supabase.js';
import { authenticate } from '../lib/auth.js';
import { uploadImage, deleteImage } from '../lib/cloudinary.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Yetki yok' });

  const { id } = req.query;

  try {
    if (req.method === 'GET' && !id) {
      const { data: products } = await supabase.from('products').select('*, categories(name)').order('sort_order');
      return res.json(products.map(p => ({ ...p, category_name: p.categories?.name })));
    }

    if (req.method === 'POST') {
      const { category_id, name, price, image, is_active } = req.body;
      let image_url = image ? await uploadImage(image) : null;
      const { data } = await supabase.from('products').insert({
        ...req.body,
        price: parseFloat(price),
        image_url,
        is_active: is_active === true || is_active === 1
      }).select().single();
      return res.status(201).json(data);
    }

    if (req.method === 'PUT' && id) {
      const { image, remove_image, ...updateData } = req.body;
      const { data: existing } = await supabase.from('products').select('image_url').eq('id', id).single();
      let image_url = existing.image_url;

      if (remove_image || image) {
        if (existing.image_url) await deleteImage(existing.image_url);
        image_url = image ? await uploadImage(image) : null;
      }

      const { data } = await supabase.from('products').update({ 
        ...updateData, 
        image_url, 
        is_active: updateData.is_active === true || updateData.is_active === 1 
      }).eq('id', id).select().single();
      return res.json(data);
    }

    if (req.method === 'DELETE' && id) {
      const { data: existing } = await supabase.from('products').select('image_url').eq('id', id).single();
      if (existing?.image_url) await deleteImage(existing.image_url);
      await supabase.from('products').delete().eq('id', id);
      return res.json({ message: 'Silindi' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}