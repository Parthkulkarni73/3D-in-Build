import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimulation, STATES } from '../context/SimulationContext';
import SoundManager from '../audio/SoundManager';
import * as THREE from 'three';

// Glowing Interactive Node Marker
const LocalNodeMarker = ({ position, onClick, color }) => {
  const [hovered, setHovered] = useState(false);
  const markerRef = useRef();
  const ringRef = useRef();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
      const scale = 1.0 + Math.sin(t * 5) * 0.15;
      ringRef.current.scale.setScalar(scale);
    }
    if (markerRef.current) {
      markerRef.current.position.y = position[1] + Math.sin(t * 3) * 0.1;
    }
  });

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  return (
    <group ref={markerRef} position={[position[0], position[1], position[2]]}>
      {/* Central Interactive Core Sphere */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          SoundManager.playHover();
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial
          color={hovered ? "#ffffff" : color}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Outer Reticle Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.62, 16]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Halo Glow */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          wireframe
        />
      </mesh>
    </group>
  );
};

// 1. Sensory Input Layer Hub
const InputLayerSector = ({ position, onSelect }) => {
  const rotationRef = useRef();

  useFrame((state, delta) => {
    if (rotationRef.current) {
      rotationRef.current.rotation.y += delta * 0.25;
      rotationRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Soma cluster representing input nodes */}
      <group ref={rotationRef}>
        <mesh>
          <icosahedronGeometry args={[1.4, 1]} />
          <meshBasicMaterial color="#00ffc8" wireframe transparent opacity={0.3} />
        </mesh>
        
        {/* Core synapse node */}
        <mesh>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial color="#00ffc8" transparent opacity={0.8} />
        </mesh>
        
        {/* Orbiting sub-nodes */}
        {[-1, 1].map((dir, i) => (
          <mesh key={i} position={[dir * 1.5, Math.sin(i) * 1.0, 0]} scale={[0.2, 0.2, 0.2]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#00e5ff" />
          </mesh>
        ))}
      </group>

      <LocalNodeMarker position={[0, 1.8, 0]} onClick={onSelect} color="#00ffc8" />
    </group>
  );
};

// 2. Memory Vault (Floating Crystals)
const MemoryVaultSector = ({ position, onSelect }) => {
  const crystalsGroup = useRef();

  const crystalNames = ["Artificial Intelligence", "Robotics", "Cyber Security", "Space", "Quantum Computing"];
  
  // Generate 5 crystal offsets
  const crystalData = useMemo(() => {
    const list = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      list.push({
        id: i,
        name: crystalNames[i],
        angle,
        radius: 2.2,
        heightOffset: (Math.random() - 0.5) * 0.8,
        rotSpeed: 0.4 + Math.random() * 0.6
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    if (crystalsGroup.current) {
      crystalsGroup.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Glowing Central Library Core */}
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial
          color="#c084fc"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#c084fc" wireframe transparent opacity={0.5} />
      </mesh>

      {/* Floating Rotating Memory Crystals */}
      <group ref={crystalsGroup}>
        {crystalData.map((c) => {
          const x = Math.cos(c.angle) * c.radius;
          const z = Math.sin(c.angle) * c.radius;
          return (
            <group key={c.id} position={[x, c.heightOffset, z]}>
              <mesh 
                onPointerOver={() => SoundManager.playHover()}
                rotation={[c.id, c.id * 1.5, 0]}
              >
                <octahedronGeometry args={[0.38, 0]} />
                <meshPhysicalMaterial
                  color="#c084fc"
                  roughness={0.0}
                  metalness={0.1}
                  transmission={0.8}
                  thickness={0.5}
                  transparent
                  opacity={0.85}
                />
              </mesh>
              
              {/* Micro aura rings around crystals */}
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <ringGeometry args={[0.5, 0.54, 8]} />
                <meshBasicMaterial color="#c084fc" transparent opacity={0.3} wireframe />
              </mesh>
            </group>
          );
        })}
      </group>

      <LocalNodeMarker position={[0, 1.9, 0]} onClick={onSelect} color="#c084fc" />
    </group>
  );
};

// 3. Learning Process (Machine Learning node connections + Drei SDF Texts)
const LearningProcessSector = ({ position, onSelect }) => {
  const signalProgress = useRef(0.0);
  const corePulse = useRef();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    // Pulse center
    if (corePulse.current) {
      const s = 1.0 + Math.sin(t * 3.0) * 0.12;
      corePulse.current.scale.setScalar(s);
    }
    
    // Animate travelling weight packets
    signalProgress.current = (signalProgress.current + delta * 0.4) % 1.0;
  });

  return (
    <group position={position}>
      {/* Main learning synapse node */}
      <group ref={corePulse}>
        <mesh>
          <sphereGeometry args={[0.65, 16, 16]} />
          <meshBasicMaterial
            color="#ffbc00"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh scale={[1.3, 1.3, 1.3]}>
          <octahedronGeometry args={[0.65, 1]} />
          <meshBasicMaterial color="#ffbc00" wireframe transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Floating 3D Telemetry Labels using Drei's SDF Text component */}
      <Suspense fallback={null}>
        <group position={[0, 1.0, 0]}>
          <Text
            color="#ffbc00"
            fontSize={0.24}
            font="Courier New"
            anchorX="center"
            anchorY="middle"
            transparent
            opacity={0.85}
          >
            LOSS: 0.003
          </Text>
        </group>
      </Suspense>
      <Suspense fallback={null}>
        <group position={[0, -1.0, 0]}>
          <Text
            color="#00ffc8"
            fontSize={0.24}
            font="Courier New"
            anchorX="center"
            anchorY="middle"
            transparent
            opacity={0.85}
          >
            ACCURACY: 99.4%
          </Text>
        </group>
      </Suspense>

      {/* Input to Output weight lines representing matrix adjustment */}
      {[-1.8, 1.8].map((offset, i) => (
        <group key={i}>
          {/* Node */}
          <mesh position={[offset, 0, 0]} scale={[0.15, 0.15, 0.15]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={i === 0 ? "#00e5ff" : "#c084fc"} />
          </mesh>
          
          {/* Connection */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([offset, 0, 0, 0, 0, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ffbc00" transparent opacity={0.4} />
          </line>
        </group>
      ))}

      <LocalNodeMarker position={[0, 1.8, 0]} onClick={onSelect} color="#ffbc00" />
    </group>
  );
};

// 4. Decision Engine (Path routing split)
const DecisionEngineSector = ({ position, onSelect }) => {
  const signalTimer = useRef(0);
  const [activePath, setActivePath] = useState(0);

  // Generate 3 split path curves, geometries, and end coordinates once
  const { curves, geometries, endPoints } = useMemo(() => {
    const rawPaths = [
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-1.8, 1.0, -1.0), new THREE.Vector3(-3.0, 1.5, -2.0)], // path 0
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.5, -2.0), new THREE.Vector3(0, 0.8, -4.0)],     // path 1
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.8, -1.0, -1.0), new THREE.Vector3(3.0, -1.5, -2.0)] // path 2
    ].map(pts => new THREE.CatmullRomCurve3(pts));

    const geoms = rawPaths.map(curve => {
      const points = curve.getPoints(12);
      return new THREE.BufferGeometry().setFromPoints(points);
    });

    const ends = rawPaths.map(curve => {
      const points = curve.getPoints(12);
      return points[points.length - 1];
    });

    return { curves: rawPaths, geometries: geoms, endPoints: ends };
  }, []);

  useFrame((state, delta) => {
    signalTimer.current += delta * 0.7;
    if (signalTimer.current > 1.0) {
      signalTimer.current = 0;
      // Randomly pick next routing branch
      setActivePath((prev) => (prev + 1) % 3);
    }
  });

  return (
    <group position={position}>
      {/* Synaptic Soma core */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#ff7b00" transparent opacity={0.9} />
      </mesh>

      {/* Render 3 split path conduits */}
      {curves.map((curve, idx) => {
        const lineGeom = geometries[idx];
        const endPoint = endPoints[idx];
        const isActive = activePath === idx;

        return (
          <group key={idx}>
            <line geometry={lineGeom}>
              <lineBasicMaterial
                color="#ff7b00"
                transparent
                opacity={isActive ? 0.6 : 0.15}
                linewidth={isActive ? 2 : 1}
              />
            </line>

            {/* End receiver node */}
            <mesh position={endPoint} scale={[0.18, 0.18, 0.18]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial color={isActive ? "#ff7b00" : "#3f3f46"} />
            </mesh>

            {/* Firing signal traveling along active path */}
            {isActive && (
              <mesh
                position={curve.getPointAt(signalTimer.current)}
                scale={[0.1, 0.1, 0.1]}
              >
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial color="#ffffff" blending={THREE.AdditiveBlending} />
              </mesh>
            )}
          </group>
        );
      })}

      <LocalNodeMarker position={[0, 1.8, 0]} onClick={onSelect} color="#ff7b00" />
    </group>
  );
};

// 5. Consciousness Core Geodesic Deck
const SpaceObservationSector = ({ position, onSelect }) => {
  const domeRef = useRef();

  useFrame((state, delta) => {
    if (domeRef.current) {
      domeRef.current.rotation.y += delta * 0.12;
      domeRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Geodesic sphere surrounding deck */}
      <group ref={domeRef}>
        <mesh>
          <sphereGeometry args={[2.0, 12, 12]} />
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.15} />
        </mesh>
        
        {/* Orbital rings */}
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[2.1, 0.02, 4, 32]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Internal core sphere */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.7} />
      </mesh>

      <LocalNodeMarker position={[0, 1.8, 0]} onClick={onSelect} color="#00e5ff" />
    </group>
  );
};

// 6. Time Freeze Chamber (Frozen thought shards)
const TimeFreezeSector = ({ position, onSelect }) => {
  const { simState } = useSimulation();
  const shardsRef = useRef([]);

  // Generate 15 floating shards
  const shards = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 16; i++) {
      arr.push({
        id: i,
        pos: [
          (Math.random() - 0.5) * 3.5,
          (Math.random() - 0.5) * 2.0 + 0.5,
          (Math.random() - 0.5) * 3.5
        ],
        scale: 0.18 + Math.random() * 0.32,
        rotSpeed: [
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        ],
        floatPhase: Math.random() * Math.PI * 2
      });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    // Completely freeze if state is FREEZE or ENDING
    if (simState === STATES.FREEZE || simState === STATES.ENDING) return;

    const t = state.clock.getElapsedTime();

    shards.forEach((s, idx) => {
      const mesh = shardsRef.current[idx];
      if (mesh) {
        mesh.position.y = s.pos[1] + Math.sin(t * 1.4 + s.floatPhase) * 0.12;
        mesh.rotation.x += delta * s.rotSpeed[0];
        mesh.rotation.y += delta * s.rotSpeed[1];
        mesh.rotation.z += delta * s.rotSpeed[2];
      }
    });
  });

  return (
    <group position={position}>
      {/* Floating Frozen Glass Thought Shards */}
      {shards.map((s, idx) => (
        <mesh
          key={s.id}
          ref={(el) => (shardsRef.current[idx] = el)}
          position={s.pos}
          scale={[s.scale, s.scale, s.scale]}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.0}
            metalness={0.1}
            transmission={0.9}
            thickness={0.4}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      {/* Containment boundary ring */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.4, 2.5, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      <LocalNodeMarker position={[0, 2.0, 0]} onClick={onSelect} color="#ffffff" />
    </group>
  );
};

const Environments = () => {
  const { simState, setSelectedNode } = useSimulation();

  // If in INTRO/GENERATING, hide environments
  if (simState === STATES.INTRO || simState === STATES.GENERATING) return null;

  // Align coordinates with Scene.jsx curves
  const coordinates = [
    [-20, 2, 10],   // 1. Sensory Input Layer Hub
    [15, 3, -8],    // 2. Memory Vault
    [-3, 4, -28],   // 3. Learning Process
    [-18, 2, -48],  // 4. Decision Engine
    [16, 5, -64],   // 5. Consciousness Core Geodesic Deck
    [0, 1.5, -84]   // 6. Time Suspension Chamber
  ];

  return (
    <group>
      <InputLayerSector position={coordinates[0]} onSelect={() => setSelectedNode(0)} />
      <MemoryVaultSector position={coordinates[1]} onSelect={() => setSelectedNode(1)} />
      <LearningProcessSector position={coordinates[2]} onSelect={() => setSelectedNode(2)} />
      <DecisionEngineSector position={coordinates[3]} onSelect={() => setSelectedNode(3)} />
      <SpaceObservationSector position={coordinates[4]} onSelect={() => setSelectedNode(4)} />
      <TimeFreezeSector position={coordinates[5]} onSelect={() => setSelectedNode(5)} />
    </group>
  );
};

export default Environments;
export { LocalNodeMarker };
