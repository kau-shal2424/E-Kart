import React, { useEffect, useState } from 'react';
import axios from 'axios';

function StatCard({ title, value, sub }) {
  return (
    <div className="card p-5">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-extrabold mt-1 bg-clip-text text-transparent"
           style={{backgroundImage:'linear-gradient(135deg,#3B82F6 0%, #7C3AED 100%)'}}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('analytics'); // analytics | products | transactions | sales
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Analytics state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Products state
  const [products, setProducts] = useState([]);
  const [prodPage, setProdPage] = useState(1);
  const [prodTotal, setProdTotal] = useState(0);
  const [editedInv, setEditedInv] = useState({});

  // Transactions state
  const [txPage, setTxPage] = useState(1);
  const [txPageSize] = useState(20);
  const [txTotal, setTxTotal] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [txFrom, setTxFrom] = useState('');
  const [txTo, setTxTo] = useState('');
  const [loadingTx, setLoadingTx] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [txDetail, setTxDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Users lists
  const [usersActive, setUsersActive] = useState([]);
  const [usersInactive, setUsersInactive] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const [a, i] = await Promise.all([
        axios.get('/api/admin/users', { params: { active: true } }),
        axios.get('/api/admin/users', { params: { active: false } })
      ]);
      setUsersActive(a.data.items || []);
      setUsersInactive(i.data.items || []);
    } catch (e) {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/metrics');
      setMetrics(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load admin metrics. Ensure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const loadTxDetail = async (order_id) => {
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/api/admin/transactions/${order_id}`);
      setTxDetail(res.data);
    } catch (e) {
      setTxDetail({ error: 'Failed to load order detail.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const params = {};
      if (fromDate) params.from = fromDate + 'T00:00:00';
      if (toDate) params.to = toDate + 'T23:59:59';
      const res = await axios.get('/api/admin/analytics', { params });
      setAnalytics(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await axios.get('/api/products', { params: { page: prodPage, page_size: 12, sort: 'popularity' } });
      setProducts(res.data.items || []);
      setProdTotal(res.data.total || 0);
      setEditedInv({});
    } catch {}
  };

  // Add product form state
  const [newProd, setNewProd] = useState({ name: '', description: '', price: '', inventory: '' });
  const [creating, setCreating] = useState(false);
  const createProduct = async () => {
    if (!newProd.name || newProd.price === '' || newProd.inventory === '') {
      alert('Please fill name, price and inventory');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        name: newProd.name,
        description: newProd.description,
        price: parseFloat(newProd.price),
        inventory: parseInt(newProd.inventory, 10),
      };
      await axios.post('/api/admin/products', payload);
      setNewProd({ name: '', description: '', price: '', inventory: '' });
      await loadProducts();
      alert('Product added');
    } catch (e) {
      alert(e?.response?.data?.msg || 'Failed to add product');
    } finally {
      setCreating(false);
    }
  };

  const saveInventory = async (product_id) => {
    const value = editedInv[product_id];
    if (value === undefined || value === null || value === '') return;
    const inv = parseInt(value, 10);
    if (Number.isNaN(inv) || inv < 0) {
      alert('Enter a valid non-negative inventory value');
      return;
    }
    try {
      await axios.patch(`/api/admin/products/${product_id}/inventory`, { inventory: inv });
      await loadProducts();
    } catch (e) {
      alert('Failed to update inventory');
    }
  };

  const loadTransactions = async () => {
    setLoadingTx(true);
    try {
      const params = { page: txPage, page_size: txPageSize };
      if (txFrom) params.from = txFrom + 'T00:00:00';
      if (txTo) params.to = txTo + 'T23:59:59';
      const res = await axios.get('/api/admin/transactions', { params });
      setTransactions(res.data.items || []);
      setTxTotal(res.data.total || 0);
    } catch {}
    setLoadingTx(false);
  };

  useEffect(() => { loadMetrics(); }, []);
  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { loadAnalytics(); }, [fromDate, toDate]);
  useEffect(() => { if (tab === 'products') loadProducts(); }, [tab, prodPage]);
  useEffect(() => { if (tab === 'transactions') loadTransactions(); }, [tab, txPage, txFrom, txTo]);

  if (loading) return <div className="container mx-auto p-6">Loading...</div>;
  if (error) return <div className="container mx-auto p-6 text-red-600">{error}</div>;
  if (!metrics) return null;

  const { users, orders, top_products } = metrics;
  const prodTotalPages = Math.max(1, Math.ceil(prodTotal / 12));
  const txTotalPages = Math.max(1, Math.ceil(txTotal / txPageSize));

  return (
    <div className="container mx-auto p-6">
      <h1
        className="text-3xl font-extrabold mb-4 bg-clip-text text-transparent"
        style={{backgroundImage:'linear-gradient(135deg,#3B82F6 0%, #7C3AED 100%)'}}
      >
        Admin Dashboard
      </h1>

      <div className="flex gap-2 mb-6">
        <button className={`px-3 py-2 rounded ${tab === 'analytics' ? 'btn-primary text-white' : 'btn-outline'}`} onClick={() => setTab('analytics')}>Analytics</button>
        <button className={`px-3 py-2 rounded ${tab === 'products' ? 'btn-primary text-white' : 'btn-outline'}`} onClick={() => setTab('products')}>Products</button>
        <button className={`px-3 py-2 rounded ${tab === 'transactions' ? 'btn-primary text-white' : 'btn-outline'}`} onClick={() => setTab('transactions')}>Transactions</button>
        <button className={`px-3 py-2 rounded ${tab === 'sales' ? 'btn-primary text-white' : 'btn-outline'}`} onClick={() => setTab('sales')}>Sales</button>
      </div>

      {/* Summary cards always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={users.total} sub={`Active ${users.active} • Inactive ${users.inactive}`} />
        <StatCard title="Total Orders" value={orders.total} />
        <StatCard title="Revenue (₹)" value={orders.revenue_total.toFixed(2)} />
        <StatCard title="Pending Orders" value={orders.by_status.pending || 0} />
      </div>

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Active Users</h3>
              <span className="text-sm text-gray-500">{usersActive.length}</span>
            </div>
            {loadingUsers ? (
              <p>Loading...</p>
            ) : usersActive.length === 0 ? (
              <p className="text-sm text-gray-500">No active users.</p>
            ) : (
              <ul className="divide-y">
                {usersActive.map(u => (
                  <li key={u.user_id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{u.username}</div>
                      <div className="text-xs text-gray-500">#{u.user_id} • {u.role}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Active</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Inactive Users</h3>
              <span className="text-sm text-gray-500">{usersInactive.length}</span>
            </div>
            {loadingUsers ? (
              <p>Loading...</p>
            ) : usersInactive.length === 0 ? (
              <p className="text-sm text-gray-500">No inactive users.</p>
            ) : (
              <ul className="divide-y">
                {usersInactive.map(u => (
                  <li key={u.user_id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{u.username}</div>
                      <div className="text-xs text-gray-500">#{u.user_id} • {u.role}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">Inactive</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <></>
      )}

      {tab === 'sales' && (
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div>
              <div className="text-xs text-gray-600">From</div>
              <input className="border rounded p-2" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-600">To</div>
              <input className="border rounded p-2" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="self-end">
              <button className="px-3 py-2 btn-primary rounded" onClick={loadAnalytics}>Refresh</button>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-3">Total Sales (All time)</h2>
          <div className="text-4xl font-extrabold bg-clip-text text-transparent mb-4" style={{backgroundImage:'linear-gradient(135deg,#3B82F6 0%, #7C3AED 100%)'}}>
            ₹{orders.revenue_total.toFixed(2)}
          </div>
          {loadingAnalytics ? (
            <p>Loading breakdown...</p>
          ) : analytics ? (
            <div>
              <h3 className="font-semibold mb-2">Monthly Breakdown</h3>
              <ul className="divide-y">
                {analytics.monthly.map((m) => {
                  const label = (() => {
                    const s = String(m.month || '').trim();
                    const match = s.match(/^(\d{4})-(\d{2})$/);
                    if (match) {
                      const yyyy = match[1];
                      const mm = match[2];
                      const dd = '01';
                      return `${dd}-${mm}-${yyyy}`;
                    }
                    return s || '-';
                  })();
                  return (
                    <li key={m.month} className="py-2 flex justify-between text-sm">
                      <span>{label}</span>
                      <span>₹{m.sales.toFixed(2)}</span>
                    </li>
                  );
                })}
              </ul>

              <h3 className="font-semibold mt-6 mb-2">Daily Breakdown</h3>
              <ul className="divide-y">
                {(analytics.daily || []).map((d) => {
                  const s = String(d.date || '').trim();
                  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                  const label = match ? `${match[3]}-${match[2]}-${match[1]}` : (s || '-');
                  return (
                    <li key={s} className="py-2 flex justify-between text-sm">
                      <span>{label}</span>
                      <span>₹{d.sales.toFixed(2)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p>No sales data.</p>
          )}
        </div>
      )}

      {selectedTx && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
          <div className="card w-full max-w-3xl p-6 relative">
            <button className="absolute right-3 top-3 text-gray-600" onClick={() => { setSelectedTx(null); setTxDetail(null); }}>✕</button>
            <h2 className="text-xl font-semibold mb-3">Order #{selectedTx} Details</h2>
            {loadingDetail ? (
              <p>Loading...</p>
            ) : txDetail?.error ? (
              <p className="text-red-600">{txDetail.error}</p>
            ) : txDetail ? (
              <div>
                <div className="mb-3 text-sm text-gray-700">
                  <div><span className="font-medium">User:</span> {txDetail.user?.username || `User ${txDetail.user?.user_id}`}</div>
                  <div><span className="font-medium">Status:</span> <span className="capitalize">{txDetail.status}</span></div>
                  <div><span className="font-medium">Created:</span> {new Date(txDetail.created_at).toLocaleString()}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4">Product</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Unit Price</th>
                        <th className="py-2 pr-4">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txDetail.lines.map((ln, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2 pr-4">{ln.product_name} (#{ln.product_id})</td>
                          <td className="py-2 pr-4">{ln.quantity}</td>
                          <td className="py-2 pr-4">₹{Number(ln.unit_price).toFixed(2)}</td>
                          <td className="py-2 pr-4">₹{Number(ln.line_total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right font-semibold">Subtotal: ₹{Number(txDetail.subtotal).toFixed(2)}</div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="card p-5">
          <h2 className="text-xl font-semibold mb-3">Products</h2>
          <div className="mb-5">
            <h3 className="font-semibold mb-2">Add Product</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="p-2 border rounded" placeholder="Name" value={newProd.name} onChange={(e)=>setNewProd(p=>({...p,name:e.target.value}))} />
              <input className="p-2 border rounded" placeholder="Price" type="number" step="0.01" value={newProd.price} onChange={(e)=>setNewProd(p=>({...p,price:e.target.value}))} />
              <input className="p-2 border rounded" placeholder="Inventory" type="number" min="0" value={newProd.inventory} onChange={(e)=>setNewProd(p=>({...p,inventory:e.target.value}))} />
              <textarea className="p-2 border rounded sm:col-span-2" rows="2" placeholder="Description" value={newProd.description} onChange={(e)=>setNewProd(p=>({...p,description:e.target.value}))} />
            </div>
            <div className="mt-3">
              <button className={`px-3 py-2 rounded ${creating? 'bg-gray-200 text-gray-500' : 'btn-primary text-white'}`} disabled={creating} onClick={createProduct}>
                {creating? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
          {products.length === 0 ? (
            <p className="text-sm text-gray-500">No products.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-slate-50">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">Inventory</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(p => (
                    <tr key={p.product_id} className="hover:bg-slate-50">
                      <td className="py-2 pr-4">{p.product_id}</td>
                      <td className="py-2 pr-4">{p.name}</td>
                      <td className="py-2 pr-4">₹{parseFloat(p.price).toFixed(2)}</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          {p.inventory === 0 && (
                            <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Sold Out</span>
                          )}
                          <input
                            type="number"
                            min="0"
                            className="w-24 p-1 border rounded"
                            value={editedInv[p.product_id] !== undefined ? editedInv[p.product_id] : p.inventory}
                            onChange={(e) => setEditedInv(prev => ({ ...prev, [p.product_id]: e.target.value }))}
                          />
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <button
                          className="px-2 py-1 btn-primary rounded"
                          onClick={() => saveInventory(p.product_id)}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={prodPage <= 1} onClick={() => setProdPage(p => Math.max(1, p-1))}>Prev</button>
            <span>Page {prodPage} of {prodTotalPages}</span>
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={prodPage >= prodTotalPages} onClick={() => setProdPage(p => Math.min(prodTotalPages, p+1))}>Next</button>
          </div>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div>
              <div className="text-xs text-gray-600">From</div>
              <input className="border rounded p-2" type="date" value={txFrom} onChange={(e) => setTxFrom(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-600">To</div>
              <input className="border rounded p-2" type="date" value={txTo} onChange={(e) => setTxTo(e.target.value)} />
            </div>
            <div className="self-end">
              <button className="px-3 py-2 btn-primary rounded" onClick={loadTransactions}>Refresh</button>
            </div>
          </div>
          {loadingTx ? (
            <p>Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-slate-50">
                    <th className="py-2 pr-4">Order</th>
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map(t => (
                    <tr key={t.order_id} className="hover:bg-slate-50">
                      <td className="py-2 pr-4">#{t.order_id}</td>
                      <td className="py-2 pr-4">{t.username || `User ${t.user_id}`}</td>
                      <td className="py-2 pr-4 capitalize">{t.status}</td>
                      <td className="py-2 pr-4">₹{t.total.toFixed(2)}</td>
                      <td className="py-2 pr-4">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => { setSelectedTx(t.order_id); setTxDetail(null); loadTxDetail(t.order_id); }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={txPage <= 1} onClick={() => setTxPage(p => Math.max(1, p-1))}>Prev</button>
            <span>Page {txPage} of {txTotalPages}</span>
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={txPage >= txTotalPages} onClick={() => setTxPage(p => Math.min(txTotalPages, p+1))}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
