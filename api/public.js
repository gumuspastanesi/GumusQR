import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type } = req.query;

  try {
    if (req.method === 'GET' && type === 'menu') {
      const { data: categories } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
      const { data: products } = await supabase.from('products').select('*').eq('is_active', true).order('sort_order');

      const menu = categories?.map(cat => ({
        ...cat,
        products: products?.filter(p => p.category_id === cat.id) || []
      })) || [];
      return res.json(menu);
    }
    return res.status(404).end();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}