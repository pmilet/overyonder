import React from 'react';
import { useStore } from '../store';
import { useCompass } from '../hooks/useCompass';
import { config } from '../config';

export const CompassRose: React.FC = () => {
  const { heading, isHeadingLocked } = useStore();
  const { compass } = useCompass();
  
  // Use locked heading if available, otherwise use live compass or default
  const currentHeading = isHeadingLocked 
    ? heading?.heading 
    : compass?.heading ?? config.defaultHeading;

  return (
    <div className="absolute right-4 bottom-4 pointer-events-none z-[900]">
      <div className="w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          {/* Background circle */}
          <circle 
            cx="50" 
            cy="50" 
            r="48" 
            fill="rgba(0,0,0,0.4)" 
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth="1" 
          />
          
          {/* Cardinal directions - fixed to true north */}
          <g 
            fill="white" 
            fontSize="14" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            fontWeight="bold"
          >
            <text x="50" y="15" fill="#FF4444">N</text>
            <text x="85" y="50">E</text>
            <text x="50" y="85">S</text>
            <text x="15" y="50">W</text>
          </g>
          
          {/* North arrow - fixed */}
          <path
            d="M50,5 L45,45 L50,40 L55,45 L50,5"
            fill="#FF4444"
            stroke="white"
            strokeWidth="1.5"
            className="drop-shadow"
          />
          
          {/* South arrow - fixed */}
          <path
            d="M50,95 L45,55 L50,60 L55,55 L50,95"
            fill="white"
            stroke="white"
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* Degree markers - fixed */}
          {Array.from({ length: 72 }).map((_, i) => {
            const angle = (i * 5);
            const isCardinal = angle % 90 === 0;
            const isMajor = angle % 45 === 0;
            const length = isCardinal ? 12 : isMajor ? 10 : 6;
            const rotation = `rotate(${angle} 50 50)`;
            return (
              <line
                key={i}
                x1="50"
                y1="2"
                x2="50"
                y2={2 + length}
                stroke={isCardinal ? "#FF4444" : "rgba(255,255,255,0.7)"}
                strokeWidth={isCardinal ? "2" : "1"}
                transform={rotation}
              />
            );
          })}

          {/* Current heading indicator - rotates with heading */}
          <g transform={`rotate(${currentHeading} 50 50)`}>
            <path
              d="M50,15 L53,25 L50,23 L47,25 Z"
              fill="#00FF00"
              stroke="white"
              strokeWidth="1"
              className="compass-pulse"
            />
          </g>
        </svg>
      </div>
      
      {/* Current heading display */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-lg text-white text-center backdrop-blur-sm whitespace-nowrap">
        <div className="text-lg font-bold">{(currentHeading?? 0).toFixed(1)}°</div>
        <div className="text-xs opacity-75">
          {isHeadingLocked ? "Locked" : compass ? "Live" : "Default"} Heading
        </div>
      </div>
    </div>
  );
};