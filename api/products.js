import { supabase } from '../lib/supabase.js';
import { authenticate } from '../lib/auth.js';
import { uploadImage, deleteImage } from '../lib/cloudinary.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

  const { id } = req.query;

  try {
    if (req.method === 'GET' && !id) {
      const { data: products, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return res.json(products.map(p => ({ ...p, category_name: p.categories?.name || '' })));
    }

    if (req.method === 'POST') {
      const { category_id, name, description, price, allergens, image, sort_order, is_active } = req.body;
      let image_url = null;
      if (image) image_url = await uploadImage(image, 'products');

      const { data, error } = await supabase
        .from('products')
        .insert({
          category_id,
          name,
          description,
          price: parseFloat(price),
          image_url,
          allergens,
          sort_order: sort_order || 0,
          is_active: is_active === 1 || is_active === true
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT' && id) {
      const { image, remove_image, ...updateData } = req.body;
      const { data: existing } = await supabase.from('products').select('image_url').eq('id', id).single();
      
      let image_url = existing.image_url;
      if (remove_image || image) {
        if (existing.image_url) await deleteImage(existing.image_url);
        image_url = image ? await uploadImage(image, 'products') : null;
      }

      const { data, error } = await supabase
        .from('products')
        .update({ ...updateData, image_url, is_active: updateData.is_active === 1 || updateData.is_active === true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json(data);
    }

    if (req.method === 'DELETE' && id) {
      const { data: existing } = await supabase.from('products').select('image_url').eq('id', id).single();
      if (existing?.image_url) await deleteImage(existing.image_url);
      await supabase.from('products').delete().eq('id', id);
      return res.json({ message: 'Ürün silindi' });
    }
    
    return res.status(404).json({ error: 'Endpoint bulunamadı' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}