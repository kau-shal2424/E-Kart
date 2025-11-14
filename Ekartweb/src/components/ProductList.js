import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductDetail from './ProductDetail';
import RatingStars from './RatingStars';

export default function ProductList({ addToCart, cartItems = [], updateCartQuantity }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    // Initialize state from URL on first mount
    const params = new URLSearchParams(window.location.search);
    const q0 = params.get('q') || '';
    const c0 = params.get('category') || '';
    const s0 = params.get('sort') || '';
    const p0 = parseInt(params.get('page') || '1', 10);
    setQ(q0);
    setCategoryId(c0);
    setSort(s0);
    setPage(isNaN(p0) ? 1 : p0);

    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { page, page_size: pageSize };
        if (q) params.q = q;
        if (categoryId) params.category_id = categoryId;
        if (sort) params.sort = sort;
        const res = await axios.get('/api/products', { params });
        setProducts(res.data.items || []);
        setTotal(res.data.total || 0);
        setError(null);
      } catch (err) {
        setError('Failed to fetch products.');
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, pageSize, q, categoryId, sort]);

  // Sync to URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoryId) params.set('category', categoryId);
    if (sort) params.set('sort', sort);
    if (page && page !== 1) params.set('page', String(page));
    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [q, categoryId, sort, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container mx-auto p-6">
      <h1
        className="text-4xl font-extrabold mb-6 bg-clip-text text-transparent"
        style={{backgroundImage:'linear-gradient(135deg,#3B82F6 0%, #7C3AED 100%)'}}
      >
        Products
      </h1>

      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-6">
        <input
          type="text"
          className="w-full md:w-1/2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search products..."
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
        <select
          className="w-full md:w-1/4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={categoryId}
          onChange={(e) => { setPage(1); setCategoryId(e.target.value); }}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.category_id} value={c.category_id}>{c.name}</option>
          ))}
        </select>
        <select
          className="w-full md:w-1/4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={sort}
          onChange={(e) => { setPage(1); setSort(e.target.value); }}
        >
          <option value="">Sort By</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Rating</option>
          <option value="popularity">Popularity</option>
        </select>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.product_id} className="card p-4">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded mb-3 transform transition-transform duration-200 hover:scale-105" loading="lazy" />
              )}
              <h2
                className="text-xl font-semibold mb-2 cursor-pointer link-underline"
                onClick={() => setDetailId(product.product_id)}
              >
                {product.name}
              </h2>
              <div className="mb-2 flex items-center gap-2">
                {product.inventory === 0 ? (
                  <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">Sold Out</span>
                ) : (
                  <span className="text-xs text-gray-600">In stock: {product.inventory}</span>
                )}
              </div>
              <div className="flex items-center justify-between mb-2">
                <RatingStars rating={product.rating || 0} />
                {typeof product.popularity === 'number' && (
                  <span className="text-xs text-gray-500">🔥 {product.popularity}</span>
                )}
              </div>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-green-700 font-bold">₹{parseFloat(product.price).toFixed(2)}</p>
                {(() => {
                  const inCartQty = (cartItems.find(ci => ci.product_id === product.product_id)?.quantity) || 0;
                  if (product.inventory === 0) {
                    return (
                      <button className="py-2 px-4 rounded bg-gray-300 text-gray-600 cursor-not-allowed" disabled>
                        Sold Out
                      </button>
                    );
                  }
                  if (inCartQty > 0) {
                    return (
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="w-8 h-8 rounded-full border flex items-center justify-center"
                          aria-label={`Decrease ${product.name} quantity`}
                          onClick={() => updateCartQuantity(product.product_id, Math.max(0, inCartQty - 1))}
                        >
                          −
                        </button>
                        <input
                          className="w-14 p-1 border rounded text-center"
                          type="number"
                          min="0"
                          max={product.inventory}
                          value={inCartQty}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (Number.isNaN(v) || v < 0) return;
                            const capped = Math.min(product.inventory, v);
                            updateCartQuantity(product.product_id, capped);
                          }}
                          aria-label={`${product.name} quantity`}
                        />
                        <button
                          className="w-8 h-8 rounded-full border flex items-center justify-center"
                          aria-label={`Increase ${product.name} quantity`}
                          onClick={() => updateCartQuantity(product.product_id, Math.min(product.inventory, inCartQty + 1))}
                        >
                          +
                        </button>
                      </div>
                    );
                  }
                  return (
                    <button
                      className="py-2 px-4 rounded btn-primary"
                      onClick={() => addToCart(product)}
                    >
                      Add to Cart
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          className="px-3 py-1 rounded border disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          className="px-3 py-1 rounded border disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      {detailId && (
        <ProductDetail
          productId={detailId}
          onClose={() => setDetailId(null)}
          onAdd={(p) => addToCart(p)}
        />
      )}
    </div>
  );
}
