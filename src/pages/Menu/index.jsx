import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake, AlertTriangle, X, ChevronDown, ChevronUp, Instagram, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Instagram ve Google Yorumlar linkleri - bunları değiştir
const INSTAGRAM_URL = 'https://www.instagram.com/gumuspasta?igsh=MWswanV0eTZmM2tjdg==';
const GOOGLE_REVIEWS_URL = 'https://search.google.com/local/reviews?placeid=ChIJE1UVbE1P0xQRhG4AnShbLC0';

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, settingsRes] = await Promise.all([
        fetch(`${API_URL}/api/public?type=menu`),
        fetch(`${API_URL}/api/public?type=settings`)
      ]);
      
      const menuData = await menuRes.json();
      const settingsData = await settingsRes.json();
      
      setMenu(menuData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const formatPrice = (price) => {
    const currency = settings.currency || '₺';
    return `${Number(price).toFixed(0)}${currency}`;
  };

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    document.body.style.overflow = 'hidden';
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    document.body.style.overflow = '';
  };

  if (loading) {
    return (
      <div className="menu-page">
        <div className="menu-loading-container">
          <div className="menu-loading-spinner" />
          <p className="menu-loading-text">Menü yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {/* Header with Logo */}
      <header className="menu-header">
        {settings.logo_url && (
          <img 
            src={settings.logo_url} 
            alt="Logo" 
            className="menu-logo"
          />
        )}
        <h1 className="menu-restaurant-name">
          {settings.restaurant_name || 'Gümüş Pastanesi'}
        </h1>
        <p className="menu-restaurant-tagline">
          {settings.restaurant_description || 'Taze ve lezzetli pastalar'}
        </p>
        <div className="menu-gold-divider" />
        
        {/* Social Links */}
        <div className="menu-social-links">
          <a 
            href={INSTAGRAM_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="menu-social-link instagram"
          >
            <Instagram size={18} />
            <span>Bizi Instagram'dan takip edin</span>
          </a>
          <a 
            href={GOOGLE_REVIEWS_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="menu-social-link google"
          >
            <Star size={18} />
            <span>Bize Google'dan yorum yapın</span>
          </a>
        </div>
      </header>

      {/* Main Content - Accordion Categories */}
      <main className="menu-main-content">
        {menu.length === 0 ? (
          <div className="menu-empty-state">
            <Cake />
            <h2>Menü Hazırlanıyor</h2>
            <p>Lezzetli ürünlerimiz yakında burada olacak.</p>
          </div>
        ) : (
          <div className="menu-accordion">
            {menu.map((category, categoryIndex) => (
              <motion.div
                key={category.id}
                className="menu-accordion-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.05 }}
              >
                {/* Accordion Header - Ürün sayısı kaldırıldı */}
                <button
                  className={`menu-accordion-header ${expandedCategories[category.id] ? 'expanded' : ''}`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="menu-accordion-header-content">
                    <span className="menu-accordion-icon">
                      {expandedCategories[category.id] ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </span>
                    <span className="menu-accordion-title">{category.name}</span>
                  </div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence>
                  {expandedCategories[category.id] && (
                    <motion.div
                      className="menu-accordion-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="menu-products-grid">
                        {category.products.map((product, productIndex) => (
                          <motion.article
                            key={product.id}
                            className="menu-product-card"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: productIndex * 0.05 }}
                            onClick={() => openProductDetail(product)}
                          >
                            {/* Product Image */}
                            <div className="menu-product-image-container">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="menu-product-image"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="menu-product-placeholder">
                                  <Cake />
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="menu-product-info">
                              <h3 className="menu-product-name">{product.name}</h3>
                              
                              {product.description && (
                                <p className="menu-product-description">
                                  {product.description.length > 60 
                                    ? product.description.substring(0, 60) + '...' 
                                    : product.description}
                                </p>
                              )}
                              
                              <div className="menu-product-price">
                                {formatPrice(product.price)}
                              </div>
                            </div>
                          </motion.article>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer - Alerjen Uyarısı */}
      <footer className="menu-footer">
        <p className="menu-footer-text">
          Ürünlerimizde alerjenler bulunabilir. Detaylı bilgi için lütfen iletişime geçiniz. Sunum ve içerikte değişiklik olabilir.
        </p>
      </footer>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="product-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProductDetail}
          >
            <motion.div
              className="product-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="product-modal-close" onClick={closeProductDetail}>
                <X size={24} />
              </button>
              
              {/* Product Image */}
              {selectedProduct.image_url && (
                <div className="product-modal-image-container">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="product-modal-image"
                  />
                </div>
              )}
              
              {/* Product Details */}
              <div className="product-modal-content">
                <h2 className="product-modal-name">{selectedProduct.name}</h2>
                
                <div className="product-modal-price">
                  {formatPrice(selectedProduct.price)}
                </div>
                
                {selectedProduct.description && (
                  <p className="product-modal-description">
                    {selectedProduct.description}
                  </p>
                )}
                
                {selectedProduct.allergens && (
                  <div className="product-modal-allergens">
                    <AlertTriangle size={16} />
                    <div>
                      <strong>Alerjenler:</strong>
                      <span>{selectedProduct.allergens}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}