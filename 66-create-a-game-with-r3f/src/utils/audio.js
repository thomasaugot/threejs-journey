// Lightweight procedural sound effects using the Web Audio API.
// No asset files needed — tones are synthesized on the fly.

let ctx;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Browsers suspend audio until a user gesture; resume on first use.
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq, type = "sine", duration = 0.15, gain = 0.15, slideTo }) {
  const audio = getCtx();
  const osc = audio.createOscillator();
  const env = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(
      slideTo,
      audio.currentTime + duration,
    );
  }

  env.gain.setValueAtTime(gain, audio.currentTime);
  env.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);

  osc.connect(env);
  env.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

export function playJump() {
  tone({ freq: 320, slideTo: 620, type: "triangle", duration: 0.18, gain: 0.12 });
}

export function playWin() {
  // Quick ascending arpeggio for the celebration.
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(
      () => tone({ freq, type: "sine", duration: 0.22, gain: 0.13 }),
      i * 90,
    );
  });
}

/* ------------------------------------------------------------------ *
 * Rolling sound — continuous filtered noise whose volume + brightness
 * track the marble's speed. Call setRollSpeed(speed) every frame.
 * ------------------------------------------------------------------ */
let roll = null;

function ensureRoll() {
  if (roll) return roll;
  const audio = getCtx();

  // White-noise buffer source, looped.
  const bufferSize = audio.sampleRate * 2;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = audio.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;

  const gain = audio.createGain();
  gain.gain.value = 0;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  src.start();

  roll = { gain, filter };
  return roll;
}

export function setRollSpeed(speed) {
  const r = ensureRoll();
  const audio = getCtx();
  const t = audio.currentTime;
  // Map speed (~0..6) to a gentle volume and filter cutoff.
  const v = Math.min(speed / 6, 1);
  r.gain.gain.setTargetAtTime(v * 0.06, t, 0.1);
  r.filter.frequency.setTargetAtTime(300 + v * 1200, t, 0.1);
}

export function stopRoll() {
  if (!roll) return;
  const audio = getCtx();
  roll.gain.gain.setTargetAtTime(0, audio.currentTime, 0.1);
}

/* ------------------------------------------------------------------ *
 * Background music — a slow looping arpeggio pad. Procedural, no files.
 * ------------------------------------------------------------------ */
let music = null;

export function startMusic() {
  if (music) return;
  const audio = getCtx();

  const master = audio.createGain();
  master.gain.value = 0.05;
  master.connect(audio.destination);

  // A minor-ish pad: loop through these notes, one every ~0.5s.
  const scale = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63];
  let step = 0;

  const interval = setInterval(() => {
    if (audio.state === "suspended") return;
    const freq = scale[step % scale.length];
    step++;

    const osc = audio.createOscillator();
    const osc2 = audio.createOscillator();
    const env = audio.createGain();
    osc.type = "sine";
    osc2.type = "triangle";
    osc.frequency.value = freq;
    osc2.frequency.value = freq * 2.001; // slight detune shimmer

    const now = audio.currentTime;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.5, now + 0.15);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc.connect(env);
    osc2.connect(env);
    env.connect(master);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 1.7);
    osc2.stop(now + 1.7);
  }, 500);

  music = { interval, master };
}

export function stopMusic() {
  if (!music) return;
  clearInterval(music.interval);
  music = null;
}
