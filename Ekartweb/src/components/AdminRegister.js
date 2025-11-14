import React, { useState } from 'react';
import axios from 'axios';

export default function AdminRegister() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/admin/register', { username, password });
      setSuccess('Admin account created successfully. Redirecting to admin login...');
      setTimeout(() => { window.location.hash = '#/admin-login'; }, 1200);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Admin Registration</h2>
      <form onSubmit={handleRegister} className="space-y-3">
        <input
          type="text"
          placeholder="Username"
          className="w-full border rounded px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full border rounded px-3 py-2"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-700 text-sm whitespace-pre-wrap">{success}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="text-center mt-4">
        Already have an admin account?{' '}
        <a className="text-blue-600 underline" href="#/admin-login">Go to admin login</a>
      </p>
    </div>
  );
}
