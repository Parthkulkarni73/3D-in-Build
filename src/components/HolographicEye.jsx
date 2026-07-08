import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulation, STATES } from '../context/SimulationContext';
import * as THREE from 'three';

const HolographicEye = () => {
  const { simState } = useSimulation();
  const coreGroup = useRef();
  const energySphere = useRef();
  
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();
  const stormRef = useRef();

  const endingFade = useRef(1.0);

  // Generate coordinate vertices for the cognitive storm
  const particleCount = 280;
  const stormPositions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.4 + Math.random() * 1.5; // Orbiting distance from core

      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    // Animate in ACTIVE, FREEZE, and ENDING states
    if (simState !== STATES.FREEZE && simState !== STATES.ACTIVE && simState !== STATES.ENDING) return;

    const t = state.clock.getElapsedTime();

    // 1. Manage ending fade out smoothly
    if (simState === STATES.ENDING) {
      endingFade.current = THREE.MathUtils.lerp(endingFade.current, 0.0, delta * 1.6);
    } else {
      endingFade.current = 1.0;
    }

    // 2. Slow hover floating
    if (coreGroup.current) {
      coreGroup.current.position.y = 3.2 + Math.sin(t * 1.6) * 0.12;
      coreGroup.current.rotation.y += delta * 0.05;
    }

    // 3. Pulsating energy core
    if (energySphere.current) {
      const scale = 1.0 + Math.sin(t * 4.5) * 0.08;
      energySphere.current.scale.set(scale, scale, scale);
    }

    // 4. Ring orbits
    if (ring1.current) ring1.current.rotation.y += delta * 0.8;
    if (ring2.current) ring2.current.rotation.x -= delta * 1.0;
    if (ring3.current) ring3.current.rotation.z += delta * 0.6;

    // 5. Spin particle storm
    if (stormRef.current) {
      stormRef.current.rotation.y -= delta * 0.4;
      stormRef.current.rotation.z += delta * 0.2;
    }

    // Update opacities dynamically for fade out
    if (coreGroup.current) {
      coreGroup.current.traverse((child) => {
        if (child.isMesh && child.material) {
          // Store original opacity once
          if (child.material.userData.originalOpacity === undefined) {
            child.material.userData.originalOpacity = child.material.opacity;
          }
          child.material.opacity = child.material.userData.originalOpacity * endingFade.current;
        }
        if (child.isPoints && child.material) {
          if (child.material.userData.originalOpacity === undefined) {
            child.material.userData.originalOpacity = child.material.opacity;
          }
          child.material.opacity = child.material.userData.originalOpacity * endingFade.current;
        }
      });
    }
  });

  // Render in FREEZE and ENDING states so the transition is perfectly seamless
  if (simState !== STATES.FREEZE && simState !== STATES.ENDING) return null;

  return (
    <group ref={coreGroup} position={[0, 3.2, -92]}>
      
      {/* 1. Main Energy Sphere Core */}
      <group ref={energySphere}>
        {/* Central Core */}
        <mesh>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshBasicMaterial
            color="#00ffc8"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* Outer Plasma Corona */}
        <mesh scale={[1.2, 1.2, 1.2]}>
          <dodecahedronGeometry args={[0.9, 1]} />
          <meshBasicMaterial
            color="#c084fc"
            wireframe
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 2. Concentric Orbit Rings */}
      <mesh ref={ring1}>
        <torusGeometry args={[2.0, 0.04, 8, 48]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.03, 8, 48]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring3} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[1.7, 0.02, 8, 32]} />
        <meshBasicMaterial color="#ffbc00" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 3. Cognitive Glyphs / Symbolic Wireframe Objects */}
      {[-1, 1].map((dir, i) => (
        <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
          <mesh position={[2.8 * dir, 0, 0]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshBasicMaterial color="#00ffc8" wireframe transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* 4. Particle Storm */}
      <points ref={stormRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={stormPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00e5ff"
          size={0.08}
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* 5. Volumetric Glow Cylinders */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 3.0, 10, 32, 1, true]} />
        <meshBasicMaterial
          color="#00ffc8"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default HolographicEye;
