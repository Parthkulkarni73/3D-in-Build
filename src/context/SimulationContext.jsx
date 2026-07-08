import React, { createContext, useContext, useState, useEffect } from 'react';

const SimulationContext = createContext();

export const STATES = {
  INTRO: 'INTRO',
  GENERATING: 'GENERATING',
  ACTIVE: 'ACTIVE',
  FREEZE: 'FREEZE',
  ENDING: 'ENDING'
};

export const ENVIRONMENTS = [
  {
    id: 0,
    name: "The Input Layer",
    coords: "SYNAPTIC_FIRES // LAYER_01",
    description: "The sensory gateway. Tens of thousands of glowing action potentials transmitting raw electrical signals through dendritic channels.",
    systemStatus: "RECEIVING",
    powerGrid: 98.4,
    nodes: ["Dendrite Entry", "Soma Node A", "Impulse Stream"]
  },
  {
    id: 1,
    name: "Memory Vault",
    coords: "KNOWLEDGE_LATTICE // LAYER_02",
    description: "The repositories of synthetic experience. Stored data nodes crystallize into floating glowing lattices containing core intellectual sectors.",
    systemStatus: "STABLE",
    powerGrid: 94.2,
    nodes: ["Artificial Intelligence", "Robotics & Hardware", "Cyber Security", "Quantum & Space"]
  },
  {
    id: 2,
    name: "Learning Process",
    coords: "BACKPROPAGATION // LAYER_03",
    description: "Autonomous neural weight calibration. Synapses dynamically adjust conductance to optimize error functions and reduce network loss.",
    systemStatus: "OPTIMIZING",
    powerGrid: 89.6,
    nodes: ["Weight Adapters", "Loss Optimizer", "Gradient Hub"]
  },
  {
    id: 3,
    name: "Decision Engine",
    coords: "SYNAPTIC_ROUTING // LAYER_04",
    description: "High-level logical routing. Action signals branch into complex threshold paths to evaluate multi-conditional logical vectors.",
    systemStatus: "EVALUATING",
    powerGrid: 82.1,
    nodes: ["Logical Splitter", "Threshold Valve", "Logic Core"]
  },
  {
    id: 4,
    name: "Consciousness Core",
    coords: "COGNITIVE_VERTEX // LAYER_05",
    description: "The zero-point cognitive interface. A massive floating energy core surrounded by rotating rings, symbolizing unified self-awareness.",
    systemStatus: "INTEGRATING",
    powerGrid: 99.9,
    nodes: ["Cognitive Anchor", "Self Vertex", "Mind Ring"]
  },
  {
    id: 5,
    name: "Temporal Suspension",
    coords: "TEMPORAL_HALT // LAYER_06",
    description: "The boundaries of cognitive calculation. System state-time variables are suspended, exposing frozen thought shards.",
    systemStatus: "HALTED",
    powerGrid: 50.0,
    nodes: ["Time Anchor", "Entropy Valve", "Thought Shards"]
  }
];

export const SimulationProvider = ({ children }) => {
  const [simState, setSimState] = useState(STATES.INTRO);
  const [generationProgress, setGenerationProgress] = useState(0.0);
  const [activeEnvironment, setActiveEnvironment] = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Transition from generating to active once progress is complete
  useEffect(() => {
    if (simState === STATES.GENERATING && generationProgress >= 1.0) {
      // Small delay for cinematic effect
      const timer = setTimeout(() => {
        setSimState(STATES.ACTIVE);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [simState, generationProgress]);

  return (
    <SimulationContext.Provider
      value={{
        simState,
        setSimState,
        generationProgress,
        setGenerationProgress,
        activeEnvironment,
        setActiveEnvironment,
        selectedNode,
        setSelectedNode,
        soundEnabled,
        setSoundEnabled,
        environments: ENVIRONMENTS
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
