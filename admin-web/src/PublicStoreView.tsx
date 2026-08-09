import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { ShoppingBag, MapPin, Share2, Search, CheckCircle, AlertCircle, ArrowLeft, MessageSquare } from 'lucide-react';

interface BusinessUser {
  id: string;
  businessName: string;
  whatsappNumber?: string;
  country?: string;
  state?: string;
  storeSlug: string;
  subscriptionStatus: string;
  email?: string;
}

interface Product {
  id: string;
  title?: string;
  name?: string;
  price: string | number;
  description?: string;
  image?: string;
  imageUrl?: string;
  category?: string;
}

interface PublicStoreViewProps {
  storeSlug: string;
  onBackToAdmin?: () => void;
}

export const PublicStoreView: React.FC<PublicStoreViewProps> = ({ storeSlug, onBackToAdmin }) => {
  const [business, setBusiness] = useState<BusinessUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand');
    if (brandParam) {
      setSearchQuery(brandParam);
    }
  }, []);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch User / Business by storeSlug
        const usersRef = collection(db, 'users');
        const qUser = query(usersRef, where('storeSlug', '==', storeSlug));
        const userSnap = await getDocs(qUser);

        if (userSnap.empty) {
          setError('Store not found. Please check the URL and try again.');
          setLoading(false);
          return;
        }

        const userDoc = userSnap.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as BusinessUser;
        setBusiness(userData);

        // 2. Fetch products for this store
        const productsRef = collection(db, 'products');
        const qProducts = query(productsRef, where('storeId', '==', userDoc.id));
        const productsSnap = await getDocs(qProducts);

        const prodList: Product[] = [];
        productsSnap.forEach((doc) => {
          prodList.push({ id: doc.id, ...doc.data() } as Product);
        });

        setProducts(prodList);
      } catch (err: any) {
        console.error('Error fetching store data:', err);
        setError('Failed to load store catalog. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (storeSlug) {
      fetchStoreData();
    }
  }, [storeSlug]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const name = (p.title || p.name || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppOrder = (product: Product) => {
    if (!business?.whatsappNumber) {
      alert('Store owner has not provided a WhatsApp contact number.');
      return;
    }
    const cleanPhone = business.whatsappNumber.replace(/[^0-9]/g, '');
    const productName = product.title || product.name || 'Product';
    const priceStr = typeof product.price === 'number' ? `₦${product.price.toLocaleString()}` : `₦${product.price}`;
    
    const message = encodeURIComponent(
      `Hello ${business.businessName}, I am interested in purchasing "${productName}" (${priceStr}) from your BiziLink store.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: '#6B7280', fontSize: '15px' }}>Loading Store Catalog...</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Store Unavailable</h2>
          <p style={{ color: '#6B7280', marginBottom: '24px', lineHeight: 1.5 }}>{error || 'This store link is invalid or no longer active.'}</p>
          {onBackToAdmin && (
            <button onClick={onBackToAdmin} style={styles.btnSecondary}>
              <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Admin
            </button>
          )}
        </div>
      </div>
    );
  }

  const isStoreActive = business.subscriptionStatus === 'active';

  return (
    <div style={styles.pageWrap}>
      {/* Top Banner */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.avatar}>
              {business.businessName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={styles.businessTitle}>{business.businessName}</h1>
                <CheckCircle size={18} color="#10B981" />
              </div>
              <p style={styles.businessSubtitle}>
                <MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                {business.state ? `${business.state}, ${business.country || 'Nigeria'}` : 'Online Store'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleShare} style={styles.shareBtn}>
              <Share2 size={16} />
              <span>{copied ? 'Link Copied!' : 'Share Store'}</span>
            </button>
            {onBackToAdmin && (
              <button onClick={onBackToAdmin} style={styles.adminNavBtn}>
                Admin View
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {!isStoreActive ? (
          <div style={styles.inactiveNotice}>
            <AlertCircle size={24} color="#F59E0B" />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#92400E' }}>Catalog Temporarily Unavailable</h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#B45309' }}>
                This store is currently undergoing routine maintenance or subscription renewal. Please check back soon!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Search & Categories Bar */}
            <div style={styles.filterBar}>
              <div style={styles.searchBox}>
                <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search products in this store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              {categories.length > 0 && (
                <div style={styles.categoryPills}>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    style={selectedCategory === 'all' ? styles.activePill : styles.pill}
                  >
                    All Products ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={selectedCategory === cat ? styles.activePill : styles.pill}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div style={styles.emptyState}>
                <ShoppingBag size={48} color="#9CA3AF" />
                <h3 style={{ marginTop: '16px', color: '#374151', fontSize: '18px' }}>No products found</h3>
                <p style={{ color: '#6B7280', fontSize: '14px' }}>Try adjusting your search filter or check back later.</p>
              </div>
            ) : (
              <div style={styles.productGrid}>
                {filteredProducts.map((p) => {
                  const img = p.image || p.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image';
                  const title = p.title || p.name || 'Untitled Product';
                  const priceFormatted = typeof p.price === 'number' ? `₦${p.price.toLocaleString()}` : `₦${p.price}`;

                  return (
                    <div key={p.id} style={styles.productCard}>
                      <div style={styles.imageWrap}>
                        <img src={img} alt={title} style={styles.productImg} />
                      </div>
                      <div style={styles.cardBody}>
                        <span style={styles.priceBadge}>{priceFormatted}</span>
                        <h3 style={styles.productTitle}>{title}</h3>
                        {p.description && (
                          <p style={styles.productDesc}>
                            {p.description.length > 90 ? `${p.description.substring(0, 90)}...` : p.description}
                          </p>
                        )}
                        <button onClick={() => handleWhatsAppOrder(p)} style={styles.orderBtn}>
                          <MessageSquare size={16} /> Order via WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
          Powered by <strong>BiziLink</strong> — Grow your business with ease.
        </p>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  pageWrap: {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTop: '4px solid #7B2FE0',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: '20px',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '420px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#7B2FE0',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '18px',
  },
  businessTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
  },
  businessSubtitle: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: '#6B7280',
  },
  shareBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#F3E8FF',
    color: '#7B2FE0',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
  adminNavBtn: {
    padding: '8px 14px',
    backgroundColor: '#E5E7EB',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#E5E7EB',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  inactiveNotice: {
    backgroundColor: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
    margin: '20px 0',
  },
  filterBar: {
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  searchBox: {
    position: 'relative',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 42px',
    fontSize: '15px',
    borderRadius: '10px',
    border: '1px solid #D1D5DB',
    outline: 'none',
    boxSizing: 'border-box',
  },
  categoryPills: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  pill: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    color: '#4B5563',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  activePill: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid #7B2FE0',
    backgroundColor: '#7B2FE0',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
  },
  imageWrap: {
    width: '100%',
    height: '200px',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardBody: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  priceBadge: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#7B2FE0',
    marginBottom: '6px',
  },
  productTitle: {
    margin: '0 0 8px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  productDesc: {
    margin: '0 0 16px',
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: 1.4,
    flex: 1,
  },
  orderBtn: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#25D366',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
  },
  footer: {
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: '24px 20px',
    textAlign: 'center',
  },
};
