import { supabase } from '../lib/supabase.js'; 
import { authenticate } from '../lib/auth.js'

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
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const { data: products } = await supabase.from('products').select('category_id');
      
      const result = categories.map(cat => ({
        ...cat,
        product_count: products?.filter(p => p.category_id === cat.id).length || 0
      }));

      return res.json(result);
    }

    if (req.method === 'GET' && id) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return res.status(404).json({ error: 'Kategori bulunamadı' });
      return res.json(data);
    }

    if (req.method === 'POST') {
      const { name, description, sort_order, is_active } = req.body;
      if (!name) return res.status(400).json({ error: 'Kategori adı gerekli' });

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name,
          description: description || '',
          sort_order: sort_order || 0,
          is_active: is_active !== undefined ? is_active : 1
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT' && id) {
      const { name, description, sort_order, is_active } = req.body;

      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (!existing) return res.status(404).json({ error: 'Kategori bulunamadı' });

      const { data, error } = await supabase
        .from('categories')
        .update({
          name: name || existing.name,
          description: description !== undefined ? description : existing.description,
          sort_order: sort_order !== undefined ? sort_order : existing.sort_order,
          is_active: is_active !== undefined ? is_active : existing.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json(data);
    }

    if (req.method === 'DELETE' && id) {
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id);

      if (products && products.length > 0) {
        return res.status(400).json({ error: 'Bu kategoride ürünler var. Önce ürünleri silin.' });
      }

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      return res.json({ message: 'Kategori silindi' });
    }

    return res.status(404).json({ error: 'Endpoint bulunamadı' });
  } catch (error) {
    console.error('Categories error:', error);
    return res.status(500).json({ error: error.message });
  }
};
