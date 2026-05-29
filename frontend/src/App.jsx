import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CSBotWidget } from './components/CSBotWidget';
import { CSBotProvider } from './context/CSBotContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { useSiteConfig } from './context/SiteConfigContext';
import { Home } from './Pages/Home';
import { WeaponDetail } from './Pages/WeaponDetail';
import { Auth } from './Pages/Auth';
import { Profile } from './Pages/Profile';
import { Subscriptions } from './Pages/Subscriptions';
import { SubscriptionDetail } from './Pages/SubscriptionDetail';
import { Admin } from './Pages/Admin';
import { VisitTracker } from './components/VisitTracker';
import './styles/layout.css';
import './styles/mobile.css';

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function SubscriptionsGate({ children }) {
  const { settings } = useSiteConfig();
  const hideSubsPublic = Boolean(settings?.hide_subscriptions_public);
  const user = getStoredUser();
  const isAdmin = Boolean(user?.is_admin);

  if (hideSubsPublic && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <VisitTracker />
      <CSBotProvider>
        <SiteConfigProvider>
          <div className="app-shell">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/arma/:id" element={<WeaponDetail />} />
                <Route path="/cuenta" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="/suscripciones"
                  element={
                    <SubscriptionsGate>
                      <Subscriptions />
                    </SubscriptionsGate>
                  }
                />
                <Route
                  path="/suscripciones/:slug"
                  element={
                    <SubscriptionsGate>
                      <SubscriptionDetail />
                    </SubscriptionsGate>
                  }
                />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
            <Footer />
            <CSBotWidget />
          </div>
        </SiteConfigProvider>
      </CSBotProvider>
    </BrowserRouter>
  );
}

export default App;
