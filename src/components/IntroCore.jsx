import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSimulation, STATES } from '../context/SimulationContext';
import SoundManager from '../audio/SoundManager';
import * as THREE from 'three';

const IntroCore = () => {
  const { simState, setSimState, generationProgress, setGenerationProgress, soundEnabled } = useSimulation();
  const meshRef = useRef();
  const innerRef = useRef();
  const particlesRef = useRef();
  
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const accumRotation = useRef(0);
  const { size } = useThree();

  // Create a small particle system revolving around the core
  const particleCount = 120;
  
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1.5;
      arr[i * 3] = Math.cos(theta) * radius;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 1.0;
      arr[i * 3 + 2] = Math.sin(theta) * radius;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Floating animation
    if (meshRef.current) {
      if (simState === STATES.INTRO || simState === STATES.GENERATING) {
        meshRef.current.position.y = Math.sin(t * 1.5) * 0.4;
        // Smoothly grow back to 1.0 if restarting
        meshRef.current.scale.setScalar(
          THREE.MathUtils.lerp(meshRef.current.scale.x, 1.0, delta * 5)
        );
        // Continuous slow rotation if not dragging
        if (!isDragging) {
          meshRef.current.rotation.y += delta * 0.3;
          meshRef.current.rotation.x += delta * 0.15;
        }
      } else {
        // Active or Ending: Shrink core and move it out of sight
        meshRef.current.scale.setScalar(
          THREE.MathUtils.lerp(meshRef.current.scale.x, 0.001, delta * 4)
        );
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 10, delta * 3);
      }
    }

    if (innerRef.current) {
      // Inner core spins faster, scales up with progress
      innerRef.current.rotation.y -= delta * 2.0;
      innerRef.current.rotation.z += delta * 1.0;
      
      if (simState === STATES.GENERATING) {
        const scaleVal = 1.0 + generationProgress * 0.8;
        innerRef.current.scale.set(scaleVal, scaleVal, scaleVal);
      }
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.8;
      // Vibrate particles based on progress
      if (simState === STATES.GENERATING) {
        const speed = 1 + generationProgress * 5;
        particlesRef.current.position.x = Math.sin(t * 40) * 0.02 * generationProgress;
        particlesRef.current.position.y = Math.cos(t * 43) * 0.02 * generationProgress;
      }
    }
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    // Only drag in INTRO or GENERATING states
    if (simState !== STATES.INTRO && simState !== STATES.GENERATING) return;

    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    
    // Initialize audio context on first interactive gesture
    if (soundEnabled) {
      SoundManager.enable(true);
    }

    if (simState === STATES.INTRO) {
      setSimState(STATES.GENERATING);
    }
    
    SoundManager.startChargeSound();
    SoundManager.playClick();
  };

  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    
    // Rotate mesh based on drag
    if (meshRef.current) {
      meshRef.current.rotation.y += deltaX * 0.007;
      meshRef.current.rotation.x += deltaY * 0.007;
    }

    // Accumulate total rotation drag to drive generation progress
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    // Normalize distance by screen size
    const normDist = (distance / Math.max(size.width, size.height)) * 12.0;
    
    accumRotation.current += normDist;
    const targetProgress = Math.min(accumRotation.current / 15, 1.0);
    setGenerationProgress(targetProgress);
    
    SoundManager.updateChargeSound(targetProgress);
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (!isDragging) return;
    
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
    SoundManager.stopChargeSound();

    if (generationProgress < 1.0) {
      // Revert state to INTRO if drag is released early, or keep GENERATING and let them resume
      // Let's keep the progress and let them resume dragging
    }
  };

  return (
    <group>
      <group 
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Outer Glass Neural Soma Sphere */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshPhysicalMaterial
            color="#00ffc8"
            emissive="#005544"
            roughness={0.1}
            metalness={0.1}
            transmission={0.6}
            thickness={1.5}
            transparent
            opacity={0.8}
            wireframe={false}
          />
        </mesh>

        {/* Geodesic Wireframe Neural Outer Shell */}
        <mesh>
          <icosahedronGeometry args={[1.35, 2]} />
          <meshBasicMaterial
            color={simState === STATES.GENERATING ? "#c084fc" : "#00ffc8"}
            wireframe
            transparent
            opacity={0.4 + generationProgress * 0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Inner core nucleus */}
        <mesh ref={innerRef}>
          <dodecahedronGeometry args={[0.7, 1]} />
          <meshBasicMaterial
            color={simState === STATES.GENERATING ? "#00e5ff" : "#00ffc8"}
            wireframe={true}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Inner Core Solid Glow Sphere */}
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial
            color={simState === STATES.GENERATING ? "#00e5ff" : "#00ffc8"}
            transparent
            opacity={0.5 + generationProgress * 0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Orbiting Particle Ring */}
      {(simState === STATES.INTRO || simState === STATES.GENERATING) && positions && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#00ffc8"
            size={0.07}
            transparent
            opacity={0.6 + generationProgress * 0.4}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
};

export default IntroCore;
