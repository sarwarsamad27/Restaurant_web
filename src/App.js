import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';

// Pages
import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import RecommendedMeals from './pages/RecommendedMeals';
import OrderChatBot from './pages/OrderChatBot';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import MyOrders from './pages/MyOrders';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminRestaurants from './pages/Admin/Restaurants/index';
import AdminOrders from './pages/Admin/Orders';
import AdminUsers from './pages/Admin/Users';
import AdminDietMenu from './pages/Admin/AdminDietMenu';
import AdminRestaurantRatings from './pages/Admin/AdminRestaurantRatings';

// Driver Pages
import DriverDashboard from './pages/Driver/Dashboard';
import DriverDeliveries from './pages/Driver/Deliveries';

// Restaurant Owner Pages
import OwnerDashboard from './pages/Owner/Dashboard';
import OwnerOrders from './pages/Owner/Orders';
import OwnerMenu from './pages/Owner/Menu';

// POS Pages
import POSSystem from './pages/POS/POSSystem';

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 200px)' }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                <Route
                  path="/ai-meal-recommendation"
                  element={(
                    <ProtectedRoute>
                      <RecommendedMeals />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/ai-order"
                  element={(
                    <ProtectedRoute>
                      <OrderChatBot />
                    </ProtectedRoute>
                  )}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Customer Routes */}
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="/orders/:id/track" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/restaurants/*" element={
                  <ProtectedRoute role="admin">
                    <AdminRestaurants />
                  </ProtectedRoute>
                } />
                <Route path="/admin/orders" element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/diet-menu" element={<ProtectedRoute role="admin"><AdminDietMenu /></ProtectedRoute>} />
                <Route
                  path="/admin/restaurant-ratings"
                  element={<ProtectedRoute role="admin"><AdminRestaurantRatings /></ProtectedRoute>}
                />

                {/* Driver Routes */}
                <Route path="/driver/dashboard" element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>} />
                <Route path="/driver/deliveries" element={<ProtectedRoute role="driver"><DriverDeliveries /></ProtectedRoute>} />

                {/* Restaurant Owner Routes */}
                <Route path="/owner/dashboard" element={<ProtectedRoute role="restaurant_owner"><OwnerDashboard /></ProtectedRoute>} />
                <Route path="/owner/orders" element={<ProtectedRoute role="restaurant_owner"><OwnerOrders /></ProtectedRoute>} />
                <Route path="/owner/menu" element={<ProtectedRoute role="restaurant_owner"><OwnerMenu /></ProtectedRoute>} />

                {/* POS Routes */}
                <Route path="/pos" element={<ProtectedRoute role="staff"><POSSystem /></ProtectedRoute>} />
              </Routes>
            </main>
            <Footer />
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
