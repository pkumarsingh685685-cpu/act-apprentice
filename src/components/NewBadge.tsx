import React from "react";

export function NewBadge() {
  return (
    <div className="relative inline-flex items-center justify-center w-8 h-8 shrink-0 ml-1 align-middle">
      <div
        className="absolute inset-0 flex items-center justify-center text-red-600 fast-blink drop-shadow-sm"
      >
        <style>
          {`
            @keyframes star-blink-fast {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
            .fast-blink {
              animation: star-blink-fast 0.6s step-end infinite;
            }
          `}
        </style>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          fill="currentColor"
          className="w-full h-full transform scale-[1.3]"
        >
          <polygon points="50,5 61,35 90,20 70,47 100,55 72,67 85,95 58,75 40,95 38,70 10,85 25,60 5,45 30,42 10,20 39,35" />
        </svg>
      </div>
      <span
        className="relative z-10 text-white font-bold text-[9px] mt-[1px] tracking-wider uppercase z-20"
        style={{ textShadow: "1px 1px 0px rgba(0,0,0,0.5), -1px -1px 0px rgba(0,0,0,0.5), 1px -1px 0px rgba(0,0,0,0.5), -1px 1px 0px rgba(0,0,0,0.5)" }}
      >
        NEW
      </span>
    </div>
  );
}

