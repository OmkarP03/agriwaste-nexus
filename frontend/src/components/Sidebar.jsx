import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API } from '../utils/apiRoot';
import { useLang } from '../context/LangContext';

// ── Navigation, grouped. Page ids are unchanged; `key` is the
//    translation key so the language toggle reaches the nav too. ──
const FARMER_NAV = [
  {
    label: 'navMain',
    items: [
      { id: 'dashboard',  icon: '📊', key: 'dashboard' },
      { id: 'calculator', icon: '🌾', key: 'wasteCalculator' },
      { id: 'biogas',     icon: '🔥', key: 'biogasEstimator' },
      { id: 'biochar',    icon: '⚗️', key: 'biocharAdvisor' },
    ],
  },
  {
    label: 'navMarketplace',
    items: [
      { id: 'marketplace', icon: '🛒', key: 'marketplace' },
      { id: 'requests',    icon: '📨', key: 'purchaseRequests' },
      { id: 'myListings',  icon: '📋', key: 'myListings' },
    ],
  },
  {
    label: 'navImpact',
    items: [
      { id: 'carbon',   icon: '🌍', key: 'carbonCredits' },
      { id: 'locator',  icon: '📍', key: 'plantLocator' },
      { id: 'farmerId', icon: '🪪', key: 'farmerId' },
    ],
  },
];

const BUYER_NAV = [
  {
    label: 'navMain',
    items: [
      { id: 'dashboard', icon: '📊', key: 'dashboard' },
    ],
  },
  {
    label: 'navMarketplace',
    items: [
      { id: 'marketplace', icon: '🛒', key: 'marketplace' },
      { id: 'myRequests',  icon: '📨', key: 'myRequests' },
    ],
  },
  {
    label: 'navImpact',
    items: [
      { id: 'locator', icon: '📍', key: 'plantLocator' },
    ],
  },
];

const ADMIN_NAV = [
  {
    label: 'navMain',
    items: [
      { id: 'admin', icon: '👑', key: 'adminDashboard' },
    ],
  },
];

export default function Sidebar({ activePage, setPage, sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const [notifications, setNotifications] = useState([]);

  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?._id) return;

    function refresh() {
      axios
        .get(`${API}/notifications/${user._id}`)
        .then(res => {
          const list = res.data.notifications || [];
          setNotifications(list);
          // badge counts unread, not everything ever received
          setUnread(res.data.unread ?? list.filter(n => !n.read).length);
        })
        .catch(() => { setNotifications([]); setUnread(0); });
    }

    refresh();

    // the Notifications page fires this once it has marked them read
    window.addEventListener('notifications:read', refresh);
    return () => window.removeEventListener('notifications:read', refresh);
  }, [user]);

  const groups =
    user?.role === 'admin' ? ADMIN_NAV
      : user?.role === 'buyer' ? BUYER_NAV
        : FARMER_NAV;

  const roleLabel =
    user?.role === 'admin' ? t('roleAdmin')
      : user?.role === 'buyer' ? t('roleBuyer')
        : t('roleFarmer');

  const NavButton = ({ item, count }) => (
    <button
      type="button"
      className={`nav-item ${activePage === item.id ? 'active' : ''}`}
      aria-current={activePage === item.id ? 'page' : undefined}
      onClick={() => setPage(item.id)}
    >
      <span className="icon" aria-hidden="true">{item.icon}</span>
      <span>{item.key ? t(item.key) : item.label}</span>
      {count > 0 && <span className="nav-count">{count}</span>}
    </button>
  );

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sidebar-overlay"
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,35,20,0.55)',
            zIndex: 99,
            display: 'none',
          }}
        />
      )}

      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar-mobile-open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="sidebar-lockup">
              <img className="sidebar-mark" src="/images/mark.png" alt="" aria-hidden="true" />
              <h1>AgriWaste Nexus</h1>
            </div>
            <button
              className="sidebar-close-btn push"
              onClick={() => setSidebarOpen && setSidebarOpen(false)}
              aria-label="Close navigation menu"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        {user && (
          <button type="button" className="sidebar-user" onClick={() => setPage('profile')}>
            <span className="su-avatar" aria-hidden="true">
              {user.role === 'farmer' ? '🧑‍🌾' : user.role === 'admin' ? '👑' : '🏭'}
            </span>
            <span className="su-info">
              <span className="su-name" style={{ display: 'block' }}>{user.name}</span>
              <span className="su-role" style={{ display: 'block' }}>
                {roleLabel} · {user.district || user.village || 'Maharashtra'}
              </span>
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.5 }} aria-hidden="true">›</span>
          </button>
        )}

        <nav className="nav-section">
          {groups.map(group => (
            <div className="nav-group" key={group.label}>
              <label>{t(group.label)}</label>
              {group.items.map(item => (
                <NavButton key={item.id} item={item} />
              ))}
            </div>
          ))}

          <div className="nav-group">
            <label>{t('navAccount')}</label>
            <NavButton
              item={{ id: 'notifications', icon: '🔔', key: 'notificationsNav' }}
              count={unread}
            />
            <NavButton item={{ id: 'profile', icon: '👤', key: 'myProfile' }} />
            <button type="button" className="nav-item" onClick={logout}>
              <span className="icon" aria-hidden="true">🚪</span>
              <span>{t('logout')}</span>
            </button>
          </div>
        </nav>

      </aside>
    </>
  );
}
