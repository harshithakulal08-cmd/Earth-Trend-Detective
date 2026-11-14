/**
 * Built-in Web Audio API generative space drone & atmospheric soundscape.
 * Generates an ethereal, cinematic soundscape without any external audio asset dependencies.
 */
class GenerativeSoundscape {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();
  }

  public play() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (this.isPlaying) return;

    const now = this.ctx.currentTime;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.18, now + 2.5); // Smooth 2.5s fade in
    this.masterGain.connect(this.ctx.destination);

    // Lowpass filter for deep space warmth
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(280, now);
    this.filter.Q.setValueAtTime(2.5, now);
    this.filter.connect(this.masterGain);

    // LFO for slow atmospheric breathing (0.12 Hz)
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.12, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, now);
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // Deep sub-drone oscillator (55Hz / A1)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = "sawtooth";
    this.osc1.frequency.setValueAtTime(55, now);
    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.5, now);
    this.osc1.connect(osc1Gain);
    osc1Gain.connect(this.filter);
    this.osc1.start();

    // Harmonic fifth drone oscillator (82.5Hz / E2)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = "sine";
    this.osc2.frequency.setValueAtTime(82.4, now);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.65, now);
    this.osc2.connect(osc2Gain);
    osc2Gain.connect(this.filter);
    this.osc2.start();

    this.isPlaying = true;
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    setTimeout(() => {
      try {
        this.osc1?.stop();
        this.osc2?.stop();
        this.lfo?.stop();
        this.osc1?.disconnect();
        this.osc2?.disconnect();
        this.lfo?.disconnect();
      } catch {
        // Safe cleanup
      }
      this.isPlaying = false;
    }, 1900);
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const soundscape = new GenerativeSoundscape();

