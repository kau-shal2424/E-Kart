import React, { useState } from 'react';
import axios from 'axios';

export default function UserRegistration({ onRegisterSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSuccess(null);
      return;
    }

    try {
      const response = await axios.post('/api/register', { username, password });
      setSuccess(response.data.msg || "Registration successful! Please log in.");
      setError(null);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      
      onRegisterSuccess();
    } catch (err) {
      const msg = err.response?.data?.msg || 'Registration failed.';
      setError(msg);
      setSuccess(null);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-2xl font-bold mb-6">User Registration</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full mb-4 p-2 border rounded"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          autoComplete="username"
        />
        <input
          className="w-full mb-4 p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <input
          className="w-full mb-6 p-2 border rounded"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <button
          type="submit"
          className="w-full btn-primary py-3 rounded"
        >
          Register
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Changed your mind?{' '}
        <a href="#/home" className="text-blue-600 underline">Back to home</a>
      </p>
    </div>
  );
}
