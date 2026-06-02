// Premium high-fidelity Web Audio synthesized sound effects for Star Companion
let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export const toggleMute = () => {
  isMuted = !isMuted;
  return isMuted;
};

export const getMuteState = () => {
  return isMuted;
};

// Play a high-tech sleek chime for general interaction or click
export const playChocClick = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
    
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    console.warn("Audio Context blocked or unsupported:", e);
  }
};

// A joyful double-note diagnostic sweep
export const playChirp = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const oscKey = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscKey.type = "triangle";
    oscKey.frequency.setValueAtTime(523.25, now); // C5
    oscKey.frequency.setValueAtTime(880, now + 0.08); // A5
    oscKey.frequency.exponentialRampToValueAtTime(1318.51, now + 0.2); // E6

    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.setValueAtTime(0.06, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    oscKey.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscKey.start(now);
    oscKey.stop(now + 0.25);
  } catch (e) {
    console.warn(e);
  }
};

// Warm swelling resonance for the central Chest core reaction
export const playCorePulse = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Sub oscillator for deep warm space tone
    const subOsc = ctx.createOscillator();
    const modOsc = ctx.createOscillator();
    const highSparkle = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(110, now); // A2
    subOsc.frequency.linearRampToValueAtTime(220, now + 0.6); // A3

    modOsc.type = "triangle";
    modOsc.frequency.setValueAtTime(440, now);
    modOsc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

    highSparkle.type = "sine";
    highSparkle.frequency.setValueAtTime(1760, now); // high sparkle A6

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.8);

    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.2); // swell in
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8); // melt away

    subOsc.connect(filter);
    modOsc.connect(filter);
    highSparkle.connect(gainNode);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    subOsc.start(now);
    modOsc.start(now);
    highSparkle.start(now);

    subOsc.stop(now + 0.8);
    modOsc.stop(now + 0.8);
    highSparkle.stop(now + 0.3);
  } catch (e) {
    console.warn(e);
  }
};

// Cute computational bubble sound
export const playCompBubble = () => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.setValueAtTime(1200, now + 0.05);
    osc.frequency.setValueAtTime(1800, now + 0.1);

    gainNode.gain.setValueAtTime(0.04, now);
    gainNode.gain.setValueAtTime(0.04, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.warn(e);
  }
};
