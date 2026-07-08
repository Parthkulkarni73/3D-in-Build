import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSimulation, STATES } from '../context/SimulationContext';
import IntroCore from './IntroCore';
import ProceduralCity from './ProceduralCity';
import Environments from './Environments';
import HolographicEye from './HolographicEye';
import ParticlesGalaxy from './ParticlesGalaxy';
import SoundManager from '../audio/SoundManager';
import * as THREE from 'three';

// Define Splines for Cinematic Path
const cameraPoints = [
  new THREE.Vector3(0, 1.2, 14),      // 0. Intro Core View
  new THREE.Vector3(-14, 4.0, 22),    // 1. Cyber City Entry
  new THREE.Vector3(10, 4.8, 4),      // 2. AI Lab Entry
  new THREE.Vector3(3, 5.0, -18),     // 3. Quantum Reactor Entry
  new THREE.Vector3(-10, 4.0, -38),   // 4. Robotics Zone Entry
  new THREE.Vector3(10, 6.0, -56),    // 5. Space Deck Entry
  new THREE.Vector3(0, 3.2, -74)      // 6. Time Freeze Chamber
];

const targetPoints = [
  new THREE.Vector3(0, 0, 0),         // 0. Looking at Core
  new THREE.Vector3(-20, 2.0, 10),    // 1. Looking at Cyber City
  new THREE.Vector3(15, 3.0, -8),     // 2. Looking at AI Lab
  new THREE.Vector3(-3, 4.0, -28),    // 3. Looking at Quantum Reactor
  new THREE.Vector3(-18, 2.0, -48),   // 4. Looking at Robotics Zone
  new THREE.Vector3(16, 5.0, -64),    // 5. Looking at Space Deck
  new THREE.Vector3(0, 1.8, -84)      // 6. Looking at Freeze Chamber
];

const cameraCurve = new THREE.CatmullRomCurve3(cameraPoints);
const targetCurve = new THREE.CatmullRomCurve3(targetPoints);

const Scene = () => {
  const { simState, setSimState, setActiveEnvironment, setSelectedNode } = useSimulation();
  
  const scrollVal = useRef(0.0);
  const lerpedScroll = useRef(0.0);
  const lastEnvIdx = useRef(-1);
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  
  // Track scroll on window when ACTIVE
  useEffect(() => {
    const handleWheel = (e) => {
      if (simState !== STATES.ACTIVE) return;
      
      // Fine-grained scrolling speed
      scrollVal.current += e.deltaY * 0.00045;
      scrollVal.current = Math.max(0.0, Math.min(1.0, scrollVal.current));
    };

    let startY = 0;
    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e) => {
      if (simState !== STATES.ACTIVE) return;
      const deltaY = startY - e.touches[0].clientY;
      scrollVal.current += deltaY * 0.0012;
      scrollVal.current = Math.max(0.0, Math.min(1.0, scrollVal.current));
      startY = e.touches[0].clientY;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [simState]);

  // Reset scroll value on states reset
  useEffect(() => {
    if (simState === STATES.INTRO) {
      scrollVal.current = 0.0;
      lerpedScroll.current = 0.0;
      lastEnvIdx.current = -1;
      lookAtTarget.current.set(0, 0, 0);
    }
  }, [simState]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Smooth scroll value
    if (simState === STATES.ACTIVE) {
      lerpedScroll.current += (scrollVal.current - lerpedScroll.current) * delta * 4;
      
      // Dispatch scroll value to HUD via CustomEvent to bypass React render loops
      window.dispatchEvent(new CustomEvent('neural-scroll', { detail: lerpedScroll.current }));

      // Manage active environment and time freeze state changes here 
      const count = 6; 
      const currentEnvIdx = Math.min(Math.floor(lerpedScroll.current * count), count - 1);
      
      if (currentEnvIdx !== lastEnvIdx.current) {
        lastEnvIdx.current = currentEnvIdx;
        setActiveEnvironment(currentEnvIdx);
      }

      if (lerpedScroll.current >= 0.985) {
        setSimState(STATES.FREEZE);
        setSelectedNode(null);
      }
    }

    // 2. Camera controller per simulation states
    if (simState === STATES.INTRO || simState === STATES.GENERATING) {
      // Intro camera: lock focus on Core floating in center
      const targetPos = new THREE.Vector3(0, 1.2, 11);
      state.camera.position.lerp(targetPos, delta * 3.0);
      
      const targetFocus = new THREE.Vector3(0, 0.0, 0);
      lookAtTarget.current.lerp(targetFocus, delta * 3.0);
      state.camera.lookAt(lookAtTarget.current);

    } else if (simState === STATES.ACTIVE || simState === STATES.FREEZE) {
      const u = Math.min(0.999, Math.max(0.001, lerpedScroll.current));
      const rawCamPos = cameraCurve.getPointAt(u);
      const rawTargetPos = targetCurve.getPointAt(u);

      // Add Mouse Parallax (subtle offset based on cursor coordinate)
      const parallaxX = state.pointer.x * 1.5;
      const parallaxY = state.pointer.y * 1.0;
      
      const targetFocus = new THREE.Vector3(
        rawTargetPos.x + parallaxX,
        rawTargetPos.y + parallaxY,
        rawTargetPos.z
      );

      // Interpolate camera coordinates and focus target
      state.camera.position.lerp(rawCamPos, delta * 3.0);
      lookAtTarget.current.lerp(targetFocus, delta * 4.0);
      state.camera.lookAt(lookAtTarget.current);

    } else if (simState === STATES.ENDING) {
      // Ending: camera zooms into galaxy center
      const finalCamPos = new THREE.Vector3(0, 2.2, -96);
      const finalTarget = new THREE.Vector3(0, 2.0, -106);

      state.camera.position.lerp(finalCamPos, delta * 1.8);
      lookAtTarget.current.lerp(finalTarget, delta * 2.5);
      state.camera.lookAt(lookAtTarget.current);
    }
  });

  return (
    <group>
      {/* Draggable Intro Core */}
      <IntroCore />

      {/* Rises dynamically from progress */}
      <ProceduralCity />

      {/* 6 sectors situated in 3D coordinate zones */}
      <Environments />

      {/* Giant Eye visible in FREEZE phase */}
      <HolographicEye />

      {/* Swirling Galaxy visible in ENDING phase */}
      <ParticlesGalaxy />

      {/* Decorative Starfield Particle Clouds (Cyber Ambient Starry Background) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={500}
            array={useMemo(() => {
              const arr = new Float32Array(500 * 3);
              for (let i = 0; i < 500; i++) {
                arr[i * 3] = (Math.random() - 0.5) * 120;
                arr[i * 3 + 1] = (Math.random() - 0.5) * 80;
                arr[i * 3 + 2] = -30 - Math.random() * 90;
              }
              return arr;
            }, [])}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00e5ff"
          size={0.06}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

export default Scene;
export { cameraCurve, targetCurve };
