import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake, AlertTriangle, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const categoryRefs = useRef({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const category of menu) {
        const element = categoryRefs.current[category.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(category.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menu]);

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
      
      if (menuData.length > 0) {
        setActiveCategory(menuData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToCategory = (categoryId) => {
    const element = categoryRefs.current[categoryId];
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    }
  };

  const formatPrice = (price) => {
    const currency = settings.currency || '₺';
    return `${Number(price).toFixed(2)} ${currency}`;
  };

  // İSTEK 4: Lightbox açma
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
      {/* Header with Logo - İSTEK 2 */}
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

      {/* FIX İSTEK 1: Category Navigation - sticky, kesik gözükmez */}
      {menu.length > 0 && (
        <nav className="menu-category-nav">
          <div className="menu-category-nav-inner">
            {menu.map((category) => (
              <button
                key={category.id}
                className={`menu-category-pill ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => scrollToCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="menu-main-content">
        {menu.length === 0 ? (
          <div className="menu-empty-state">
            <Cake />
            <h2>Menü Hazırlanıyor</h2>
            <p>Lezzetli ürünlerimiz yakında burada olacak.</p>
          </div>
        ) : (
          <AnimatePresence>
            {menu.map((category, categoryIndex) => (
              <motion.section
                key={category.id}
                ref={(el) => (categoryRefs.current[category.id] = el)}
                className="menu-category-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <div className="menu-category-header">
                  <div className="menu-category-line" />
                  <h2 className="menu-category-title">{category.name}</h2>
                  <div className="menu-category-line" style={{ transform: 'scaleX(-1)' }} />
                </div>

                {category.products.map((product, productIndex) => (
                  <motion.article
                    key={product.id}
                    className="menu-product-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 + productIndex * 0.05 }}
                  >
                    {/* İSTEK 4 & 5: Tıklanabilir görsel, contain fit */}
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
                    <div className="menu-product-info">
                      <div className="menu-product-header">
                        <h3 className="menu-product-name">{product.name}</h3>
                        <span className="menu-product-price">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      {product.description && (
                        <p className="menu-product-description">{product.description}</p>
                      )}
                      {/* İSTEK 3: Alerjenler */}
                      {product.allergens && (
                        <div className="menu-product-allergens">
                          <AlertTriangle />
                          <span>Alerjenler: {product.allergens}</span>
                        </div>
                      )}
                    </div>
                  </motion.article>
                ))}
              </motion.section>
            ))}
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className="menu-footer">
        <p className="menu-footer-text">
          {settings.restaurant_name || 'Gümüş Pastanesi'} • Afiyet Olsun
        </p>
      </footer>

      {/* İSTEK 4: Lightbox */}
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
