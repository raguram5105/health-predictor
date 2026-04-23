import React, { useState } from 'react';
import './App.css';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Survey from './components/Survey';
import Prediction from './components/Prediction';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  const handleLogin = (data) => {
    setUserData(data);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData(null);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'survey':
        return <Survey />;
      case 'prediction':
        return <Prediction />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
      />
      <main className="main-content" style={{ marginLeft: '280px' }}>
        <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>Welcome back, {userData?.name || 'User'}</h1>
            <p style={{ color: '#475569' }}>Here is your continuous health overview.</p>
          </div>
        </header>

        {renderView()}
      </main>
    </div>
  );
}

export default App;
