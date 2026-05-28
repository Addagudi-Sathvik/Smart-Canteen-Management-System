let audioContext;

/**
 * Short counter-bell chime for new orders (no external file required).
 */
export const playOrderAlert = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    if (!audioContext) {
      audioContext = new Ctx();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const frequencies = [880, 1174.66, 1318.51];

    frequencies.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // Autoplay policies may block until user gesture — fail silently
  }
};
