import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Browse from './pages/Browse';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import MyListings from './pages/MyListings';
import Cart from './pages/Cart';
import Purchases from './pages/Purchases';
import Dashboard from './pages/Dashboard';

// Initialize sample data
const initializeSampleData = () => {
  const existingUsers = localStorage.getItem('ecofinds_users');
  if (!existingUsers) {
    const sampleUsers = [
      {
        id: 'demo_user',
        email: 'admin@ecofinds.com',
        username: 'admin',
        fullName: 'EcoFinds Admin',
        phone: '+1 (555) 123-4567',
        address: '123 Green Street, EcoCity, EC 12345',
        bio: 'Passionate about sustainable living and helping others find great second-hand treasures!',
        joinedDate: new Date('2024-01-01').toISOString(),
      }
    ];
    localStorage.setItem('ecofinds_users', JSON.stringify(sampleUsers));
  }
};

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to="/" replace /> : <Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Browse />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="edit-product/:id" element={<EditProduct />} />
          <Route path="my-listings" element={<MyListings />} />
          <Route path="cart" element={<Cart />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  useEffect(() => {
    initializeSampleData();
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;