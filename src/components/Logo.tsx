import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32, showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Person (Light Blue) */}
        <path
          d="M45 85C25 75 10 55 10 35C10 20 20 10 35 10C40 10 45 12 50 15"
          stroke="#4FC3F7"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="35" cy="10" r="6" fill="#4FC3F7" />

        {/* Right Person (Green) */}
        <path
          d="M55 85C75 75 90 55 90 35C90 20 80 10 65 10C60 10 55 12 50 15"
          stroke="#00A651"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="65" cy="10" r="6" fill="#00A651" />

        {/* House (Dark Blue) */}
        <path
          d="M35 55L50 40L65 55V75H35V55Z"
          fill="#005696"
        />
        <path
          d="M30 55L50 35L70 55"
          stroke="#005696"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-[#005696] leading-tight italic">Partners Home</span>
          <span className="text-[10px] text-[#666666] uppercase tracking-widest font-medium -mt-1">and Nursing Services</span>
        </div>
      )}
    </div>
  );
};
