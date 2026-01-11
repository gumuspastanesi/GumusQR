import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  LayoutGrid, Settings, LogOut, Plus, Pencil, Trash2,
  X, Upload, Image, Cake, Eye, EyeOff, Save, ExternalLink
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
};

// Auth Hook
function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('gumusqr_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth?action=verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await fetch(`${API_URL}/api/auth?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('gumusqr_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const logout = () => {
    localStorage.removeItem('gumusqr_token');
    setToken(null);
    setUser(null);
  };

  return { token, user, login, logout, isAuthenticated: !!user, loading };
}

// API Helper
function useApi(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const get = async (url) => {
    const res = await fetch(`${API_URL}${url}`, { headers });
    return res.json();
  };

  const post = async (url, data) => {
    const res = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return res.json();
  };

  const put = async (url, data) => {
    const res = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return res.json();
  };

  const del = async (url) => {
    const res = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers
    });
    return res.json();
  };

  return { get, post, put, del };
}

// Login Component
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await onLogin(username, password);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error || 'Giriş başarısız');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-login-container">
        <form className="admin-login-card" onSubmit={handleSubmit}>
          <h1 className="admin-login-title">GumusQR Admin</h1>
          <p className="admin-login-subtitle">Menü yönetim paneline giriş yapın</p>

          <div className="admin-form-group">
            <label className="admin-form-label">Kullanıcı Adı</label>
            <input
              type="text"
              className="admin-form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Şifre</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="admin-form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-400)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="admin-btn admin-btn-primary admin-btn-block" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Category Modal
