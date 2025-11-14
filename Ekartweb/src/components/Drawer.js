import React from 'react';

export default function Drawer({ open, onClose, title, children, width = 'w-full sm:w-96' }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
          <div className={`absolute right-0 top-0 bottom-0 bg-white shadow-2xl ${width} p-4 overflow-y-auto transition-transform`}
               style={{ transform: 'translateX(0)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button aria-label="Close" className="text-gray-600" onClick={onClose}>✕</button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
