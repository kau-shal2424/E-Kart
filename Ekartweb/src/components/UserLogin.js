import React, { useState } from 'react';
import axios from 'axios';

export default function UserLogin({ onLogin }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/login', { username, password });
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      onLogin({ username });
      setError(null);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto card p-6 mt-8">
        <h2
          className="text-3xl font-extrabold mb-2 text-center bg-clip-text text-transparent"
          style={{backgroundImage:'linear-gradient(135deg,#3B82F6 0%, #7C3AED 100%)'}}
        >
          Welcome back
        </h2>
        <h3 className="text-xl font-semibold text-center mb-2">User Login</h3>
        <p className="text-center text-gray-600 mb-6">Sign in to continue shopping</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="w-full btn-primary py-3 rounded" type="submit">
            Login
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Just looking around?{' '}
          <a href="#/home" className="text-blue-600 underline">Back to home</a>
        </p>
    </div>
  );
}