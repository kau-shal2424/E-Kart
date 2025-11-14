import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Badge({ status }) {
  const color = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }[status] || 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{status}</span>;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailError, setDetailError] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data);
      if (res.data && res.data.length > 0) {
        // Auto-select most recent order so detail shows immediately
        setSelected(res.data[0]);
      } else {
        setSelected(null);
        setDetail(null);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (order_id) => {
    setDetail(null);
    setDetailError(null);
    try {
      const res = await axios.get(`/api/orders/${order_id}`);
      setDetail(res.data);
    } catch (err) {
      setDetail(null);
      const msg = err?.response?.data?.msg || err?.message || 'Failed to load order detail.';
      setDetailError(msg);
    }
  };

  const payNow = async (order_id) => {
    try {
      await axios.post(`/api/orders/${order_id}/pay`);
      await loadOrders();
      await loadDetail(order_id);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (selected) {
      loadDetail(selected.order_id);
    }
  }, [selected]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Your Orders</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-3">Order History</h2>
            {orders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              <ul className="divide-y">
                {orders.map(o => (
                  <li key={o.order_id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Order #{o.order_id}</div>
                      <div className="text-sm text-gray-600">{new Date(o.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={o.status} />
                      <div className="font-semibold">₹{o.total.toFixed(2)}</div>
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => setSelected(o)}
                      >
                        View
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-3">Order Detail</h2>
            {!selected ? (
              <p>Select an order to view details.</p>
            ) : !detail ? (
              <p>{detailError || 'Loading detail...'}</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">Order #{detail.order_id}</div>
                    <div className="text-sm text-gray-600">{new Date(detail.created_at).toLocaleString()}</div>
                  </div>
                  <Badge status={detail.status} />
                </div>
                <div className="divide-y">
                  {detail.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div>Product #{it.product_id}</div>
                      <div>Qty: {it.quantity}</div>
                      <div>₹{(it.price_at_purchase * it.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 font-semibold">Total: ₹{detail.total.toFixed(2)}</div>
                {detail.status === 'pending' && (
                  <button
                    className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    onClick={() => payNow(detail.order_id)}
                  >
                    Pay Now (Simulated)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
