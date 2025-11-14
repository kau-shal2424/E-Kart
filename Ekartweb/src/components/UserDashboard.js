import React, { useEffect, useState } from 'react';
import ProductList from './ProductList';
import Orders from './Orders';
import Cart from './Cart';
import RateProducts from './RateProducts';

export default function UserDashboard({ cartItems, addToCart, proceedToCheckout, updateCartQuantity, removeFromCart, activeTab }) {
  const [tab, setTab] = useState('products');

  useEffect(() => {
    if (activeTab && ['products', 'orders', 'cart'].includes(activeTab)) {
      setTab(activeTab);
    }
  }, [activeTab]);

  const tabs = [
    { key: 'products', label: 'Products' },
    { key: 'orders', label: 'Orders' },
    { key: 'cart', label: 'Cart' },
    { key: 'rate', label: 'Rate' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`px-3 py-2 rounded ${tab === t.key ? 'btn-primary text-white' : 'btn-outline'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <ProductList addToCart={addToCart} cartItems={cartItems} updateCartQuantity={updateCartQuantity} />
      )}

      {tab === 'orders' && (
        <Orders />
      )}

      {tab === 'cart' && (
        <Cart
          cartItems={cartItems}
          proceedToCheckout={proceedToCheckout}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
        />
      )}

      {tab === 'rate' && (
        <RateProducts />
      )}
    </div>
  );
}
