// Web Audio API Synthesizer - 100% offline, no external audio files required

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Focus Completed: Meditative Singing Bowl / Gong
   * Harmonic frequencies (528Hz Solfeggio + overtones) with warm exponential decay
   */
  playCompletionGong() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Fundamental + harmonic partials for rich bell/gong timbre
      const frequencies = [528, 1056, 1584, 2112];
      const gains = [0.35, 0.15, 0.08, 0.04];
      const decays = [3.5, 2.5, 1.8, 1.2];

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, now);
      masterGain.connect(this.ctx.destination);

      frequencies.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Slight natural detune for warmth
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq + (idx * 1.5), now);

        gain.gain.setValueAtTime(gains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decays[idx] + 0.1);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Subtle tactile click for habit/task checkmark
   */
  playCheckmarkClick() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // Audio might be blocked before first interaction
    }
  }

  /**
   * Celebratory chime when 100% daily charge is reached
   */
  playCelebrationChime() {
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const now = this.ctx.currentTime + (i * 0.1);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.3);
      });
    } catch (e) {
      console.warn('Celebration audio error:', e);
    }
  }
}

export const sound = new SoundSynthesizer();
