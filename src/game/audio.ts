let ctx: AudioContext | null = null;
let engOsc: OscillatorNode | null = null;
let engGain: GainNode | null = null;

export function initAudio() {
  if (ctx) return;
  ctx = new AudioContext();
  engOsc = ctx.createOscillator();
  engOsc.type = "sawtooth";
  engGain = ctx.createGain();
  engGain.gain.value = 0.02;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 500;
  engOsc.connect(lp).connect(engGain).connect(ctx.destination);
  engOsc.start();
  // creepy drone
  const d = ctx.createOscillator();
  d.frequency.value = 55;
  const d2 = ctx.createOscillator();
  d2.frequency.value = 58.3;
  const dg = ctx.createGain();
  dg.gain.value = 0.04;
  d.connect(dg);
  d2.connect(dg);
  dg.connect(ctx.destination);
  d.start();
  d2.start();
}

export function setEngine(speed: number) {
  if (!ctx || !engOsc || !engGain) return;
  const s = Math.abs(speed);
  engOsc.frequency.setTargetAtTime(45 + s * 6, ctx.currentTime, 0.1);
  engGain.gain.setTargetAtTime(0.015 + s * 0.002, ctx.currentTime, 0.1);
}

export function scream() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const len = 1.2;
  const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 3;
  bp.frequency.setValueAtTime(2500, t);
  bp.frequency.exponentialRampToValueAtTime(700, t + len);
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(1100, t);
  osc.frequency.exponentialRampToValueAtTime(320, t + len);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 28;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 90;
  lfo.connect(lfoG).connect(osc.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  noise.connect(bp).connect(g);
  osc.connect(g);
  g.connect(ctx.destination);
  noise.start(t);
  osc.start(t);
  lfo.start(t);
  noise.stop(t + len);
  osc.stop(t + len);
  lfo.stop(t + len);
}

export function thud() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(30, t + 0.3);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.4);
}

export function ding() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [660, 622, 440].forEach((f, i) => {
    const o = ctx!.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0.15, t + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.3);
    o.connect(g).connect(ctx!.destination);
    o.start(t + i * 0.15);
    o.stop(t + i * 0.15 + 0.35);
  });
}
