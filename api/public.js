const { supabase } = require('./lib/supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type } = req.query;

  try {
    // GET menu
    if (req.method === 'GET' && type === 'menu') {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, description, sort_order')
        .eq('is_active', 1)
        .order('sort_order', { ascending: true });

      if (catError) throw catError;

      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, category_id, name, description, price, image_url, allergens')
        .eq('is_active', 1)
        .order('sort_order', { ascending: true });

      if (prodError) throw prodError;

      const menu = categories?.map(category => ({
        ...category,
        products: products?.filter(p => p.category_id === category.id) || []
      })) || [];

      return res.json(menu);
    }

    // GET settings
    if (req.method === 'GET' && type === 'settings') {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      if (!settings || settings.length === 0) {
        return res.json({
          restaurant_name: 'Gümüş Pastanesi',
          restaurant_description: '1985\'ten beri taze lezzetler',
          currency: '₺',
          logo_url: ''
        });
      }

      const settingsObj = {};
      settings.forEach(s => { settingsObj[s.key] = s.value; });
      return res.json(settingsObj);
    }

    return res.status(404).json({ error: 'Endpoint bulunamadı' });
  } catch (error) {
    console.error('Public API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
