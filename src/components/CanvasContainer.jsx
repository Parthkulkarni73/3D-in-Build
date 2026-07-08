import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import { useSimulation, STATES } from '../context/SimulationContext';

const CanvasContainer = () => {
  const { simState } = useSimulation();

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-black">
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 0, 15] }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          logarithmicDepthBuffer: false
        }}
        onPointerMissed={() => {
          // Can clear selections if clicked empty space
        }}
      >
        {/* Cinematic Fog */}
        <fog 
          attach="fog" 
          args={['#000000', simState === STATES.INTRO ? 5 : 10, simState === STATES.ENDING ? 120 : 75]} 
        />
        
        {/* Lights System */}
        <ambientLight intensity={0.15} />
        
        {/* Directed Main Light with shadows */}
        <directionalLight
          position={[10, 20, 15]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={100}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.0005}
        />

        {/* Ambient neon fill lights to set the theme */}
        <pointLight position={[-20, 10, 0]} intensity={0.4} color="#00ffc8" />
        <pointLight position={[20, 15, -30]} intensity={0.5} color="#c084fc" />
        <pointLight position={[-10, 8, -60]} intensity={0.4} color="#00e5ff" />

        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CanvasContainer;
