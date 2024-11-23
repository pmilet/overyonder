import React, { useRef, useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';

export const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, error } = useCamera();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (error) {
    return (
      <div className="h-full w-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-black/50 p-4 rounded-lg text-white max-w-md text-center">
          <div className="text-xl mb-2">📷 Camera Access Required</div>
          <p className="mb-4">
            This app needs camera access to provide an augmented reality experience. 
            Please enable camera access in your browser settings and refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500/50 rounded hover:bg-blue-500/70 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="h-full w-full object-cover fixed inset-0 -z-10"
    />
  );
};