import React from 'react';

const Logo = ({ className = "w-12 h-12" }) => {
  return (
    <img src="/logo.svg" alt="EduKasih Logo" className={className} />
  );
};

export default Logo;
