import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CSBotWidget } from './components/CSBotWidget';
import { CSBotProvider } from './context/CSBotContext';
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

function App() {
  return (
    <BrowserRouter>
      <VisitTracker />
      <CSBotProvider>
        <div className="app-shell">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/arma/:id" element={<WeaponDetail />} />
              <Route path="/cuenta" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/suscripciones" element={<Subscriptions />} />
              <Route path="/suscripciones/:slug" element={<SubscriptionDetail />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
          <CSBotWidget />
        </div>
      </CSBotProvider>
    </BrowserRouter>
  );
}

export default App;
