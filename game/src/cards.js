// The cards of Ember Duel. Four suits, told apart by colour AND shape, never
// by text alone: Flame is a red triangle, Tide a blue circle, Leaf a green
// diamond, Stone an amber square. Every card has a cost (the blue gem), a
// power (the big number) and one effect line. Names are original.
import { shuffle } from './random.js';

export const SUITS = {
  flame: { key: 'flame', name: 'Flame', shape: '▲', color: '#d43d2a', dark: '#8f1d10', text: 'Deal damage' },
  tide: { key: 'tide', name: 'Tide', shape: '●', color: '#2470c8', dark: '#123f7d', text: 'Damage + draw 1' },
  leaf: { key: 'leaf', name: 'Leaf', shape: '◆', color: '#2e8b47', dark: '#14532a', text: 'Gain block' },
  stone: { key: 'stone', name: 'Stone', shape: '■', color: '#b97a1a', dark: '#6e4a08', text: 'Damage + shatter' },
};

let nextId = 1;

/** Build one card. `power` is damage for flame/tide/stone, block for leaf. */
export function makeCard(suitKey, name, cost, power) {
  const suit = SUITS[suitKey];
  return { id: nextId, suit: suitKey, name, cost, power, label: suit.text };
}

/**
 * The 24-card duel deck: six cards per suit, in three cost/power pairs.
 * Both duelists draw from an identical list, shuffled by their own stream.
 */
export function buildDeck() {
  nextId = 1;
  const list = [];
  const add = (suit, names, costs, powers) => {
    for (let i = 0; i < names.length; i += 1) list.push(makeCard(suit, names[i], costs[i], powers[i]));
  };
  add('flame', ['Cinder Fang', 'Ember Lash', 'Pyre Claw', 'Ashen Bite', 'Coalbrand', 'Wildspark'], [1, 2, 2, 3, 4, 5], [3, 4, 5, 6, 7, 9]);
  add('tide', ['Tidecaller', 'Rill Runner', 'Moonpool', 'Current Cut', 'Deepwell', 'Stormsurge'], [1, 2, 2, 3, 4, 5], [2, 3, 3, 4, 5, 6]);
  add('leaf', ['Barkwall', 'Thornveil', 'Rootward', 'Mossguard', 'Canopy', 'Ironbark'], [1, 1, 2, 2, 3, 4], [4, 5, 6, 7, 9, 11]);
  add('stone', ['Quakefist', 'Gravelmaw', 'Shatterstone', 'Boulderborn', 'Ridgehammer', 'Avalanche'], [2, 2, 3, 3, 4, 5], [4, 5, 5, 6, 7, 8]);
  return list;
}

/** A fresh shuffled deck for one duelist. */
export function freshDeck(rng) {
  return shuffle(buildDeck(), rng);
}

/** Human-readable one-liner for the card's effect, shown under its name. */
export function effectLine(card) {
  if (card.suit === 'leaf') return `BLOCK ${card.power}`;
  if (card.suit === 'tide') return `DMG ${card.power} · DRAW 1`;
  if (card.suit === 'stone') return `DMG ${card.power} · SHATTER`;
  return `DMG ${card.power}`;
}
