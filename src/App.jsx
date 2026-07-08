import React, { useState, useEffect } from 'react';
import { SimulationProvider } from './context/SimulationContext';
import CanvasContainer from './components/CanvasContainer';
import HUDOverlay from './components/HUDOverlay';

const ErrorOverlay = () => {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const handleError = (event) => {
      const msg = event.error ? event.error.stack || event.error.message : event.message;
      setErrors((prev) => [...prev, `Error: ${msg}`]);
    };
    const handleRejection = (event) => {
      const msg = event.reason ? event.reason.stack || event.reason.message || event.reason : "Unknown promise rejection";
      setErrors((prev) => [...prev, `Promise Rejection: ${msg}`]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-[99999] bg-red-950/95 border-b border-red-500 text-red-200 text-xs font-mono p-4 max-h-60 overflow-y-auto pointer-events-auto select-text">
      <div className="font-bold mb-2 text-red-400">⚠️ RUNTIME ERROR DETECTED:</div>
      {errors.map((err, i) => (
        <pre key={i} className="whitespace-pre-wrap mb-2 bg-black/40 p-2 rounded border border-red-900">{err}</pre>
      ))}
      <button 
        onClick={() => setErrors([])}
        className="mt-1 bg-red-800 text-white px-3 py-1 rounded hover:bg-red-700 cursor-pointer font-bold"
      >
        Clear Errors
      </button>
    </div>
  );
};

function App() {
  return (
    <SimulationProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
        {/* Global Runtime Error Tracker */}
        <ErrorOverlay />

        {/* R3F WebGL Canvas Scene */}
        <CanvasContainer />

        {/* Glassmorphic Cyber HUD Overlay */}
        <HUDOverlay />
      </div>
    </SimulationProvider>
  );
}

export default App;
