// The Cinder Warden's brain: greedy, readable, and counterable. It weighs
// every card it can afford and plays the best one, again and again, until
// it is out of mana or out of plays. Damage comes first when it can end the
// fight, Stone is favoured while you hide behind block, Tide is saved for
// a thin hand, and Leaf only when its life is low or it has nothing better.
import { affordable, playCard } from './engine.js';
import { pick } from './random.js';

function scoreCard(game, card) {
  const me = game.enemy;
  const foe = game.player;
  let score = card.power * 2 - card.cost;
  if (card.suit === 'flame') score += 3;
  if (card.suit === 'stone') score += foe.block > 0 ? 6 : 2;
  if (card.suit === 'tide') score += me.hand.length <= 3 ? 5 : 1;
  if (card.suit === 'leaf') score += me.life <= 12 ? 7 : -2;
  if (foe.life - card.power <= 0 && card.suit !== 'leaf') score += 50;
  return score;
}

/**
 * Pick the Warden's next card, or null when it should stop. `wild` makes it
 * play one random affordable card and then stop (used for the loss
 * screenshot, where the player is meant to fall).
 */
export function choosePlay(game, wild) {
  const options = affordable(game.enemy);
  if (options.length === 0) return null;
  if (wild) return pick(options, game.rng);
  let best = options[0];
  let bestScore = scoreCard(game, best);
  for (let i = 1; i < options.length; i += 1) {
    const score = scoreCard(game, options[i]);
    if (score > bestScore) {
      bestScore = score;
      best = options[i];
    }
  }
  return best;
}

/** Play the Warden's whole turn, returning the cards it played, in order. */
export function playEnemyTurn(game, wild) {
  const played = [];
  for (let guard = 0; guard < 12; guard += 1) {
    if (game.phase === 'over') break;
    const card = choosePlay(game, wild);
    if (!card) break;
    if (!playCard(game, 'enemy', card.id)) break;
    played.push(card);
    if (wild) break;
  }
  return played;
}
