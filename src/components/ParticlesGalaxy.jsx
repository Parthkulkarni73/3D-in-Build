import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulation, STATES } from '../context/SimulationContext';
import * as THREE from 'three';

const ParticlesGalaxy = () => {
  const { simState } = useSimulation();
  const pointsRef = useRef();

  const particleCount = 14000;
  
  // Define 3D segments for the CYBORG X typographic logo
  const logoTargets = useMemo(() => {
    const letters = ['C', 'Y', 'B', 'O', 'R', 'G', 'X'];
    const offsets = [-7.5, -5.0, -2.5, 0.0, 2.5, 5.0, 8.5]; // Spaced for "CYBORG X"

    const segments = {
      C: [
        [[0.8, 1.4], [-0.8, 1.4]],    // top
        [[-0.8, 1.4], [-0.8, -1.4]],  // left vertical
        [[-0.8, -1.4], [0.8, -1.4]]   // bottom
      ],
      Y: [
        [[-0.8, 1.4], [0, 0]],        // top-left
        [[0.8, 1.4], [0, 0]],         // top-right
        [[0, 0], [0, -1.4]]           // stem
      ],
      B: [
        [[-0.8, 1.4], [-0.8, -1.4]],  // left vertical
        [[-0.8, 1.4], [0.6, 1.0]],    // top loop top
        [[0.6, 1.0], [0.6, 0.4]],     // top loop right
        [[0.6, 0.4], [-0.8, 0.1]],    // middle bar
        [[-0.8, 0.1], [0.7, -0.2]],   // bottom loop top
        [[0.7, -0.2], [0.7, -1.0]],   // bottom loop right
        [[0.7, -1.0], [-0.8, -1.4]]   // bottom loop bottom
      ],
      O: [
        [[-0.8, 1.3], [0.8, 1.3]],    // top
        [[0.8, 1.3], [0.8, -1.3]],    // right
        [[0.8, -1.3], [-0.8, -1.3]],  // bottom
        [[-0.8, -1.3], [-0.8, 1.3]]   // left
      ],
      R: [
        [[-0.8, 1.4], [-0.8, -1.4]],  // left vertical
        [[-0.8, 1.4], [0.8, 1.0]],    // loop top
        [[0.8, 1.0], [0.8, 0.3]],     // loop right
        [[0.8, 0.3], [-0.8, 0.1]],    // middle bar
        [[-0.8, 0.1], [0.8, -1.4]]    // leg diagonal
      ],
      G: [
        [[0.8, 1.4], [-0.8, 1.4]],    // top
        [[-0.8, 1.4], [-0.8, -1.4]],  // left vertical
        [[-0.8, -1.4], [0.8, -1.4]],  // bottom
        [[0.8, -1.4], [0.8, -0.2]],   // right lip stem
        [[0.8, -0.2], [0.2, -0.2]]    // inner horizontal lip
      ],
      X: [
        [[-0.8, 1.4], [0.8, -1.4]],   // slash 1
        [[0.8, 1.4], [-0.8, -1.4]]    // slash 2
      ]
    };

    const targetsArr = new Float32Array(particleCount * 3);

    // Map each particle to a letter and segment
    for (let i = 0; i < particleCount; i++) {
      // 1. Pick a letter index
      const letterIdx = i % letters.length;
      const letter = letters[letterIdx];
      const offsetX = offsets[letterIdx];

      // 2. Pick a random segment from that letter
      const letterSegs = segments[letter];
      const seg = letterSegs[Math.floor(Math.random() * letterSegs.length)];

      const startPt = seg[0];
      const endPt = seg[1];

      // 3. Interpolate along segment line
      const alpha = Math.random();
      const lx = THREE.MathUtils.lerp(startPt[0], endPt[0], alpha) + offsetX;
      const ly = THREE.MathUtils.lerp(startPt[1], endPt[1], alpha);
      const lz = 0; // flat plane letter coordinates

      // 4. Add small volumetric noise to make it glow like 3D gas
      const noise = 0.16;
      targetsArr[i * 3] = lx + (Math.random() - 0.5) * noise;
      targetsArr[i * 3 + 1] = ly + (Math.random() - 0.5) * noise;
      targetsArr[i * 3 + 2] = lz + (Math.random() - 0.5) * noise;
    }

    return targetsArr;
  }, []);

  // Generate starting storm coordinates (sphere cloud around the core sphere)
  const [initialPositions, colors, randomSpeeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    const cCyan = new THREE.Color("#00ffc8");
    const cPurple = new THREE.Color("#c084fc");

    for (let i = 0; i < particleCount; i++) {
      // Storm sphere coordinates around core Z: -92
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 4.0 + Math.random() * 8.0;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi); // Local center is (0, 3.2, -92) in Scene layout

      speeds[i] = 0.5 + Math.random() * 1.5;

      // Half cyan, half purple particles
      const color = Math.random() > 0.5 ? cCyan : cPurple;
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return [pos, col, speeds];
  }, []);

  // Track dynamic coordinates (initialized to starting storm coordinates)
  const currentPositions = useMemo(() => new Float32Array(initialPositions), []);

  useFrame((state, delta) => {
    const positionAttribute = pointsRef.current?.geometry.attributes.position;
    if (!positionAttribute) return;

    const t = state.clock.getElapsedTime();

    if (simState === STATES.ENDING) {
      // Morph storm particles to letter targets
      for (let i = 0; i < particleCount; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);

        const tx = logoTargets[i * 3];
        const ty = logoTargets[i * 3 + 1];
        // Logo center is Z: -15 in local group space, placing it at Z: -105 in Scene space
        const tz = -13; 

        // Lerp towards logo coordinates
        const morphSpeed = delta * 2.5;
        positionAttribute.setX(i, THREE.MathUtils.lerp(x, tx, morphSpeed));
        positionAttribute.setY(i, THREE.MathUtils.lerp(y, ty, morphSpeed));
        positionAttribute.setZ(i, THREE.MathUtils.lerp(z, tz, morphSpeed));
      }
      positionAttribute.needsUpdate = true;

      // Slow orbital rotate on letters
      pointsRef.current.rotation.y = Math.sin(t * 0.15) * 0.15;
    } else {
      // In active states, particles orbit around the core like an idle storm cloud
      for (let i = 0; i < particleCount; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);

        // Orbit rotation around local Y axis
        const orbitAngle = delta * randomSpeeds[i] * 0.12;
        const cos = Math.cos(orbitAngle);
        const sin = Math.sin(orbitAngle);

        const nx = x * cos - z * sin;
        const nz = x * sin + z * cos;
        
        positionAttribute.setX(i, nx);
        positionAttribute.setY(i, y + Math.sin(t * 1.5 + i) * 0.003); // micro floating
        positionAttribute.setZ(i, nz);
      }
      positionAttribute.needsUpdate = true;
    }
  });

  // Galaxy is active in FREEZE and ENDING states, centered at Z: -92
  if (simState !== STATES.FREEZE && simState !== STATES.ENDING) return null;

  return (
    <group position={[0, 3.2, -92]}>
      {/* Particle assemblage points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={currentPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

export default ParticlesGalaxy;
