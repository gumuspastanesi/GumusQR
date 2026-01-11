const { supabase } = require('./lib/supabase');
const { authenticate } = require('./lib/auth');
const { uploadImage, deleteImage } = require('./lib/cloudinary');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

  const { id, category_id } = req.query;

  try {
    // GET all
    if (req.method === 'GET' && !id && !category_id) {
      const { data: products, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('category_id')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const result = products.map(p => ({
        ...p,
        category_name: p.categories?.name || ''
      }));

      return res.json(result);
    }

    // GET by category
    if (req.method === 'GET' && category_id) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category_id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return res.json(data);
    }

    // GET single
    if (req.method === 'GET' && id) {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      if (error || !data) return res.status(404).json({ error: 'Ürün bulunamadı' });
      return res.json({ ...data, category_name: data.categories?.name || '' });
    }

    // POST
    if (req.method === 'POST') {
      const { category_id, name, description, price, allergens, sort_order, is_active, image } = req.body;

      if (!category_id || !name || price === undefined) {
        return res.status(400).json({ error: 'Kategori, ürün adı ve fiyat gerekli' });
      }

      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .single();

      if (!category) return res.status(400).json({ error: 'Geçersiz kategori' });

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image, 'products');
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          category_id: parseInt(category_id),
          name,
          description: description || '',
          price: parseFloat(price),
          image_url: imageUrl,
          allergens: allergens || '',
          sort_order: sort_order || 0,
          is_active: is_active !== undefined ? is_active : 1
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // PUT
    if (req.method === 'PUT' && id) {
      const { category_id, name, description, price, allergens, sort_order, is_active, image, remove_image } = req.body;

      const { data: existing } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });

      let imageUrl = existing.image_url;

      if (remove_image) {
        await deleteImage(existing.image_url);
        imageUrl = null;
      }

      if (image) {
        await deleteImage(existing.image_url);
        imageUrl = await uploadImage(image, 'products');
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          category_id: category_id ? parseInt(category_id) : existing.category_id,
          name: name || existing.name,
          description: description !== undefined ? description : existing.description,
          price: price !== undefined ? parseFloat(price) : existing.price,
          image_url: imageUrl,
          allergens: allergens !== undefined ? allergens : existing.allergens,
          sort_order: sort_order !== undefined ? sort_order : existing.sort_order,
          is_active: is_active !== undefined ? is_active : existing.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json(data);
    }

    // DELETE
    if (req.method === 'DELETE' && id) {
      const { data: existing } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', id)
        .single();

      if (!existing) return res.status(404).json({ error: 'Ürün bulunamadı' });

      await deleteImage(existing.image_url);

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.json({ message: 'Ürün silindi' });
    }

    return res.status(404).json({ error: 'Endpoint bulunamadı' });
  } catch (error) {
    console.error('Products error:', error);
    return res.status(500).json({ error: error.message });
  }
};
