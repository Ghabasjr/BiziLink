import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Share2, AlertCircle, ArrowLeft, ChevronDown, Heart, MessageCircle, X } from 'lucide-react';

interface BusinessUser {
  id: string;
  businessName: string;
  whatsappNumber?: string;
  country?: string;
  state?: string;
  storeSlug: string;
  subscriptionStatus: string;
  email?: string;
  logoUrl?: string;
}

interface Product {
  id: string;
  title?: string;
  name?: string;
  price: string | number;
  description?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  category?: string;
  brandName?: string;
  color?: string;
  isOutOfStock?: boolean;
}

interface StoreBrand {
  name: string;
  image: string;
  colors: string;
}

const STORE_BRANDS: StoreBrand[] = [
  { name: "Gedzner", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=300&auto=format&fit=crop", colors: "20 colors" },
  { name: "Wagambari", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop", colors: "13 Colors" },
  { name: "Bazin", image: "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?q=80&w=300&auto=format&fit=crop", colors: "99 Colors" },
  { name: "Senator", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=300&auto=format&fit=crop", colors: "99 Colors" },
  { name: "Men Lace", image: "https://images.unsplash.com/photo-1597484662317-c87bdb34eed9?q=80&w=300&auto=format&fit=crop", colors: "10 Colors" },
  { name: "Dan Abba", image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=300&auto=format&fit=crop", colors: "8 Colors" },
];

const STORE_COLORS = [
  "All Colors",
  "Red",
  "Blue",
  "Green",
  "Gold",
  "White",
  "Black",
  "Yellow",
  "Purple",
  "Navy Blue",
  "Brown",
  "Pink",
  "Silver",
  "Orange",
  "Teal",
  "Maroon",
];

interface PublicStoreViewProps {
  storeSlug: string;
  onBackToAdmin?: () => void;
}

export const PublicStoreView: React.FC<PublicStoreViewProps> = ({ storeSlug, onBackToAdmin }) => {
  const [business, setBusiness] = useState<BusinessUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Brand selection & Modal State
  const [selectedBrand, setSelectedBrand] = useState<string>("Men Lace");
  const [tempSelectedBrand, setTempSelectedBrand] = useState<string>("Men Lace");
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  // Color selection & Modal State
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorModalOpen, setColorModalOpen] = useState(false);

  // Likes tracking
  const [likedProducts, setLikedProducts] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand');
    if (brandParam) {
      setSelectedBrand(brandParam);
      setTempSelectedBrand(brandParam);
    }
  }, []);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Business by storeSlug
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

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const bName = (p.brandName || p.name || p.title || '').toLowerCase();
      const matchesBrand = !selectedBrand || selectedBrand === 'All Brands' || bName.includes(selectedBrand.toLowerCase());

      const colorVal = (p.color || '').toLowerCase();
      const matchesColor = !selectedColor || selectedColor === 'All Colors' || colorVal.includes(selectedColor.toLowerCase());

      return matchesBrand && matchesColor;
    });
  }, [products, selectedBrand, selectedColor]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const toggleLike = (productId: string) => {
    setLikedProducts((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleWhatsAppOrder = (product: Product) => {
    if (!business?.whatsappNumber) {
      alert('Store owner has not provided a WhatsApp contact number.');
      return;
    }
    let cleanPhone = business.whatsappNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "234" + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith("234") && cleanPhone.length === 10) {
      cleanPhone = "234" + cleanPhone;
    }

    const productName = product.title || product.name || 'Product';
    const priceStr = typeof product.price === 'number' ? `₦${product.price.toLocaleString()}` : `₦${product.price}`;
    
    const message = encodeURIComponent(
      `Hello, I'm interested in the *${productName}* for ${priceStr}/Yard. Is it available?`
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
      <div style={styles.appContainer}>
        
        {/* Top Header */}
        <header style={styles.storeHeader}>
          <div style={styles.avatarCircle}>
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.businessName} style={styles.avatarImg} />
            ) : (
              <span style={styles.avatarLetter}>{business.businessName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div style={styles.storeHeaderText}>
            <h1 style={styles.storeTitle}>{business.businessName}</h1>
            <p style={styles.storeSubtitle}>Trusted Store</p>
          </div>
          <button onClick={handleShare} style={styles.shareBtn} title={copied ? "Link Copied!" : "Share Link"}>
            <Share2 size={18} color="#6B3FE7" />
            {copied && <span style={{ fontSize: '11px', color: '#6B3FE7', fontWeight: 600, marginLeft: '4px' }}>Copied!</span>}
          </button>
        </header>

        {!isStoreActive ? (
          <div style={styles.inactiveNotice}>
            <AlertCircle size={24} color="#F59E0B" />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#92400E' }}>Store Unavailable</h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#B45309' }}>
                This store's subscription is currently inactive.
              </p>
            </div>
          </div>
        ) : (
          <div style={styles.storeContent}>
            
            {/* Dropdown 1: Brand Trigger */}
            <button
              onClick={() => {
                setTempSelectedBrand(selectedBrand);
                setBrandModalOpen(true);
              }}
              style={styles.dropdownTrigger}
            >
              <span style={styles.dropdownTriggerText}>{selectedBrand} - Select Brands</span>
              <ChevronDown size={18} color="#888888" />
            </button>

            {/* Dropdown 2: Color Trigger */}
            <button
              onClick={() => setColorModalOpen(true)}
              style={styles.dropdownTrigger}
            >
              <span style={styles.dropdownTriggerText}>
                {selectedColor && selectedColor !== "All Colors" ? selectedColor : "Select Color"}
              </span>
              <ChevronDown size={18} color="#888888" />
            </button>

            {/* Product Cards List */}
            {filteredProducts.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📦</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px' }}>No products found</h3>
                <p style={{ fontSize: '13px', color: '#888888', margin: 0 }}>
                  There are no products currently available under "{selectedBrand}"{selectedColor ? ` in ${selectedColor}` : ''}.
                </p>
              </div>
            ) : (
              <div style={styles.productsContainer}>
                {filteredProducts.map((p) => {
                  const isLiked = !!likedProducts[p.id];
                  const img = (p.images && p.images[0]) || p.image || p.imageUrl || 'https://images.unsplash.com/photo-1597484662317-c87bdb34eed9?q=80&w=600&auto=format&fit=crop';
                  const title = p.title || p.name || 'Product';
                  const priceVal = typeof p.price === 'number' ? p.price.toLocaleString() : p.price;

                  return (
                    <div key={p.id} style={styles.productCard}>
                      
                      {/* Image Wrapper */}
                      <div style={styles.imageWrapper}>
                        <img src={img} alt={title} style={styles.productImg} />
                        
                        {/* Heart Button Overlay (top right) */}
                        <button
                          onClick={() => toggleLike(p.id)}
                          style={styles.heartBtn}
                        >
                          <Heart size={20} fill={isLiked ? "#E85252" : "#22C55E"} color={isLiked ? "#E85252" : "#22C55E"} />
                        </button>

                        {/* Floating Info Overlay (bottom) */}
                        <div style={styles.floatingInfoBox}>
                          <div style={styles.infoCol}>
                            <span style={styles.infoLabel}>Price</span>
                            <span style={styles.infoValue}>₦{priceVal}/Yard</span>
                          </div>
                          <div style={styles.infoDivider} />
                          <div style={styles.infoCol}>
                            <span style={styles.infoLabel}>Availability</span>
                            <span style={styles.infoValue}>{p.isOutOfStock ? 'Out of Stock' : 'In stock'}</span>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Button */}
                      <button
                        onClick={() => handleWhatsAppOrder(p)}
                        style={{
                          ...styles.whatsappBtn,
                          ...(p.isOutOfStock ? styles.whatsappBtnDisabled : {})
                        }}
                        disabled={p.isOutOfStock}
                      >
                        <MessageCircle size={20} color="#FFFFFF" />
                        <span>I Like This</span>
                      </button>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Brand Selection Modal (Has Continue Button) */}
      {brandModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setBrandModalOpen(false)}>
          <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Select Brand</h2>
              <button onClick={() => setBrandModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#666666" />
              </button>
            </div>

            <div style={styles.modalScroll}>
              <div style={styles.modalList}>
                {STORE_BRANDS.map((b) => {
                  const isSelected = tempSelectedBrand.toLowerCase() === b.name.toLowerCase();
                  return (
                    <div
                      key={b.name}
                      onClick={() => setTempSelectedBrand(b.name)}
                      style={{
                        ...styles.brandOptionCard,
                        ...(isSelected ? styles.brandOptionCardSelected : {})
                      }}
                    >
                      <img src={b.image} alt={b.name} style={styles.brandOptThumb} />
                      <div style={{ flex: 1 }}>
                        <div style={styles.brandOptName}>{b.name}</div>
                        <div style={styles.brandOptColors}>{b.colors}</div>
                      </div>
                      <div style={{ ...styles.radio, ...(isSelected ? styles.radioSelected : {}) }}>
                        {isSelected && <div style={styles.radioDot} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  setSelectedBrand(tempSelectedBrand);
                  setBrandModalOpen(false);
                }}
                style={styles.modalContinueBtn}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Selection Modal (Closed IMMEDIATELY upon selection) */}
      {colorModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setColorModalOpen(false)}>
          <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Select Color</h2>
              <button onClick={() => setColorModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#666666" />
              </button>
            </div>

            <div style={styles.modalScroll}>
              <div style={styles.modalList}>
                {STORE_COLORS.map((c) => {
                  const isSelected = (selectedColor?.toLowerCase() === c.toLowerCase()) || (!selectedColor && c === "All Colors");
                  return (
                    <div
                      key={c}
                      onClick={() => {
                        setSelectedColor(c === "All Colors" ? null : c);
                        setColorModalOpen(false);
                      }}
                      style={{
                        ...styles.colorOptionCard,
                        ...(isSelected ? styles.colorOptionCardSelected : {})
                      }}
                    >
                      <span style={styles.colorOptName}>{c}</span>
                      <div style={{ ...styles.radio, ...(isSelected ? styles.radioSelected : {}) }}>
                        {isSelected && <div style={styles.radioDot} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const PURPLE = "#6B3FE7";

const styles: { [key: string]: React.CSSProperties } = {
  pageWrap: {
    minHeight: '100vh',
    backgroundColor: '#F7F7F9',
    display: 'flex',
    justifyContent: 'center',
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
    borderTop: '4px solid #6B3FE7',
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
  appContainer: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#FFFFFF',
    minHeight: '100vh',
    boxShadow: '0 0 20px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  storeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 16px 12px',
  },
  avatarCircle: {
    width: '50px',
    height: '50px',
    borderRadius: '25px',
    backgroundColor: '#F0F0F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid #EAEAEA',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarLetter: {
    fontSize: '22px',
    fontWeight: 800,
    color: PURPLE,
  },
  storeHeaderText: {
    flex: 1,
  },
  storeTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: '#1A1A1A',
  },
  storeSubtitle: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: '#888888',
  },
  shareBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '19px',
    border: '1px solid #EAEAEA',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  inactiveNotice: {
    backgroundColor: '#FEF3C7',
    border: '1px solid #FCD34D',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
    margin: '20px 16px',
  },
  storeContent: {
    padding: '0 16px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dropdownTrigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: '30px',
    border: '1px solid #EAEAEA',
    padding: '14px 20px',
    minHeight: '52px',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },
  dropdownTriggerText: {
    fontSize: '14px',
    color: '#1A1A1A',
    fontWeight: 500,
  },
  productsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  productCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#F5F5FA',
    border: '1px solid #F0F0F5',
    height: '380px',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heartBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
  },
  floatingInfoBox: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    right: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #F0F0F0',
    boxSizing: 'border-box',
  },
  infoCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  infoLabel: {
    fontSize: '11px',
    color: '#6B6B80',
    fontWeight: 500,
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: 700,
    color: PURPLE,
  },
  infoDivider: {
    width: '1px',
    height: '28px',
    backgroundColor: '#EAEAEA',
    margin: '0 16px',
  },
  whatsappBtn: {
    backgroundColor: '#22C55E',
    borderRadius: '12px',
    height: '54px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(34,197,94,0.2)',
  },
  whatsappBtnDisabled: {
    backgroundColor: '#AAAAAA',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    paddingTop: '20px',
    paddingBottom: '24px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '75vh',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 18px 16px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#1A1A1A',
    textAlign: 'center',
    flex: 1,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  modalScroll: {
    overflowY: 'auto',
    padding: '0 18px',
    flex: 1,
  },
  modalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingBottom: '16px',
  },
  brandOptionCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #EFEFEF',
    gap: '14px',
    cursor: 'pointer',
  },
  brandOptionCardSelected: {
    borderColor: PURPLE,
  },
  brandOptThumb: {
    width: '58px',
    height: '58px',
    borderRadius: '12px',
    objectFit: 'cover',
    backgroundColor: '#F0F0F0',
  },
  brandOptName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1A1A1A',
  },
  brandOptColors: {
    fontSize: '12px',
    color: '#999999',
    marginTop: '3px',
  },
  colorOptionCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #EFEFEF',
    cursor: 'pointer',
  },
  colorOptionCardSelected: {
    borderColor: PURPLE,
  },
  colorOptName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  radio: {
    width: '22px',
    height: '22px',
    borderRadius: '11px',
    border: '2px solid #DEDEDE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  radioSelected: {
    borderColor: PURPLE,
  },
  radioDot: {
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: PURPLE,
  },
  modalFooter: {
    padding: '12px 18px 0',
    borderTop: '1px solid #EAEAEA',
  },
  modalContinueBtn: {
    width: '100%',
    backgroundColor: PURPLE,
    borderRadius: '30px',
    padding: '17px',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: '0.3px',
  },
};
