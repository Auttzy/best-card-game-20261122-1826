// Seeded randomness for Ember Duel: every shuffle and draw comes from one
// mulberry32 stream, so a game started with the same seed always plays out
// the same way. The screenshot scenes rely on that determinism.
export function makeRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle driven by the game's own stream, in place. */
export function shuffle(deck, rng) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const held = deck[i];
    deck[i] = deck[j];
    deck[j] = held;
  }
  return deck;
}

/** Pick a random element of a non-empty array with the game's stream. */
export function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}
