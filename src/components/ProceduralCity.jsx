import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulation, STATES } from '../context/SimulationContext';
import * as THREE from 'three';

const ProceduralCity = () => {
  const { simState, generationProgress } = useSimulation();
  const neuronsRef = useRef([]);
  const impulsesRef = useRef([]);

  // Generate neurons (somas) and connecting links (dendrites)
  const network = useMemo(() => {
    const count = 95;
    const neurons = [];
    
    // Generate somas scattered around the camera flight spline path
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 32;
      const x = Math.cos(angle) * radius;
      // Spread vertically for organic 3D brain volume
      const y = (Math.random() - 0.5) * 16 + 2; 
      const z = Math.sin(angle) * radius - 28;

      // Avoid core start center
      if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;

      const size = 0.12 + Math.random() * 0.22;
      const startThreshold = Math.random() * 0.75;
      
      // Color scheme: cyber cyan or cognitive purple/magenta
      const color = Math.random() > 0.55 ? "#00ffc8" : "#c084fc";

      neurons.push({
        id: i,
        position: [x, y, z],
        size,
        startThreshold,
        color
      });
    }

    // Connect nearest neighbors to form a synapic web
    const links = [];
    const maxLinkDist = 16;
    
    for (let i = 0; i < neurons.length; i++) {
      const n1 = neurons[i];
      
      // Measure distances to all other somas
      const targets = neurons
        .map((n2, idx) => ({ 
          idx, 
          dist: Math.hypot(
            n1.position[0] - n2.position[0],
            n1.position[1] - n2.position[1],
            n1.position[2] - n2.position[2]
          )
        }))
        .filter(item => item.idx !== i)
        .sort((a, b) => a.dist - b.dist);

      // Connect to 2 nearest somas within maximum distance
      let connectionsMade = 0;
      for (let j = 0; j < targets.length; j++) {
        if (connectionsMade >= 2) break;
        if (targets[j].dist < maxLinkDist) {
          const targetIdx = targets[j].idx;
          
          // Avoid duplicate connection segments
          const exists = links.some(l => 
            (l.from === i && l.to === targetIdx) || 
            (l.from === targetIdx && l.to === i)
          );

          if (!exists) {
            links.push({
              id: `${i}-${targetIdx}`,
              from: i,
              to: targetIdx,
              fromPos: n1.position,
              toPos: neurons[targetIdx].position,
              speed: 0.8 + Math.random() * 1.5,
              phase: Math.random() * Math.PI
            });
            connectionsMade++;
          }
        }
      }
    }

    return { neurons, links };
  }, []);

  // Pre-generate a single flat Float32Array containing all line segment coordinates
  const lineVertices = useMemo(() => {
    const arr = new Float32Array(network.links.length * 2 * 3);
    for (let i = 0; i < network.links.length; i++) {
      const link = network.links[i];
      
      // Point A
      arr[i * 6] = link.fromPos[0];
      arr[i * 6 + 1] = link.fromPos[1];
      arr[i * 6 + 2] = link.fromPos[2];
      
      // Point B
      arr[i * 6 + 3] = link.toPos[0];
      arr[i * 6 + 4] = link.toPos[1];
      arr[i * 6 + 5] = link.toPos[2];
    }
    return arr;
  }, [network.links]);

  useFrame((state, delta) => {
    if (simState === STATES.INTRO) return;

    const t = state.clock.getElapsedTime();

    // 1. Animate neurons' size based on generationProgress
    network.neurons.forEach((n, idx) => {
      const mesh = neuronsRef.current[idx];
      if (mesh) {
        let targetScale = 0;
        
        if (simState === STATES.ENDING) {
          // Dissolve in ending: shrink and fly away
          targetScale = THREE.MathUtils.lerp(mesh.scale.x, 0.001, delta * 3.5);
          mesh.position.y += delta * 12;
        } else {
          // Growth along progress
          if (generationProgress >= n.startThreshold) {
            const currentProgress = (generationProgress - n.startThreshold) / (1 - n.startThreshold);
            targetScale = Math.min(1.0, currentProgress * 1.15);
          }
          mesh.scale.setScalar(
            THREE.MathUtils.lerp(mesh.scale.x, targetScale, delta * 6)
          );
        }
      }
    });

    // 2. Animate impulses traveling along synapse lines
    network.links.forEach((link, idx) => {
      const mesh = impulsesRef.current[idx];
      if (mesh) {
        if (simState === STATES.FREEZE) return; // Halt impulses during time freeze

        // Linear interpolation parameter (0 to 1 loop)
        const speedMultiplier = 1.0 + generationProgress * 1.5; // Firing speeds up as AI charges
        const p = ((t * link.speed * speedMultiplier) + link.phase) % 1.0;
        
        // Calculate coordinate position along link segment
        mesh.position.x = THREE.MathUtils.lerp(link.fromPos[0], link.toPos[0], p);
        mesh.position.y = THREE.MathUtils.lerp(link.fromPos[1], link.toPos[1], p);
        mesh.position.z = THREE.MathUtils.lerp(link.fromPos[2], link.toPos[2], p);

        // Scale fades in with the overall progress
        const scaleVal = Math.min(0.12, generationProgress * 0.12);
        mesh.scale.setScalar(scaleVal);
      }
    });
  });

  return (
    <group>
      {/* 1. Pre-buffered Dendrites Connection Mesh (Single draw call) */}
      {generationProgress > 0.05 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={network.links.length * 2}
              array={lineVertices}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.07 * generationProgress}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {/* 2. Neuron Somas */}
      {network.neurons.map((n, idx) => (
        <mesh
          key={n.id}
          ref={(el) => (neuronsRef.current[idx] = el)}
          position={n.position}
          scale={[0, 0, 0]}
        >
          <sphereGeometry args={[n.size, 16, 16]} />
          <meshBasicMaterial
            color={n.color}
            transparent
            opacity={0.8}
          />
          {/* Geodesic Halo */}
          <mesh scale={[1.25, 1.25, 1.25]}>
            <icosahedronGeometry args={[n.size, 1]} />
            <meshBasicMaterial
              color={n.color}
              wireframe
              transparent
              opacity={0.25 * generationProgress}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </mesh>
      ))}

      {/* 3. Travelling Firing Impulses (Data Packets) */}
      {network.links.map((link, idx) => (
        <mesh
          key={`impulse-${link.id}`}
          ref={(el) => (impulsesRef.current[idx] = el)}
          scale={[0, 0, 0]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color="#00ffc8"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

export default ProceduralCity;
