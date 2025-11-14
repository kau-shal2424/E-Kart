import React from 'react';

export default function Home({
  onGetStarted,
  onAdminClick,
  isLoggedInUser = false,
  username,
  onViewOrders,
  onOpenCart,
}) {
  const displayName = username || 'User';

  return (
    <section className="ekart-hero">
      <div className="ekart-hero-content animate-fade-in">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] items-center">
          <div>
            {!isLoggedInUser ? (
              <>
                <p className="text-xs font-semibold tracking-[0.25em] text-white/70 mb-3 uppercase">
                  Smart everyday shopping
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight">
                  Welcome to <span className="drop-shadow-md">eKart</span>
                </h1>
                <p className="text-base sm:text-lg text-white/90 max-w-xl mb-6">
                  eKart is a small online store experience where you can explore products, fill your cart,
                  and place orders from the comfort of your home. It is designed as a simple demo of how a
                  modern shopping site can look and feel.
                </p>
                <p className="text-sm sm:text-base text-white/80 max-w-xl mb-6">
                  As a customer, you can browse items, manage your cart, and track your orders in one place.
                  As an admin, you can keep an eye on sales, inventory, and user activity through a clean dashboard.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold tracking-[0.25em] text-white/70 mb-3 uppercase">
                  Your eKart space
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-tight">
                  Welcome, <span className="drop-shadow-md">{displayName}</span>
                </h1>
                <p className="text-sm sm:text-base text-white/85 max-w-xl mb-6">
                  From here you can jump straight back into shopping, check your recent orders, or quickly
                  open your cart. Use this page as a simple starting point whenever you return to eKart.
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-5 py-3 rounded-full btn-primary text-sm sm:text-base shadow-lg hover:shadow-xl"
              >
                {isLoggedInUser ? 'Go to shop' : 'Start shopping'}
              </button>

              {!isLoggedInUser && (
                <button
                  type="button"
                  onClick={onAdminClick}
                  className="px-5 py-3 rounded-full btn-outline/ghost bg-white/10 border border-white/40 text-white text-sm sm:text-base hover:bg-white/15"
                >
                  Admin access
                </button>
              )}

              {isLoggedInUser && onViewOrders && (
                <button
                  type="button"
                  onClick={onViewOrders}
                  className="px-5 py-3 rounded-full btn-outline bg-white/10 border border-white/40 text-white text-sm sm:text-base hover:bg-white/15"
                >
                  View your orders
                </button>
              )}

              {isLoggedInUser && onOpenCart && (
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="px-5 py-3 rounded-full bg-white/90 text-blue-700 text-sm sm:text-base hover:bg-white"
                >
                  Open cart
                </button>
              )}
            </div>

            <div className="text-xs sm:text-sm text-white/80 flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                Live cart & orders simulation
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300"></span>
                Built for learning and demos
              </span>
            </div>
          </div>

          {!isLoggedInUser && (
            <div className="card bg-white/95 backdrop-blur shadow-xl animate-fade-in-slow">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">What you can do here</h2>
                <p className="text-sm text-slate-600">
                  This project is not a real store. It is a guided walkthrough of a typical e‑commerce
                  journey from both customer and admin sides.
                </p>
              </div>
              <div className="p-5 space-y-4 text-sm text-slate-700">
                <div className="flex gap-3">
                  <div className="mt-1 h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                    U
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">For shoppers</div>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 mt-1 space-y-0.5">
                      <li>Log in as a user and browse featured products.</li>
                      <li>Add items to your cart and review the total.</li>
                      <li>Place demo orders and see them in your history.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 h-6 w-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold">
                    A
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">For admins</div>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 mt-1 space-y-0.5">
                      <li>Log in as an admin to open the dashboard.</li>
                      <li>Monitor users, orders, and revenue snapshots.</li>
                      <li>Manage products and update stock levels.</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  Tip: Use different demo accounts to experience eKart as a customer and as an admin.
                </div>
              </div>
            </div>
          )}
        </div>

        {!isLoggedInUser && (
          <div className="mt-10 text-xs sm:text-sm text-white/70">
            <div className="font-semibold mb-1">About this project</div>
            <p className="max-w-2xl">
              eKart was created as a practice project to connect a modern React front‑end with a backend
              API. It focuses on the overall flow and user experience rather than real payments or live
              deliveries.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
