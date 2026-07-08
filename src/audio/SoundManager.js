// Web Audio API Synthesizer for THE ARCHITECT'S SIMULATION
// Provides ambient music and high-tech sound effects procedurally.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientNodes = [];
    this.chargeOsc = null;
    this.chargeGain = null;
    this.initialized = false;
    this.enabled = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported in this browser", e);
    }
  }

  enable(enable) {
    this.init();
    if (!this.ctx) return;

    this.enabled = enable;
    if (enable) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.masterGain.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + 1.5);
      this.startAmbient();
    } else {
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
      // Wait for fade out to suspend (optional, just let it fade to 0)
    }
  }

  // Create delay effect for spacing out synth sounds
  createDelayNode(time = 0.4, feedbackVal = 0.45) {
    const delay = this.ctx.createDelay();
    const feedback = this.ctx.createGain();
    
    delay.delayTime.setValueAtTime(time, this.ctx.currentTime);
    feedback.gain.setValueAtTime(feedbackVal, this.ctx.currentTime);
    
    delay.connect(feedback);
    feedback.connect(delay);
    
    return { delay, feedback };
  }

  // Atmospheric Cyber Space Drone
  startAmbient() {
    if (this.ambientNodes.length > 0) return;
    if (!this.ctx || !this.enabled) return;

    const t = this.ctx.currentTime;

    // We'll create two drones: one deep fundamental and one perfect fifth higher
    const frequencies = [65.41, 97.99]; // C2 (deep) and G2 (fifth)
    
    // Create Reverb/Delay simulation
    const { delay, feedback } = this.createDelayNode(0.6, 0.5);
    delay.connect(this.masterGain);
    
    // Deep low pass filter to make it atmospheric
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, t);
    filter.Q.setValueAtTime(1.0, t);
    filter.connect(this.masterGain);
    filter.connect(delay);

    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      
      // Detuned sawtooth + triangle mix
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      
      // Subtle detune LFO (slow pitching up/down for movement)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, t); // very slow
      lfoGain.gain.setValueAtTime(1.5, t); // max detuning cents
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      
      oscGain.gain.setValueAtTime(0, t);
      // Fade in drone
      oscGain.gain.linearRampToValueAtTime(0.12, t + 4);
      
      osc.connect(oscGain);
      oscGain.connect(filter);
      
      osc.start(t);
      lfo.start(t);
      
      this.ambientNodes.push({ osc, lfo, oscGain });
    });

    // Add a high-pitch ambient sparkle LFO sweeps
    this.startSparkles(filter);
  }

  startSparkles(destination) {
    // Background sweeps
    const triggerSweep = () => {
      if (!this.enabled || !this.ctx || this.ambientNodes.length === 0) return;
      
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120 + Math.random() * 200, t);
      // Sweep frequency up
      osc.frequency.exponentialRampToValueAtTime(600 + Math.random() * 800, t + 6);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.03, t + 2);
      gain.gain.linearRampToValueAtTime(0, t + 6);
      
      osc.connect(gain);
      gain.connect(destination);
      
      osc.start(t);
      osc.stop(t + 6.1);
      
      // Schedule next sparkle
      const delayTime = 8000 + Math.random() * 8000;
      this.sparkleTimeout = setTimeout(triggerSweep, delayTime);
    };

    // Delay first sweep
    this.sparkleTimeout = setTimeout(triggerSweep, 3000);
  }

  stopAmbient() {
    const t = this.ctx?.currentTime || 0;
    this.ambientNodes.forEach(node => {
      try {
        node.oscGain.gain.cancelScheduledValues(t);
        node.oscGain.gain.linearRampToValueAtTime(0, t + 0.5);
        setTimeout(() => {
          node.osc.stop();
          node.lfo.stop();
        }, 600);
      } catch (e) {}
    });
    this.ambientNodes = [];
    if (this.sparkleTimeout) {
      clearTimeout(this.sparkleTimeout);
    }
  }

  // Called during IntroCore drag-to-rotate to generate charge sound
  startChargeSound() {
    if (!this.ctx || !this.enabled) return;
    if (this.chargeOsc) return;

    const t = this.ctx.currentTime;
    this.chargeOsc = this.ctx.createOscillator();
    this.chargeGain = this.ctx.createGain();
    
    this.chargeOsc.type = 'sine';
    this.chargeOsc.frequency.setValueAtTime(110, t); // A2 start
    this.chargeGain.gain.setValueAtTime(0.01, t);
    this.chargeGain.gain.linearRampToValueAtTime(0.08, t + 0.5);
    
    // Deep filter
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, t);

    this.chargeOsc.connect(lp);
    lp.connect(this.chargeGain);
    this.chargeGain.connect(this.masterGain);
    
    this.chargeOsc.start(t);
  }

  updateChargeSound(progress) {
    if (!this.ctx || !this.enabled || !this.chargeOsc) return;
    const t = this.ctx.currentTime;
    // Map progress 0-1 to frequency 110Hz to 660Hz (beautiful rising pitch)
    const targetFreq = 110 + progress * 550;
    this.chargeOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
    
    // Add pulsing speed based on progress
    const volumePulse = 0.05 + 0.05 * Math.sin(t * (5 + progress * 15));
    this.chargeGain.gain.setTargetAtTime(volumePulse * 0.8, t, 0.05);
  }

  stopChargeSound() {
    if (!this.chargeOsc) return;
    const t = this.ctx.currentTime;
    try {
      this.chargeGain.gain.cancelScheduledValues(t);
      this.chargeGain.gain.linearRampToValueAtTime(0, t + 0.3);
      const osc = this.chargeOsc;
      setTimeout(() => {
        osc.stop();
      }, 400);
    } catch(e) {}
    this.chargeOsc = null;
    this.chargeGain = null;
  }

  // Futuristic click sound
  playClick() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);
    
    gainNode.gain.setValueAtTime(0.15, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    
    osc.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Subtle tech hover
  playHover() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.setValueAtTime(1000, t + 0.02);
    
    gainNode.gain.setValueAtTime(0.04, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    
    osc.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Power down / freeze sound
  triggerFreeze() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    
    // Play dramatic power-down glissando
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 1.5);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(30, t + 1.2);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(270, t);
    osc2.frequency.linearRampToValueAtTime(45, t + 1.2);
    
    gainNode.gain.setValueAtTime(0.2, t);
    gainNode.gain.linearRampToValueAtTime(0, t + 1.4);
    
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    osc.start(t);
    osc2.start(t);
    osc.stop(t + 1.5);
    osc2.stop(t + 1.5);
    
    // Play a metallic resonant echo representing "time freezing"
    setTimeout(() => {
      this.playFreezeEcho();
    }, 100);
  }

  playFreezeEcho() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    
    const { delay, feedback } = this.createDelayNode(0.3, 0.6);
    delay.connect(this.masterGain);
    
    const noise = this.ctx.createOscillator();
    const noiseGain = this.ctx.createGain();
    noise.type = 'square';
    noise.frequency.setValueAtTime(60, t);
    
    noiseGain.gain.setValueAtTime(0.03, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    noise.connect(noiseGain);
    noiseGain.connect(delay);
    
    noise.start(t);
    noise.stop(t + 0.4);
  }

  // Heavenly galaxy sound
  triggerGalaxy() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    
    // Create rich delay for space sound
    const { delay, feedback } = this.createDelayNode(0.25, 0.6);
    delay.connect(this.masterGain);
    
    // Arpeggiate 4 notes rising (maj 7 chord: C4 - E4 - G4 - B4 - C5)
    const notes = [261.63, 329.63, 392.00, 493.88, 523.25];
    
    notes.forEach((freq, idx) => {
      const timeOffset = idx * 0.15;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + timeOffset);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2.01, t + timeOffset); // shimmering octave
      
      gain.gain.setValueAtTime(0, t + timeOffset);
      gain.gain.linearRampToValueAtTime(0.08, t + timeOffset + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 1.2);
      
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(delay);
      
      osc.start(t + timeOffset);
      osc2.start(t + timeOffset);
      
      osc.stop(t + timeOffset + 1.5);
      osc2.stop(t + timeOffset + 1.5);
    });

    // Sub-bass sweep
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(50, t);
    subOsc.frequency.exponentialRampToValueAtTime(100, t + 2.0);
    
    subGain.gain.setValueAtTime(0.25, t);
    subGain.gain.linearRampToValueAtTime(0, t + 2.0);
    
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    
    subOsc.start(t);
    subOsc.stop(t + 2.1);
  }
}

// Singleton pattern so same audio manager is accessible across components
const soundInstance = new SoundManager();
export default soundInstance;
