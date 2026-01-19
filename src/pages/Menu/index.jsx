import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);

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

  const openLightbox = (imageUrl) => {
    if (imageUrl) {
      setLightboxImage(imageUrl);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeLightbox = () => {
    setLightboxImage(null);
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
                {/* Accordion Header */}
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
                  <span className="menu-accordion-count">
                    {category.products.length} ürün
                  </span>
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
                          >
                            {/* Product Image */}
                            <div 
                              className="menu-product-image-container"
                              onClick={() => openLightbox(product.image_url)}
                            >
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
                              
                              {product.allergens && (
                                <div className="menu-product-allergens">
                                  <AlertTriangle size={12} />
                                  <span>{product.allergens}</span>
                                </div>
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

      {/* Footer */}
      <footer className="menu-footer">
        <p className="menu-footer-text">
          {settings.restaurant_name || 'Gümüş Pastanesi'} • Afiyet Olsun
        </p>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <button className="lightbox-close" onClick={closeLightbox}>
              <X size={24} />
            </button>
            <motion.img
              src={lightboxImage}
              alt="Enlarged"
              className="lightbox-image"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}