function CategoryModal({ category, onClose, onSave }) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isActive, setIsActive] = useState(category?.is_active !== 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Kategori adı gerekli');
      return;
    }
    setLoading(true);
    await onSave({
      id: category?.id,
      name: name.trim(),
      description: description.trim(),
      is_active: isActive ? 1 : 0
    });
    setLoading(false);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">
            {category ? 'Kategori Düzenle' : 'Yeni Kategori'}
          </h2>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            <div className="admin-form-group">
              <label className="admin-form-label">Kategori Adı *</label>
              <input
                type="text"
                className="admin-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="örn: Pastalar"
                autoFocus
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Açıklama</label>
              <textarea
                className="admin-form-input admin-form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kategori açıklaması (isteğe bağlı)"
              />
            </div>
            <div className="admin-form-group flex items-center gap-4">
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="admin-toggle-slider" />
              </label>
              <span className="admin-form-label" style={{ margin: 0 }}>
                Menüde göster
              </span>
            </div>
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Product Modal - İSTEK 3: Alerjenler eklendi
function ProductModal({ product, categories, onClose, onSave }) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price || '');
  const [allergens, setAllergens] = useState(product?.allergens || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || (categories[0]?.id || ''));
  const [isActive, setIsActive] = useState(product?.is_active !== 0);
  const [imagePreview, setImagePreview] = useState(product?.image_url || null);
  const [imageBase64, setImageBase64] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
      setImagePreview(base64);
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) {
      toast.error('Ürün adı, fiyat ve kategori gerekli');
      return;
    }
    setLoading(true);

    const data = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      allergens: allergens.trim(),
      category_id: categoryId,
      is_active: isActive ? 1 : 0,
      remove_image: removeImage
    };

    if (imageBase64) {
      data.image = imageBase64;
    }

    await onSave(product?.id, data);
    setLoading(false);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">
            {product ? 'Ürün Düzenle' : 'Yeni Ürün'}
          </h2>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            <div className="admin-form-group">
              <label className="admin-form-label">Ürün Görseli</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {imagePreview ? (
                <div className="admin-image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="admin-image-preview-remove"
                    onClick={handleRemoveImage}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className="admin-image-upload"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="admin-image-upload-icon" size={32} />
                  <p className="admin-image-upload-text">
                    <span>Görsel seçin</span> veya sürükleyip bırakın
                  </p>
                </div>
              )}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Ürün Adı *</label>
              <input
                type="text"
                className="admin-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="örn: Çikolatalı Pasta"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Açıklama</label>
              <textarea
                className="admin-form-input admin-form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ürün açıklaması"
              />
            </div>

            {/* İSTEK 3: Alerjenler Field */}
            <div className="admin-form-group">
              <label className="admin-form-label">Alerjenler</label>
              <input
                type="text"
                className="admin-form-input"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                placeholder="örn: Gluten, Süt, Yumurta, Fındık"
              />
            </div>

            <div className="flex gap-4">
              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-form-label">Fiyat (₺) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="admin-form-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-form-label">Kategori *</label>
                <select
                  className="admin-form-input admin-form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-group flex items-center gap-4">
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="admin-toggle-slider" />
              </label>
              <span className="admin-form-label" style={{ margin: 0 }}>
                Menüde göster
              </span>
            </div>
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// İSTEK 2: Settings Page - Logo yükleme dahil
function SettingsPage({ token }) {
  const api = useApi(token);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await api.get('/api/settings');
    setSettings(data);
    setLogoPreview(data.logo_url || null);
    setLoading(false);
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setLogoBase64(base64);
      setLogoPreview(base64);
    }
  };

  const handleRemoveLogo = () => {
    setLogoBase64(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    
    const data = { ...settings };
    
    if (logoBase64) {
      data.logo = logoBase64;
    } else if (!logoPreview && settings.logo_url) {
      data.remove_logo = true;
    }
    
    await api.put('/api/settings', data);
    toast.success('Ayarlar kaydedildi');
    setSaving(false);
    loadSettings();
  };

  if (loading) return <div className="text-center">Yükleniyor...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Ayarlar</h1>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Restoran Bilgileri</h2>
        </div>
        <div className="admin-card-body">
          {/* İSTEK 2: Logo Yükleme */}
          <div className="admin-form-group">
            <label className="admin-form-label">Logo</label>
            <input
              type="file"
              ref={logoInputRef}
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            <div className="admin-logo-preview">
              {logoPreview ? (
                <div className="admin-image-preview">
                  <img src={logoPreview} alt="Logo" />
                  <button
                    type="button"
                    className="admin-image-preview-remove"
                    onClick={handleRemoveLogo}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className="admin-image-upload"
                  style={{ width: 150 }}
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload className="admin-image-upload-icon" size={24} />
                  <p className="admin-image-upload-text">Logo Ekle</p>
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Restoran Adı</label>
            <input
              type="text"
              className="admin-form-input"
              value={settings.restaurant_name || ''}
              onChange={(e) =>
                setSettings({ ...settings, restaurant_name: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Slogan / Açıklama</label>
            <input
              type="text"
              className="admin-form-input"
              value={settings.restaurant_description || ''}
              onChange={(e) =>
                setSettings({ ...settings, restaurant_description: e.target.value })
              }
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Para Birimi</label>
            <input
              type="text"
              className="admin-form-input"
              value={settings.currency || ''}
              onChange={(e) =>
                setSettings({ ...settings, currency: e.target.value })
              }
              style={{ maxWidth: 100 }}
            />
          </div>
          <button
            className="admin-btn admin-btn-primary mt-4"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard
function Dashboard({ token, onLogout }) {
  const api = useApi(token);
  const [page, setPage] = useState('menu');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryModal, setCategoryModal] = useState(null);
  const [productModal, setProductModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/products')
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Category CRUD
  const saveCategory = async (data) => {
    try {
      if (data.id) {
        await api.put(`/api/categories?id=${data.id}`, data);
        toast.success('Kategori güncellendi');
      } else {
        await api.post('/api/categories', data);
        toast.success('Kategori eklendi');
      }
      setCategoryModal(null);
      loadData();
    } catch (err) {
      toast.error('Bir hata oluştu');
    }
  };

  const deleteCategory = async (id) => {
    const result = await api.del(`/api/categories?id=${id}`);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Kategori silindi');
      loadData();
    }
    setDeleteConfirm(null);
  };

  // Product CRUD
  const saveProduct = async (id, data) => {
    try {
      if (id) {
        await api.put(`/api/products?id=${id}`, data);
        toast.success('Ürün güncellendi');
      } else {
        await api.post('/api/products', data);
        toast.success('Ürün eklendi');
      }
      setProductModal(null);
      loadData();
    } catch (err) {
      toast.error('Bir hata oluştu');
    }
  };

  const deleteProduct = async (id) => {
    await api.del(`/api/products?id=${id}`);
    toast.success('Ürün silindi');
    setDeleteConfirm(null);
    loadData();
  };

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">
            <Cake size={24} />
            GumusQR
          </div>
          <nav className="admin-sidebar-nav">
            <button
              className={`admin-nav-item ${page === 'menu' ? 'active' : ''}`}
              onClick={() => setPage('menu')}
            >
              <LayoutGrid size={20} />
              Menü Yönetimi
            </button>
            <button
              className={`admin-nav-item ${page === 'settings' ? 'active' : ''}`}
              onClick={() => setPage('settings')}
            >
              <Settings size={20} />
              Ayarlar
            </button>
            <Link className="admin-nav-item" to="/">
              <ExternalLink size={20} />
              Menüyü Görüntüle
            </Link>
          </nav>
          <div className="admin-sidebar-footer">
            <button className="admin-nav-item" onClick={onLogout}>
              <LogOut size={20} />
              Çıkış Yap
            </button>
          </div>
        </aside>

        <main className="admin-main-content">
          {page === 'settings' ? (
            <SettingsPage token={token} />
          ) : (
            <>
              <div className="admin-page-header">
                <h1 className="admin-page-title">Menü Yönetimi</h1>
              </div>

              {/* Categories */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Kategoriler</h2>
                  <button
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    onClick={() => setCategoryModal({})}
                  >
                    <Plus size={16} />
                    Yeni Kategori
                  </button>
                </div>
                <div className="admin-table-container">
                  {loading ? (
                    <div className="admin-card-body text-center">Yükleniyor...</div>
                  ) : categories.length === 0 ? (
                    <div className="admin-empty-state">
                      <LayoutGrid />
                      <p>Henüz kategori eklenmemiş</p>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Kategori Adı</th>
                          <th>Ürün Sayısı</th>
                          <th>Durum</th>
                          <th style={{ width: 100 }}>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => (
                          <tr key={cat.id}>
                            <td><strong>{cat.name}</strong></td>
                            <td>{cat.product_count || 0}</td>
                            <td>
                              <span className={`admin-badge ${cat.is_active ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                {cat.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td>
                              <div className="admin-table-actions">
                                <button className="admin-btn admin-btn-ghost" onClick={() => setCategoryModal(cat)}>
                                  <Pencil size={16} />
                                </button>
                                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteConfirm({ type: 'category', item: cat })}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Products */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Ürünler</h2>
                  <button
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    onClick={() => setProductModal({})}
                    disabled={categories.length === 0}
                  >
                    <Plus size={16} />
                    Yeni Ürün
                  </button>
                </div>
                <div className="admin-table-container">
                  {loading ? (
                    <div className="admin-card-body text-center">Yükleniyor...</div>
                  ) : products.length === 0 ? (
                    <div className="admin-empty-state">
                      <Image />
                      <p>Henüz ürün eklenmemiş</p>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: 70 }}>Görsel</th>
                          <th>Ürün Adı</th>
                          <th>Kategori</th>
                          <th>Fiyat</th>
                          <th>Durum</th>
                          <th style={{ width: 100 }}>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((prod) => (
                          <tr key={prod.id}>
                            <td>
                              {prod.image_url ? (
                                <img src={prod.image_url} alt={prod.name} className="admin-table-image" />
                              ) : (
                                <div className="admin-table-image-placeholder">
                                  <Image size={20} />
                                </div>
                              )}
                            </td>
                            <td><strong>{prod.name}</strong></td>
                            <td>{prod.category_name}</td>
                            <td>{Number(prod.price).toFixed(2)} ₺</td>
                            <td>
                              <span className={`admin-badge ${prod.is_active ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                {prod.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td>
                              <div className="admin-table-actions">
                                <button className="admin-btn admin-btn-ghost" onClick={() => setProductModal(prod)}>
                                  <Pencil size={16} />
                                </button>
                                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteConfirm({ type: 'product', item: prod })}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        {/* Category Modal */}
        {categoryModal && (
          <CategoryModal
            category={categoryModal.id ? categoryModal : null}
            onClose={() => setCategoryModal(null)}
            onSave={saveCategory}
          />
        )}

        {/* Product Modal */}
        {productModal && (
          <ProductModal
            product={productModal.id ? productModal : null}
            categories={categories}
            onClose={() => setProductModal(null)}
            onSave={saveProduct}
          />
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Silme Onayı</h2>
                <button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="admin-modal-body">
                <p>
                  <strong>{deleteConfirm.item.name}</strong> {deleteConfirm.type === 'category' ? 'kategorisini' : 'ürününü'} silmek istediğinize emin misiniz?
                </p>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  İptal
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() => {
                    if (deleteConfirm.type === 'category') {
                      deleteCategory(deleteConfirm.item.id);
                    } else {
                      deleteProduct(deleteConfirm.item.id);
                    }
                  }}
                >
                  <Trash2 size={16} />
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Export
export default function AdminPage() {
  const { token, login, logout, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-login-container">
          <div className="menu-loading-spinner" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return <Dashboard token={token} onLogout={logout} />;
}
