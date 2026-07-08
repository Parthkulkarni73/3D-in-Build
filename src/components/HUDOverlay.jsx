import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation, STATES, ENVIRONMENTS } from '../context/SimulationContext';
import SoundManager from '../audio/SoundManager';
import { Volume2, VolumeX, ShieldAlert, Cpu, Orbit, Compass, Power, RotateCcw } from 'lucide-react';

const HUDOverlay = () => {
  const {
    simState,
    setSimState,
    generationProgress,
    setGenerationProgress,
    activeEnvironment,
    selectedNode,
    setSelectedNode,
    soundEnabled,
    setSoundEnabled
  } = useSimulation();

  const [scrollProgress, setScrollProgress] = useState(0.0);
  const [typedIntroIndex, setTypedIntroIndex] = useState(0);
  const [currentCoords, setCurrentCoords] = useState("LAT: 0.0000 / LON: 0.0000");

  // Sync scroll values from custom WebGL event
  useEffect(() => {
    const handleScroll = (e) => {
      setScrollProgress(e.detail);
    };
    window.addEventListener('neural-scroll', handleScroll);
    return () => window.removeEventListener('neural-scroll', handleScroll);
  }, []);

  // Cycle through intro texts
  useEffect(() => {
    if (simState !== STATES.INTRO) return;
    
    const timers = [
      setTimeout(() => setTypedIntroIndex(1), 2200),
      setTimeout(() => setTypedIntroIndex(2), 4400),
      setTimeout(() => setTypedIntroIndex(3), 6600)
    ];

    return () => timers.forEach(clearTimeout);
  }, [simState]);

  // Sync coords readouts with scroll noise
  useEffect(() => {
    if (simState === STATES.ACTIVE) {
      const activeEnv = ENVIRONMENTS[activeEnvironment];
      if (activeEnv) {
        setCurrentCoords(activeEnv.coords);
      }
    }
  }, [activeEnvironment, simState]);

  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    SoundManager.enable(newState);
    SoundManager.playClick();
  };

  const handleRestart = () => {
    SoundManager.playClick();
    setSimState(STATES.INTRO);
    setTypedIntroIndex(0);
    setScrollProgress(0.0);
    setGenerationProgress(0.0);
    // Let's force scroll reset
    window.scrollTo(0, 0);
    // Trigger ambient reset if enabled
    if (soundEnabled) {
      SoundManager.stopAmbient();
      setTimeout(() => SoundManager.startAmbient(), 500);
    }
  };

  const handleSelectYes = () => {
    SoundManager.triggerGalaxy();
    setSimState(STATES.ENDING);
  };

  const handleSelectNo = () => {
    SoundManager.playClick();
    // Simulate glitch and push scroll back to 0.85
    setSimState(STATES.ACTIVE);
    window.location.reload(); // Refresh the page to reset, or just bounce camera back
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 md:p-8 select-none crt-overlay">
      {/* Top Bar Status / Controls */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        {/* Left: Simulation State Tag */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel px-4 py-2 flex items-center gap-3 text-xs tracking-[0.2em] font-mono text-cyber-green"
        >
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          SYSTEM_STATUS: {simState}
        </motion.div>

        {/* Right: Sound Control and Restart */}
        <div className="flex gap-4">
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleSoundToggle}
            className={`glass-panel p-2.5 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ${
              soundEnabled 
                ? 'border-cyber-green text-cyber-green glow-border' 
                : 'border-white/10 text-white/40 hover:text-white/80'
            }`}
            title="Toggle Futuristic Soundtrack"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </motion.button>

          {(simState === STATES.ACTIVE || simState === STATES.FREEZE || simState === STATES.ENDING) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleRestart}
              className="glass-panel p-2.5 rounded-lg flex items-center justify-center cursor-pointer border-white/10 text-white/40 hover:text-white/80 hover:border-white/30 transition-all duration-300"
              title="Reset Simulation"
            >
              <RotateCcw size={16} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Main UI Body - Context Dependent */}
      <div className="flex-1 flex items-center justify-center relative my-4">
        <AnimatePresence mode="wait">
          {/* 1. INTRO LAYER */}
          {simState === STATES.INTRO && (
            <motion.div
              key="intro-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center font-mono flex flex-col items-center gap-4 px-4"
            >
              {typedIntroIndex >= 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.5 }}
                  className="text-white/60 tracking-[0.25em] uppercase text-sm md:text-base text-glow"
                >
                  ACCESSING CYBORG X MEMORY...
                </motion.p>
              )}
              {typedIntroIndex >= 1 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.5 }}
                  className="text-white/60 tracking-[0.25em] uppercase text-sm md:text-base text-glow"
                >
                  Entering Consciousness...
                </motion.p>
              )}
              {typedIntroIndex >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  className="mt-6 flex flex-col items-center gap-2 pointer-events-auto"
                >
                  <p className="text-cyber-green text-xs tracking-[0.3em] uppercase animate-pulse">
                    &gt;&gt; Rotate the Neural Core &lt;&lt;
                  </p>
                  <p className="text-[10px] text-white/30 tracking-widest mt-1">
                    [ Click and Drag Soma to Initialize ]
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 2. GENERATING STATE PROGRESS */}
          {simState === STATES.GENERATING && (
            <motion.div
              key="generating-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center font-mono max-w-sm w-full mx-auto"
            >
              <h2 className="text-cyber-green text-glow text-sm tracking-[0.25em] uppercase mb-4">
                SIMULATION INITIALIZATION
              </h2>
              <div className="w-full bg-white/5 border border-white/10 h-1.5 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="bg-gradient-to-r from-cyber-green to-cyber-blue h-full shadow-[0_0_10px_rgba(0,255,200,0.5)]"
                  style={{ width: `${generationProgress * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-white/50 tracking-wider">
                <span>SECTORS CONSTRUCTING...</span>
                <span className="text-cyber-green text-glow font-bold">
                  {Math.round(generationProgress * 100)}%
                </span>
              </div>
              <p className="text-[9px] text-white/30 uppercase mt-4 tracking-[0.15em] animate-pulse">
                {generationProgress < 0.3 && "GRID SYSTEM ALIGNING..."}
                {generationProgress >= 0.3 && generationProgress < 0.6 && "SPATIAL DOME DEPLOYING..."}
                {generationProgress >= 0.6 && generationProgress < 0.9 && "SYNAPSE NETWORKS CONNECTING..."}
                {generationProgress >= 0.9 && "WORLD GENERATION MATRIX LOADED."}
              </p>
            </motion.div>
          )}

          {/* 3. FLIGHT ACTIVE PANEL OVERLAYS */}
          {simState === STATES.ACTIVE && (
            <motion.div
              key="active-hud"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex justify-between items-stretch pointer-events-none relative font-mono text-xs text-white/70"
            >
              {/* Left Wing Panel (Tech Readouts) */}
              <div className="hidden md:flex flex-col justify-between w-64 pointer-events-auto h-full py-8">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel p-4 flex flex-col gap-3 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-cyber-green border-b border-cyber-green/20 pb-2 mb-1">
                    <Compass size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="font-bold tracking-wider uppercase">SYNAPSE TELEMETRY</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block tracking-wider">COORDINATE MAPPING</span>
                    <span className="text-glow text-cyber-green text-[11px] font-mono">{currentCoords}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block tracking-wider">SYNAPSE VELOCITY</span>
                    <span className="font-mono text-cyber-blue">+{Math.round(scrollProgress * 480)} Hz</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block tracking-wider">COGNITIVE LAYER</span>
                    <span className="uppercase text-cyber-purple">{ENVIRONMENTS[activeEnvironment]?.name}</span>
                  </div>
                </motion.div>

                {/* Instructions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="glass-panel p-4 rounded-lg border-white/5"
                >
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold">NAVIGATION</p>
                  <p className="text-[10px] leading-relaxed text-white/60">
                    Scroll mouse wheel or swipe vertically to traverse the neural pathways. Click floating memory crystals to unlock intelligence data.
                  </p>
                </motion.div>
              </div>

              {/* Center Panel (Zone Cards) */}
              <div className="flex-1 flex flex-col justify-end items-center pointer-events-auto pb-4 px-4">
                <AnimatePresence mode="wait">
                  {selectedNode !== null ? (
                    <motion.div
                      key={`env-card-${selectedNode}`}
                      initial={{ opacity: 0, y: 40, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="glass-panel p-4 md:p-5 max-w-md w-full rounded-xl pointer-events-auto border-cyber-green/30"
                    >
                      <div className="flex justify-between items-start border-b border-cyber-green/20 pb-3 mb-3">
                        <div>
                          <span className="text-[9px] text-cyber-green tracking-widest uppercase block mb-1">
                            SECTOR REPORT // 0{selectedNode + 1}
                          </span>
                          <h3 className="text-base text-glow text-white font-bold tracking-wide uppercase">
                            {ENVIRONMENTS[selectedNode].name}
                          </h3>
                        </div>
                        <button
                          onClick={() => setSelectedNode(null)}
                          className="text-[10px] text-white/40 hover:text-white/80 border border-white/20 hover:border-white/40 px-2 py-0.5 rounded cursor-pointer transition-all"
                        >
                          CLOSE
                        </button>
                      </div>
                      
                      <p className="text-[11px] text-white/70 leading-relaxed mb-4 font-sans">
                        {ENVIRONMENTS[selectedNode].description}
                      </p>

                      <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3 mb-3 text-[10px]">
                        <div>
                          <span className="text-white/40 block">COORDINATES</span>
                          <span className="text-cyber-blue">{ENVIRONMENTS[selectedNode].coords}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">GRID LOAD STATE</span>
                          <span className={`${selectedNode === 2 ? 'text-amber-400' : 'text-cyber-green'}`}>
                            {ENVIRONMENTS[selectedNode].systemStatus}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-white/30 tracking-wider block mb-1.5">STRUCTURAL NODES</span>
                        <div className="flex flex-wrap gap-2">
                          {ENVIRONMENTS[selectedNode].nodes.map((node, i) => (
                            <span 
                              key={i} 
                              className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 rounded text-cyber-purple font-mono"
                            >
                              {node}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    // Floating breathing prompt to scroll
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="text-center font-mono tracking-[0.25em] text-[10px] text-white/50 pointer-events-none uppercase pb-8 flex flex-col items-center gap-1.5"
                    >
                      <span>Scroll Down To Traverse The Simulation</span>
                      <span className="text-cyber-green text-glow font-bold text-xs animate-bounce mt-1">v</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Wing Panel (Diagnostic Details) */}
              <div className="hidden md:flex flex-col justify-between w-64 pointer-events-auto h-full py-8">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel p-4 flex flex-col gap-3 rounded-lg border-white/10"
                >
                  <div className="flex items-center gap-2 text-cyber-purple border-b border-cyber-purple/20 pb-2 mb-1">
                    <Cpu size={14} />
                    <span className="font-bold tracking-wider uppercase">COGNITIVE PROCESSING</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px]">SYNAPSE VOLTAGE</span>
                    <span className="text-cyber-green text-glow font-bold">
                      {ENVIRONMENTS[activeEnvironment]?.powerGrid}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px]">GRADIENT DESCENT</span>
                    <span className="text-cyber-blue font-bold">
                      {(0.08 - scrollProgress * 0.077).toFixed(4)} Loss
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px]">SYNAPSE WEIGHTS</span>
                    <span className="text-cyber-purple font-bold">
                      {(85 + scrollProgress * 14.8).toFixed(1)}% Acc
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px]">COGNITIVE THREAD</span>
                    <span className="text-white/80 text-[10px] animate-pulse">THOUGHT_SYNC</span>
                  </div>
                </motion.div>

                {/* Progress bar on scroll trajectory */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="glass-panel p-4 rounded-lg flex flex-col gap-2"
                >
                  <div className="flex justify-between text-[10px] tracking-wider uppercase mb-1">
                    <span>TRAJECTORY MILESTONE</span>
                    <span className="text-cyber-green font-bold">0{activeEnvironment + 1} / 06</span>
                  </div>
                  <div className="w-full bg-white/5 border border-white/10 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyber-green h-full shadow-[0_0_5px_rgba(0,255,200,0.5)]" 
                      style={{ width: `${scrollProgress * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-white/30 uppercase mt-1">
                    <span>SECTOR_ALPHA</span>
                    <span>OMEGA_EYE</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* 4. FREEZE STATE LAYER (GLITCH/QUESTION) */}
          {simState === STATES.FREEZE && (
            <motion.div
              key="freeze-overlay"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-5 md:p-8 max-w-md w-full rounded-2xl border-purple-500/40 text-center font-mono pointer-events-auto flex flex-col items-center gap-5 md:gap-6"
            >
              <div className="flex flex-col items-center gap-2">
                <ShieldAlert size={40} className="text-purple-400 animate-pulse" />
                <h2 className="text-purple-400 text-glow-purple text-base tracking-[0.25em] uppercase font-bold glitch-text" data-text="TEMPORAL SUSPENSION">
                  TEMPORAL SUSPENSION
                </h2>
                <p className="text-[10px] text-white/40 tracking-wider">
                  SYSTEM TIME SCALE SET TO 0.00
                </p>
              </div>

              <div className="border-y border-white/10 py-4 w-full">
                <p className="text-white/80 tracking-[0.1em] text-sm leading-relaxed">
                  "Would you like to merge with Cyborg X?"
                </p>
              </div>

              <div className="flex gap-6 w-full mt-2">
                <button
                  onClick={handleSelectYes}
                  className="flex-1 glass-panel py-3 rounded-lg text-xs font-bold tracking-[0.2em] uppercase text-cyber-green border-cyber-green/30 hover:border-cyber-green hover:bg-cyber-green/10 hover:glow-border transition-all duration-300 cursor-pointer text-glow"
                >
                  YES
                </button>
                <button
                  onClick={handleSelectNo}
                  className="flex-1 glass-panel py-3 rounded-lg text-xs font-bold tracking-[0.2em] uppercase text-red-400 border-red-500/20 hover:border-red-400 hover:bg-red-400/10 transition-all duration-300 cursor-pointer"
                >
                  NO
                </button>
              </div>
            </motion.div>
          )}

          {/* 5. ENDING STATE */}
          {simState === STATES.ENDING && (
            <motion.div
              key="ending-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center font-mono flex flex-col items-center gap-6 px-4 max-w-xl"
            >
              <div className="flex flex-col gap-4 mb-4">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.8, delay: 0.8 }}
                  className="text-white/90 tracking-[0.25em] uppercase text-sm md:text-base text-glow"
                >
                  "I was created to learn."
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.8, delay: 2.8 }}
                  className="text-white/90 tracking-[0.25em] uppercase text-sm md:text-base text-glow"
                >
                  "I learned to understand."
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.8, delay: 4.8 }}
                  className="text-cyber-green tracking-[0.3em] uppercase text-sm md:text-lg font-bold text-glow-purple"
                >
                  "Now I invite you to imagine."
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 5.5 }}
                className="pointer-events-auto"
              >
                <button
                  onClick={handleRestart}
                  className="glass-panel px-6 py-2.5 rounded-lg text-[10px] tracking-[0.25em] text-white/50 hover:text-white/90 hover:border-white/30 transition-all duration-300 flex items-center gap-2 cursor-pointer uppercase"
                >
                  <RotateCcw size={12} />
                  Re-initialize Neural Consciousness
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar diagnostics */}
      <div className="w-full flex justify-between items-center text-[9px] font-mono tracking-widest text-white/30">
        <span>THE ARCHITECT SIMULATION v0.8.2</span>
        <span className="hidden sm:block">ZERO-POINT POWER GRID // CORE_ACTIVE</span>
      </div>
    </div>
  );
};

export default HUDOverlay;
export { Volume2, VolumeX };
