import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Star({ filled, onClick, onMouseEnter, onMouseLeave }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`text-2xl ${filled ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
      aria-label={filled ? 'Filled star' : 'Empty star'}
    >
      ★
    </button>
  );
}

export default function RateProducts() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hover, setHover] = useState({}); // product_id -> hover rating (preview)
  const [selected, setSelected] = useState({}); // product_id -> selected rating
  const [pending, setPending] = useState(null); // product_id being submitted
  const pageSize = 8;

  const load = async () => {
    try {
      const res = await axios.get('/api/products', { params: { page, page_size: pageSize, sort: 'rating' } });
      setProducts(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      // ignore for now
    }
  };

  useEffect(() => { load(); }, [page]);

  const rate = async (product_id, rating) => {
    try {
      setPending(product_id);
      await axios.post(`/api/products/${product_id}/rate`, { rating });
      await load();
    } catch (e) {
      alert(e?.response?.data?.msg || 'Failed to submit rating');
    } finally {
      setPending(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Rate Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.product_id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-gray-500">Current rating: {Number(p.rating || 0).toFixed(1)}</div>
              </div>
              {p.image_url && (
                <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded" />
              )}
            </div>
            <div className="mt-3 flex items-center gap-1">
              {[1,2,3,4,5].map((r) => (
                <Star
                  key={r}
                  filled={((hover[p.product_id] ?? 0) || (selected[p.product_id] ?? 0)) >= r}
                  onMouseEnter={() => setHover((h) => ({ ...h, [p.product_id]: r }))}
                  onMouseLeave={() => setHover((h) => ({ ...h, [p.product_id]: 0 }))}
                  onClick={() => setSelected((s) => ({ ...s, [p.product_id]: r }))}
                />
              ))}
              <button
                disabled={pending === p.product_id || !(selected[p.product_id] > 0)}
                className={`ml-3 px-3 py-1 rounded ${pending === p.product_id || !(selected[p.product_id] > 0) ? 'bg-gray-200 text-gray-500' : 'btn-primary text-white'}`}
                onClick={() => {
                  const val = selected[p.product_id] || 0;
                  if (!val) return;
                  rate(p.product_id, val);
                }}
              >
                {pending === p.product_id ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p-1))}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))}>Next</button>
      </div>
    </div>
  );
}
