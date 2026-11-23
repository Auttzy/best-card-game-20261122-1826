// The rules of Ember Duel, with no DOM in them: a pure state machine the
// browser, the screenshot scenes and a headless test can all drive.
//
// A duel: you (the Ember Knight) against the Cinder Warden. Both start at
// 30 life with a 24-card deck. On your turn you gain mana equal to the turn
// number (capped at 10), draw a card, then play as many cards as you can
// afford. A card's cost is spent from mana; its suit decides the effect:
// Flame deals its power as damage, Tide deals damage and draws a card,
// Leaf gains block equal to its power, Stone deals damage and shatters
// (removes all of the enemy's block first). Block absorbs damage until it
// is used up. Drawing from an empty deck costs 2 life (fatigue). The first
// duelist at 0 life loses.
import { freshDeck } from './cards.js';
import { makeRng } from './random.js';

export const START_LIFE = 30;
export const MAX_HAND = 7;
export const MAX_MANA = 10;
export const FATIGUE = 2;

export function newDuelist(deck) {
  return { life: START_LIFE, block: 0, mana: 0, maxMana: 0, deck, hand: [], discard: [], played: 0 };
}

export function newGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    turn: 1,
    phase: 'title',
    winner: null,
    log: ['The duel begins. Thirty life each — spend your embers well.'],
    player: newDuelist(freshDeck(rng)),
    enemy: newDuelist(freshDeck(rng)),
  };
  dealOpeningHand(game.player, rng);
  dealOpeningHand(game.enemy, rng);
  return game;
}

function dealOpeningHand(duelist, rng) {
  for (let i = 0; i < 3; i += 1) drawCard(duelist, rng);
}

export function drawCard(duelist, rng) {
  if (duelist.deck.length === 0) {
    duelist.life -= FATIGUE;
    return { fatigued: true };
  }
  const card = duelist.deck.pop();
  if (duelist.hand.length >= MAX_HAND) {
    duelist.discard.push(card);
    return { burned: true, card };
  }
  duelist.hand.push(card);
  return { card };
}

/** Start a side's turn: mana grows by one (cap 10), refills, draw a card. */
export function beginTurn(game, side) {
  const duelist = side === 'player' ? game.player : game.enemy;
  duelist.maxMana = Math.min(MAX_MANA, duelist.maxMana + 1);
  duelist.mana = duelist.maxMana;
  const drawn = drawCard(duelist, game.rng);
  if (drawn.fatigued) {
    game.log.push(`${side === 'player' ? 'You' : 'The Warden'} run dry — fatigue bites for ${FATIGUE}.`);
  }
  return drawn;
}

/** Damage after block: block absorbs first, the rest hits life. Returns damage dealt to life. */
export function dealDamage(target, amount) {
  let left = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, left);
    target.block -= absorbed;
    left -= absorbed;
  }
  target.life -= left;
  return left;
}

/** Play one card from a side's hand. Returns false when it cannot be played. */
export function playCard(game, side, cardId) {
  const me = side === 'player' ? game.player : game.enemy;
  const foe = side === 'player' ? game.enemy : game.player;
  const index = me.hand.findIndex((card) => card.id === cardId);
  if (index === -1) return false;
  const card = me.hand[index];
  if (card.cost > me.mana) return false;
  me.hand.splice(index, 1);
  me.mana -= card.cost;
  me.played += 1;
  me.discard.push(card);
  const who = side === 'player' ? 'You play' : 'The Warden plays';
  if (card.suit === 'leaf') {
    me.block += card.power;
    game.log.push(`${who} ${card.name} — block +${card.power}.`);
  } else {
    if (card.suit === 'stone' && foe.block > 0) {
      game.log.push(`${who} ${card.name} — shatters ${foe.block} block!`);
      foe.block = 0;
    }
    const dealt = dealDamage(foe, card.power);
    game.log.push(`${who} ${card.name} — ${card.power} damage${dealt < card.power ? ` (${card.power - dealt} blocked)` : ''}.`);
    if (card.suit === 'tide') {
      drawCard(me, game.rng);
      game.log.push(`${side === 'player' ? 'You draw' : 'The Warden draws'} a card from the Tide.`);
    }
  }
  checkEnd(game);
  return true;
}

function checkEnd(game) {
  if (game.phase === 'over') return;
  if (game.enemy.life <= 0 && game.player.life <= 0) {
    game.winner = game.player.life >= game.enemy.life ? 'player' : 'enemy';
  } else if (game.enemy.life <= 0) {
    game.winner = 'player';
  } else if (game.player.life <= 0) {
    game.winner = 'enemy';
  }
  if (game.winner) {
    game.phase = 'over';
    game.log.push(game.winner === 'player' ? 'The Cinder Warden is extinguished. Victory!' : 'Your ember has gone out.');
  }
}

/** Cards this side can afford right now, in hand order. */
export function affordable(duelist) {
  return duelist.hand.filter((card) => card.cost <= duelist.mana);
}
