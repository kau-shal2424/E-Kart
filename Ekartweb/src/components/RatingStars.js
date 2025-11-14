import React from 'react';

export default function RatingStars({ rating = 0, outOf = 5 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = [];
  for (let i = 1; i <= outOf; i++) {
    let fill = 'text-gray-300';
    if (i <= full) fill = 'text-yellow-400';
    else if (i === full + 1 && half) fill = 'text-yellow-300';
    stars.push(
      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${fill}`}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.175 0l-2.802 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${rating.toFixed(1)} out of ${outOf}`}>
      {stars}
      <span className="ml-1 text-xs text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}
