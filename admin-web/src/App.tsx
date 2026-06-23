import React, { useState, useEffect, useMemo } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  updateDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  Search, 
  LogOut, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Maximize2,
  Phone,
  MessageSquare,
  Globe,
  Mail,
  User as UserIcon,
  Shield,
  FileText
} from 'lucide-react';

interface UserProfile {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  storeSlug?: string;
  subscriptionStatus: 'active' | 'pending' | 'expired';
  receiptUrl?: string;
  receiptSubmittedAt?: string;
  activatedAt?: string;
  rejectedAt?: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // App data state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'expired'>('pending');

  // Modal / Detail states
  const [zoomedReceipt, setZoomedReceipt] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Trigger Toast Notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        try {
          // Verify user role in Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userDoc.exists() && userData?.role === 'admin') {
            setCurrentUser(user);
            setIsAdmin(true);
          } else {
            // Logged in but not an admin!
            setLoginError('Access denied. This account does not have Admin privileges.');
            await signOut(auth);
            setCurrentUser(null);
            setIsAdmin(false);
          }
        } catch (err: any) {
          setLoginError('Error validating admin credentials: ' + err.message);
          await signOut(auth);
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen for Realtime users updates when admin is validated
  useEffect(() => {
    if (!isAdmin || !currentUser) return;

    setDataLoading(true);
    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Include any document that has a businessName or subscriptionStatus
        if (data.fullName || data.subscriptionStatus) {
          list.push({ id: doc.id, ...data } as UserProfile);
        }
      });
      // Sort users by receipt submission time, or name
      list.sort((a, b) => {
        const dateA = a.receiptSubmittedAt ? new Date(a.receiptSubmittedAt).getTime() : 0;
        const dateB = b.receiptSubmittedAt ? new Date(b.receiptSubmittedAt).getTime() : 0;
        return dateB - dateA;
      });
      setUsers(list);
      setDataLoading(false);
    }, (error) => {
      showToast('Error listening to user updates: ' + error.message, 'error');
      setDataLoading(false);
    });

    return unsubscribe;
  }, [isAdmin, currentUser]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }

    try {
      setLoginError('');
      setLoginSubmitting(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to log in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      setLoginError(msg);
      setLoginSubmitting(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Logged out successfully.', 'success');
    } catch (err: any) {
      showToast('Logout failed: ' + err.message, 'error');
    }
  };

  // Handle Activation/Approval
  const handleActivate = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to approve & activate ${name}'s subscription?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await updateDoc(doc(db, 'users', userId), {
        subscriptionStatus: 'active',
        activatedAt: new Date().toISOString(),
      });
      showToast(`Subscription activated for ${name}.`, 'success');
    } catch (err: any) {
      showToast(`Activation failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Rejection
  const handleReject = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to reject ${name}'s proof of payment? This will expire their subscription.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await updateDoc(doc(db, 'users', userId), {
        subscriptionStatus: 'expired',
        rejectedAt: new Date().toISOString(),
      });
      showToast(`Rejected payment receipt for ${name}.`, 'success');
    } catch (err: any) {
      showToast(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const pending = users.filter(u => u.subscriptionStatus === 'pending').length;
    const active = users.filter(u => u.subscriptionStatus === 'active').length;
    const expired = users.filter(u => u.subscriptionStatus === 'expired').length;
    return { pending, active, expired, total: users.length };
  }, [users]);

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Status filter
      if (activeTab !== 'all' && u.subscriptionStatus !== activeTab) {
        return false;
      }
      
      // Search filter
      if (searchQuery.trim() !== '') {
        const queryText = searchQuery.toLowerCase();
        const matchesName = u.fullName?.toLowerCase().includes(queryText);
        const matchesBusiness = u.businessName?.toLowerCase().includes(queryText);
        const matchesEmail = u.email?.toLowerCase().includes(queryText);
        const matchesSlug = u.storeSlug?.toLowerCase().includes(queryText);
        return matchesName || matchesBusiness || matchesEmail || matchesSlug;
      }
      
      return true;
    });
  }, [users, activeTab, searchQuery]);

  // Render Loading Screen
  if (authLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Verifying Admin session...</p>
      </div>
    );
  }

  // Render Auth Screen (Login)
  if (!currentUser || !isAdmin) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div className="stat-icon-wrapper" style={{ width: '60px', height: '60px', borderRadius: '16px' }}>
              <Shield size={32} />
            </div>
          </div>
          <h1 className="auth-logo">BiziLink</h1>
          <p className="auth-subtitle">Super Admin Access Portal</p>
          
          {loginError && <div className="error-alert">{loginError}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="admin@bizilink.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-btn"
              disabled={loginSubmitting}
            >
              {loginSubmitting ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Dashboard Screen
  return (
    <div className="dashboard-container">
      {/* Navigation bar */}
      <nav className="dashboard-nav">
        <div className="logo-group">
          <h1 className="auth-logo" style={{ marginBottom: 0, fontSize: '24px' }}>BiziLink</h1>
          <span className="logo-badge">Super Admin</span>
        </div>
        <div className="nav-user">
          <span className="info-item" style={{ fontSize: '14px', fontWeight: 600 }}>
            <Shield size={16} /> {currentUser.email}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="dashboard-main">
        {/* Header Title */}
        <div className="dashboard-header">
          <h2 className="dashboard-title">Operational Dashboard</h2>
          <p className="dashboard-subtitle">Monitor activities, inspect proofs of payment, and manage user subscription access.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card" onClick={() => setActiveTab('pending')} style={{ cursor: 'pointer' }}>
            <div>
              <span className="stat-label">Pending Reviews</span>
              <div className="stat-value" style={{ color: 'var(--status-pending)' }}>{stats.pending}</div>
            </div>
            <div className="stat-icon-wrapper" style={{ color: 'var(--status-pending)' }}>
              <Clock size={24} />
            </div>
          </div>

          <div className="stat-card" onClick={() => setActiveTab('active')} style={{ cursor: 'pointer' }}>
            <div>
              <span className="stat-label">Active Users</span>
              <div className="stat-value" style={{ color: 'var(--status-active)' }}>{stats.active}</div>
            </div>
            <div className="stat-icon-wrapper" style={{ color: 'var(--status-active)' }}>
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="stat-card" onClick={() => setActiveTab('expired')} style={{ cursor: 'pointer' }}>
            <div>
              <span className="stat-label">Expired / Rejected</span>
              <div className="stat-value" style={{ color: 'var(--status-expired)' }}>{stats.expired}</div>
            </div>
            <div className="stat-icon-wrapper" style={{ color: 'var(--status-expired)' }}>
              <XCircle size={24} />
            </div>
          </div>

          <div className="stat-card" onClick={() => setActiveTab('all')} style={{ cursor: 'pointer' }}>
            <div>
              <span className="stat-label">Total Listings</span>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-icon-wrapper">
              <UserIcon size={24} />
            </div>
          </div>
        </div>

        {/* Filters and search section */}
        <div className="controls-bar">
          <div className="tabs-group">
            <button 
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({stats.pending})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active ({stats.active})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
              onClick={() => setActiveTab('expired')}
            >
              Expired ({stats.expired})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({stats.total})
            </button>
          </div>

          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by store slug, business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Data load states / Dashboard content grid */}
        {dataLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Fetching database snapshots...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon">
              {activeTab === 'pending' ? '🎉' : '📂'}
            </div>
            <h4 className="empty-title">
              {activeTab === 'pending' 
                ? 'All Clear!' 
                : 'No accounts found'}
            </h4>
            <p className="empty-text">
              {activeTab === 'pending'
                ? 'No pending subscription requests are currently awaiting review.'
                : 'No users matched your active filter rules and search query.'}
            </p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {filteredUsers.map((user) => {
              const isActing = actionLoading === user.id;
              const formattedDate = user.receiptSubmittedAt 
                ? new Date(user.receiptSubmittedAt).toLocaleString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—';

              return (
                <div className="user-card" key={user.id}>
                  {/* Card head */}
                  <div className="card-header">
                    <div className="avatar-circle">
                      {user.fullName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="user-meta">
                      <h4 className="user-name">{user.fullName}</h4>
                      <p className="business-name">{user.businessName || '—'}</p>
                    </div>
                    <span className={`badge ${user.subscriptionStatus}`}>
                      {user.subscriptionStatus}
                    </span>
                  </div>

                  {/* Info fields */}
                  <div className="info-list">
                    <div className="info-item">
                      <Mail size={14} />
                      <span>{user.email}</span>
                    </div>
                    {user.phoneNumber && (
                      <div className="info-item">
                        <Phone size={14} />
                        <span>{user.phoneNumber}</span>
                      </div>
                    )}
                    {user.whatsappNumber && (
                      <div className="info-item">
                        <MessageSquare size={14} />
                        <a 
                          href={`https://wa.me/${user.whatsappNumber.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: 'var(--primary)', textDecoration: 'none' }}
                        >
                          WhatsApp: {user.whatsappNumber}
                        </a>
                      </div>
                    )}
                    {user.storeSlug && (
                      <div className="info-item">
                        <Globe size={14} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          /{user.storeSlug}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="divider" />

                  {/* Receipt Preview */}
                  <div className="receipt-section">
                    <h5 className="receipt-title">Payment Evidence</h5>
                    {user.receiptUrl ? (
                      <div 
                        className="receipt-preview-box"
                        onClick={() => setZoomedReceipt(user.receiptUrl || null)}
                      >
                        <img 
                          src={user.receiptUrl} 
                          alt="Transaction receipt" 
                          className="receipt-img"
                          onError={(e) => {
                            // If load fails, hide image and show placeholder text
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="receipt-overlay">
                          <Maximize2 size={18} style={{ marginRight: '6px' }} />
                          Click to Expand
                        </div>
                      </div>
                    ) : (
                      <div className="receipt-preview-box" style={{ cursor: 'default' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--status-expired)' }}>
                          <AlertTriangle size={20} />
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>No Receipt Submitted</span>
                        </div>
                      </div>
                    )}
                    {user.receiptSubmittedAt && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={12} />
                        Submitted: {formattedDate}
                      </p>
                    )}
                  </div>

                  {/* Actions (Only show for pending users) */}
                  {user.subscriptionStatus === 'pending' && (
                    <div className="action-row">
                      <button 
                        className="card-btn reject" 
                        disabled={isActing}
                        onClick={() => handleReject(user.id, user.fullName)}
                      >
                        Reject
                      </button>
                      <button 
                        className="card-btn approve" 
                        disabled={isActing}
                        onClick={() => handleActivate(user.id, user.fullName)}
                      >
                        Activate
                      </button>
                    </div>
                  )}
                  
                  {/* Metadata display for activated/rejected cards */}
                  {user.subscriptionStatus === 'active' && user.activatedAt && (
                    <div style={{ marginTop: 'auto', fontSize: '11px', color: 'var(--status-active)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} />
                      <span>Approved on: {new Date(user.activatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {user.subscriptionStatus === 'expired' && user.rejectedAt && (
                    <div style={{ marginTop: 'auto', fontSize: '11px', color: 'var(--status-expired)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={12} />
                      <span>Rejected on: {new Date(user.rejectedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Expanded Receipt Modal */}
      {zoomedReceipt && (
        <div className="modal-overlay" onClick={() => setZoomedReceipt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setZoomedReceipt(null)}>
              ✕ Close
            </button>
            <img src={zoomedReceipt} alt="Zoomed Receipt" className="modal-image" />
          </div>
        </div>
      )}

      {/* Toast Popup Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
