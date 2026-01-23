const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export const playSound = (freq, type = 'square', duration = 0.1) => {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
};

// Exemplos de sons
export const fx = {
  shoot: () => playSound(880, 'square', 0.1),
  hit: () => playSound(110, 'sawtooth', 0.2),
  powerup: () => playSound(1200, 'sine', 0.3),
  explode: () => playSound(60, 'square', 0.4)
};