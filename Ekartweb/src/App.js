import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import UserLogin from './components/UserLogin';
import UserRegistration from './components/UserRegistration';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Orders from './components/Orders';
import Drawer from './components/Drawer';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import AdminRegister from './components/AdminRegister';
import UserDashboard from './components/UserDashboard';
import Home from './components/Home';

function App() {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showRegistration, setShowRegistration] = useState(false); 
  const [showOrders, setShowOrders] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false); 
  const [authRoute, setAuthRoute] = useState(() => {
    const h = window.location.hash.replace('#', '').toLowerCase();
    if (h === '' || h === '/' || h === '/home') return 'home';
    if (h === '/admin-login') return 'admin-login';
    if (h === '/admin-register') return 'admin-register';
    if (h === '/register') return 'register';
    return 'login';
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const payload = decodeToken(token);
      setUser({ username: payload.username || 'User', role: payload.role || 'customer' });
      if ((payload.role || 'customer') === 'admin') {
        setShowAdmin(true);
        setShowOrders(false);
      }
      fetchCart();
    }
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (localCart.length > 0) {
      setCartItems(localCart);
    }
    const onHash = () => {
      const h = window.location.hash.replace('#', '').toLowerCase();
      if (h === '' || h === '/' || h === '/home') setAuthRoute('home');
      else if (h === '/admin-login') setAuthRoute('admin-login');
      else if (h === '/admin-register') setAuthRoute('admin-register');
      else if (h === '/register') setAuthRoute('register');
      else setAuthRoute('login');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return {};
    }
  };

  const onLogin = (userData) => {
    const token = localStorage.getItem('token');
    const payload = token ? decodeToken(token) : {};
    setUser({ username: userData.username, role: payload.role || 'customer' });
    if ((payload.role || 'customer') === 'admin') {
      setShowAdmin(true);
      setShowOrders(false);
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
    fetchCart();
  };

  const fetchCart = async () => {
    try {
      const res = await axios.get('/api/cart');
      setCartItems(res.data);
      localStorage.setItem('cart', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  };

  const addToCart = async (product) => {
    console.log('Adding product to cart:', product.product_id);
    try {
      await axios.post('/api/cart', { product_id: product.product_id, quantity: 1 });
      console.log('Add to cart success');
      fetchCart();
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert('Failed to add product to cart. See console for details.');
    }
  };

  const updateCartQuantity = async (product_id, quantity) => {
    try {
      await axios.put('/api/cart', { product_id, quantity });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update cart', err);
    }
  };

  const removeFromCart = async (product_id) => {
    try {
      await axios.delete(`/api/cart/${product_id}`);
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  const proceedToCheckout = async () => {
    try {
     
      await fetchCart();
      if (!cartItems || cartItems.length === 0) {
        alert('Your cart is empty.');
        return;
      }
      await axios.post('/api/orders');
      alert('Checkout successful! Thank you for your order.');
      setCartItems([]);
      localStorage.setItem('cart', JSON.stringify([]));
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.message || 'Checkout failed.';
      alert(msg);
      console.error('Checkout error', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setCartItems([]);
    localStorage.setItem('cart', JSON.stringify([]));
    setShowOrders(false);
    setShowAdmin(false);
  };

  const deactivateAccount = async () => {
    if (!window.confirm('Deactivate your account? You will not be able to log in again.')) return;
    try {
      await axios.post('/api/account/deactivate');
      alert('Account deactivated. You will be logged out.');
      logout();
    } catch (err) {
      alert('Failed to deactivate account.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow">
        <h1 className="text-3xl font-bold">E-Kart</h1>
        {user && (
          <div className="flex items-center gap-3">
            {user.role !== 'admin' && (() => {
              const isHome = authRoute === 'home';
              return (
                <>
                  <button
                    className={`px-3 py-2 rounded ${isHome ? 'btn-primary text-white' : 'btn-outline text-white'} border-white/30`}
                    onClick={() => { window.location.hash = '#/home'; }}
                  >
                    Home
                  </button>
                  <button
                    className={`px-3 py-2 rounded ${!isHome && !showOrders ? 'btn-primary text-white' : 'btn-outline text-white'} border-white/30`}
                    onClick={() => {
                      setShowOrders(false);
                      window.location.hash = '#/login';
                    }}
                  >
                    Shop
                  </button>
                  <button
                    className={`px-3 py-2 rounded ${!isHome && showOrders ? 'btn-primary text-white' : 'btn-outline text-white'} border-white/30`}
                    onClick={() => {
                      setShowOrders(true);
                      window.location.hash = '#/login';
                    }}
                  >
                    Orders
                  </button>
                </>
              );
            })()}
            {}
            <span className="hidden sm:inline">Welcome, {user.username}!</span>
            {user.role !== 'admin' && (
              <button
                className="relative px-3 py-2 rounded bg-white/90 text-blue-700 hover:bg-white"
                onClick={() => setIsCartOpen(true)}
              >
                Cart
                {cartItems.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold bg-blue-600 text-white rounded-full px-2 py-0.5">
                    {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                )}
              </button>
            )}
            <button
              className="bg-gray-200 text-gray-800 py-1 px-3 rounded hover:bg-gray-300"
              onClick={deactivateAccount}
            >
              Deactivate
            </button>
            <button
              className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="mt-6">
  {!user ? (
    authRoute === 'home' ? (
      <Home
        onGetStarted={() => { window.location.hash = '#/login'; }}
        onAdminClick={() => { window.location.hash = '#/admin-login'; }}
      />
    ) : authRoute === 'admin-login' ? (
      <>
        <AdminLogin onLogin={onLogin} />
        <p className="text-center mt-4">
          Not an admin?{' '}
          <a className="text-blue-600 underline" href="#/login">Go to user login</a>
        </p>
        <p className="text-center mt-2">
          Need an admin account?{' '}
          <a className="text-blue-600 underline" href="#/admin-register">Register admin</a>
        </p>
      </>
    ) : authRoute === 'admin-register' ? (
      <>
        <AdminRegister />
      </>
    ) : authRoute === 'register' ? (
      <>
        <UserRegistration onRegisterSuccess={() => (window.location.hash = '#/login')} />
        <p className="text-center mt-4">
          Already have an account?{' '}
          <a className="text-blue-600 underline" href="#/login">Log in</a>
        </p>
      </>
    ) : (
      <>
        <UserLogin onLogin={onLogin} />
        <p className="text-center mt-4">
          New user?{' '}
          <a className="text-blue-600 underline" href="#/register">Register here</a>
        </p>
        <p className="text-center mt-2">
          Admin?{' '}
          <a className="text-blue-600 underline" href="#/admin-login">Go to admin login</a>
        </p>
      </>
    )
  ) : (
    <>
      {user && user.role !== 'admin' && authRoute === 'home' ? (
        <Home
          isLoggedInUser
          username={user.username}
          onGetStarted={() => {
            setShowOrders(false);
            window.location.hash = '#/login';
          }}
          onAdminClick={() => {}}
          onViewOrders={() => {
            setShowOrders(true);
            window.location.hash = '#/login';
          }}
          onOpenCart={() => {
            setIsCartOpen(true);
          }}
        />
      ) : showAdmin ? (
        <AdminDashboard />
      ) : (
        <UserDashboard
          cartItems={cartItems}
          addToCart={addToCart}
          proceedToCheckout={proceedToCheckout}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          activeTab={showOrders ? 'orders' : 'products'}
        />
      )}
    </>
  )}
</main>

      {user && user.role !== 'admin' && (
        <Drawer open={isCartOpen} onClose={() => setIsCartOpen(false)} title="Your Cart">
          <Cart
            cartItems={cartItems}
            proceedToCheckout={async () => { await proceedToCheckout(); setIsCartOpen(false); }}
            updateCartQuantity={updateCartQuantity}
            removeFromCart={removeFromCart}
          />
        </Drawer>
      )}

    </div>
  );
}

export default App;
