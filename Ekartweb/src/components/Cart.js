import React from 'react';

export default function Cart({ cartItems, proceedToCheckout, updateCartQuantity, removeFromCart }) {
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const onChangeQty = (product_id, value) => {
    const qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) return;
    updateCartQuantity(product_id, qty);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="space-y-3">
          {cartItems.map(item => (
            <div key={item.product_id} className="card p-4">
              <div className="space-y-2 md:grid md:grid-cols-12 md:items-center md:gap-3 md:space-y-0">
                <div className="md:col-span-6">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">₹{Number(item.price).toFixed(2)} each</div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-6">
                  <div className="inline-flex items-center gap-2">
                    <button
                      className="w-8 h-8 min-w-[2rem] min-h-[2rem] rounded-full border flex items-center justify-center"
                      aria-label={`Decrease ${item.name} quantity`}
                      onClick={() => updateCartQuantity(item.product_id, Math.max(0, item.quantity - 1))}
                    >
                      −
                    </button>
                    <input
                      className="w-14 p-1 border rounded text-center"
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => onChangeQty(item.product_id, e.target.value)}
                      aria-label={`${item.name} quantity`}
                    />
                    <button
                      className="w-8 h-8 min-w-[2rem] min-h-[2rem] rounded-full border flex items-center justify-center"
                      aria-label={`Increase ${item.name} quantity`}
                      onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="font-semibold whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</div>

                  <button
                    className="text-red-600 hover:underline ml-auto"
                    onClick={() => removeFromCart(item.product_id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xl font-semibold">Total: ₹{totalPrice.toFixed(2)}</div>
            <button
              className="btn-primary py-2 px-4 rounded"
              onClick={proceedToCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
