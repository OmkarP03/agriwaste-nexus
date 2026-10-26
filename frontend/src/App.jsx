import React, { useState } from 'react';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider, useLang } from './context/LangContext';

import AuthWrapper from './components/AuthWrapper';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import LangToggle from './components/LangToggle';
import KisanMitraChat from './components/KisanMitraChat';
import InstallPrompt from './components/InstallPrompt';

import Dashboard from './pages/Dashboard';
import WasteCalculator from './pages/WasteCalculator';
import BiogasEstimator from './pages/BiogasEstimator';
import BiocharAdvisor from './pages/BiocharAdvisor';
import CarbonCredits from './pages/CarbonCredits';
import Marketplace from './pages/Marketplace';
import FarmerRequests from './pages/FarmerRequests';
import MyRequests from './pages/MyRequests';
import MyListingsPage from './pages/MyListingsPage';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import PlantLocator from './pages/PlantLocator';
import ProfilePage from './pages/ProfilePage';
import FarmerIDPage from './pages/FarmerIDPage';

function MainApp() {
  const { t } = useLang();
  const { user } = useAuth();

  const PAGE_TITLES = {
    dashboard:     { title: t('dashboard'),        sub: t('appTagline') },
    calculator:    { title: t('wasteCalculator'),  sub: t('wasteCalcDesc') },
    biogas:        { title: t('biogasEstimator'),  sub: t('biogasDesc') },
    biochar:       { title: t('biocharAdvisor'),   sub: t('biocharDesc') },
    carbon:        { title: t('carbonCredits'),    sub: t('carbonDesc') },
    marketplace:   { title: t('marketplace'),      sub: t('marketplaceDesc') },
    myListings:    { title: t('myListings'),       sub: t('myListingsSub') },
    locator:       { title: t('plantLocator'),     sub: t('locatorDesc') },
    profile:       { title: t('myProfile'),        sub: t('profileDetails') },
    farmerId:      { title: t('farmerId'),         sub: t('farmerIdSub') },
    myRequests:    { title: t('myRequests'),       sub: t('myRequestsSub') },
    requests:      { title: t('purchaseRequests'), sub: t('requestsSub') },
    notifications: { title: t('notificationsNav'), sub: t('notificationsSub') },
    admin:         { title: t('adminDashboard'),   sub: t('adminSub') },
  };

  const [page, setPage] = useState('dashboard');
  const [showChat, setShowChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const info = PAGE_TITLES[page] || PAGE_TITLES.dashboard;

  // Navigating from anywhere should close the mobile drawer
  function goToPage(next) {
    setPage(next);
    setSidebarOpen(false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return user?.role === 'admin'
          ? <AdminDashboard />
          : <Dashboard setPage={goToPage} />;
      case 'calculator':    return <WasteCalculator />;
      case 'biogas':        return <BiogasEstimator />;
      case 'biochar':       return <BiocharAdvisor />;
      case 'carbon':        return <CarbonCredits />;
      case 'marketplace':   return <Marketplace />;
      case 'myRequests':    return <MyRequests />;
      case 'requests':      return <FarmerRequests />;
      case 'myListings':    return <MyListingsPage />;
      case 'notifications': return <Notifications />;
      case 'locator':       return <PlantLocator />;
      case 'profile':       return <ProfilePage setPage={goToPage} />;
      case 'farmerId':      return <FarmerIDPage />;
      case 'admin':         return <AdminDashboard />;
      default:              return <Dashboard setPage={goToPage} />;
    }
  };

  return (
    <div className="app-with-header">
      <InstallPrompt />
      <TopHeader />

      <div className="app-layout">
        <Sidebar
          activePage={page}
          setPage={goToPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="main-content">

          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <button
                className="hamburger-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
              >
                <span aria-hidden="true">☰</span>
              </button>
              <div style={{ minWidth: 0 }}>
                <h2>{info.title}</h2>
                <div className="subtitle">{info.sub}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LangToggle />
            </div>
          </div>

          <div className="page-body">
            {renderPage()}
          </div>

          <Footer />
        </div>
      </div>

      {/* Kisan Mitra assistant */}
      {showChat ? (
        <KisanMitraChat onClose={() => setShowChat(false)} />
      ) : (
        <button
          type="button"
          className="chat-fab"
          onClick={() => setShowChat(true)}
          aria-label="Open Kisan Mitra chat assistant"
          title="Chat with Kisan Mitra"
        >
          <img src="/chatbot.png" alt="" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AuthWrapper>
          <MainApp />
        </AuthWrapper>
      </AuthProvider>
    </LangProvider>
  );
}
