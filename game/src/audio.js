// All sound is synthesized with WebAudio — no audio files, no network.
// Every effect is a short oscillator blip; the context is created lazily
// on the first user gesture, so headless screenshots stay silent and safe.
let context = null;
let muted = false;

function ensure() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  } catch {
    return null;
  }
  return context;
}

function blip(freq, seconds, type, gain) {
  if (muted) return;
  const ctx = ensure();
  if (!ctx || ctx.state === 'suspended') return;
  try {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  } catch {
    // Sound is garnish; a failure here must never break the game.
  }
}

export function sfxClick() {
  blip(660, 0.06, 'sine', 0.08);
}

export function sfxPlay() {
  blip(440, 0.09, 'triangle', 0.12);
  setTimeout(() => blip(587, 0.1, 'triangle', 0.1), 60);
}

export function sfxHurt() {
  blip(140, 0.18, 'sawtooth', 0.12);
}

export function sfxWin() {
  [523, 659, 784, 1047].forEach((freq, i) => setTimeout(() => blip(freq, 0.22, 'triangle', 0.12), i * 110));
}

export function sfxLose() {
  [392, 330, 262, 196].forEach((freq, i) => setTimeout(() => blip(freq, 0.25, 'sine', 0.1), i * 130));
}

export function toggleMute() {
  muted = !muted;
  return muted;
}
