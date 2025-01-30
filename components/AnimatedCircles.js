import React from 'react';

const AnimatedCircles = ({ className = '', size = '20rem' }) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer circle */}
      <div className="absolute inset-1  rounded-full animate-circle-pulse outer-circle"></div>
      {/* Inner circle */}
      <div className="absolute inset-2 rounded-full animate-circle-pulse-delayed inner-circle"></div>
    </div>
  );
};

export default AnimatedCircles; 