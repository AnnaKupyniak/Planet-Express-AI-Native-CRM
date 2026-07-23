import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import type { Delivery } from './components/Dashboard';
import { DeliveryDetails } from './components/DeliveryDetails';
import { AIChat } from './components/AIChat';
import { Auth } from './components/Auth';
import { Planets } from './components/Planets';
import { Crew } from './components/Crew';
import { Clients } from './components/Clients';

// Setup axios defaults for authentication
export const api = axios.create({
  baseURL: '/api'
});


export type DangerFilterState = {
  low: boolean;
  medium: boolean;
  fatal: boolean;
};

export const App: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Deliveries');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Filters state
  const [filters, setFilters] = useState<DangerFilterState>({
    low: true,
    medium: true,
    fatal: true
  });

  const fetchDeliveries = useCallback(async () => {
    try {
      const devRes = await api.get('/deliveries');
      setDeliveries(devRes.data.data || devRes.data);
    } catch (err: any) {
      console.error('Failed to fetch deliveries:', err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  }, []);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchDeliveries().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, fetchDeliveries]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-green)' }}>
        <h2>INITIALIZING NEURAL LINK...</h2>
      </div>
    );
  }

  if (!token) {
    return <Auth onSuccess={handleLogin} />;
  }

  // Filter deliveries before passing them to Dashboard
  const filteredDeliveries = deliveries.filter(dev => {
    const danger = (dev.planet?.danger_level || 'low').toLowerCase();
    if (danger === 'low' && filters.low) return true;
    if ((danger === 'medium' || danger === 'high' || danger === 'yellow') && filters.medium) return true;
    if (danger === 'fatal' && filters.fatal) return true;
    return false;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'Planets': return <Planets />;
      case 'Crew': return <Crew />;
      case 'Clients': return <Clients />;
      case 'Deliveries':
      default:
        if (selectedDeliveryId) {
          return <DeliveryDetails deliveryId={selectedDeliveryId} onBack={() => setSelectedDeliveryId(null)} />;
        }
        return <Dashboard deliveries={filteredDeliveries} refetch={fetchDeliveries} onSelectDelivery={setSelectedDeliveryId} />;
    }
  };

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const user = token ? decodeToken(token) : null;

  return (
    <div className="dashboard-container">
      <Sidebar 
        filters={filters} 
        setFilters={setFilters} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
      />
      {renderContent()}
      <AIChat />
    </div>
  );
};

export default App;
