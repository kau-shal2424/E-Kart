import React, { useState } from 'react';
import axios from 'axios';

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return {};
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/login', { username, password });
      const token = res.data.access_token;
      if (!token) throw new Error('Missing token');
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const payload = decodeToken(token);
      if (payload.role !== 'admin') {
        // Not an admin – block access
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
        setError('This account is not an admin.');
        setLoading(false);
        return;
      }
      onLogin({ username });
    } catch (err) {
      setError(err?.response?.data?.msg || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card p-6 mt-8">
      <h2
        className="text-3xl font-extrabold mb-2 text-center bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(135deg,#3B82F6 0%, #7C3AED 100%)' }}
      >
        Admin Login
      </h2>
      <p className="text-center text-gray-600 mb-4">Manage products, orders, and analytics</p>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="text"
          placeholder="Admin username"
          className="w-full border rounded px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded px-3 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 rounded disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Want to see the overview page again?{' '}
        <a href="#/home" className="text-blue-600 underline">Back to home</a>
      </p>
    </div>
  );
}
