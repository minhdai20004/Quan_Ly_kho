import { useState } from 'react';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Dashboard from './views/Dashboard';
import Materials from './views/Materials';
import Warehouses from './views/Warehouses';
import Partners from './views/Partners';
import InboundReceipts from './views/InboundReceipts';
import OutboundIssues from './views/OutboundIssues';
import Inventory from './views/Inventory';
import Reports from './views/Reports';
import Users from './views/Users';
import Login from './views/Login';
import Register from './views/Register';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('user'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (userData) => {
    const token = userData.token;
    const loggedUser = userData.user || { username: userData.username, role: userData.role };
    setUser({ ...loggedUser, token });
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify({ ...loggedUser, token }));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('user');
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <Dashboard user={user} />;
      case 'materials':    return <Materials user={user} />;
      case 'warehouses':   return <Warehouses user={user} />;
      case 'partners':     return <Partners user={user} />;
      case 'inbound':      return <InboundReceipts user={user} />;
      case 'outbound':     return <OutboundIssues user={user} />;
      case 'inventory':    return <Inventory user={user} />;
      case 'reports':      return <Reports user={user} />;
      case 'users':        return <Users user={user} />;
      case 'register':     return <Register onRegister={() => setActiveTab('dashboard')} />;
      default:             return <Dashboard user={user} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="bottom-right" richColors closeButton />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      {/* Toaster đặt ở đây — hiển thị toast notification toàn app */}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        duration={3000}
        toastOptions={{
          style: {
            fontFamily: 'Outfit, sans-serif',
            fontSize: 14,
          },
        }}
      />
      <div className="app">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          user={user}
        />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

export default App;