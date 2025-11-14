import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ProductDetail({ productId, onClose, onAdd }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/products/${productId}`);
        setProduct(res.data);
        setError(null);
      } catch (err) {
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [productId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded shadow-lg p-6 relative">
        <button className="absolute right-3 top-3 text-gray-600" onClick={onClose}>✕</button>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : product ? (
          <div>
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-full h-56 object-cover rounded mb-4" />
            )}
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
            <p className="text-gray-700 mb-4">{product.description}</p>
            <p className="text-green-700 font-semibold mb-6">₹{parseFloat(product.price).toFixed(2)}</p>
            <div className="flex items-center gap-3">
              <button
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                onClick={() => onAdd(product)}
              >
                Add to Cart
              </button>
              <span className="text-sm text-gray-600">In stock: {product.inventory}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
