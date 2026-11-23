// The screenshot scenes behind ?shot=title|table|win|loss. Each one plays
// the real rules forward from a fresh game, steered by a simple autopilot,
// so every frame is what a genuine game looks like — and the same seed
// always gives the same frame. The title scene shows the title screen, the
// table scene stops mid-duel, and the win/loss scenes play until one side
// falls (the player plays greedily and the Warden wildly for a win, and
// the other way round for a loss).
import { affordable, beginTurn, newGame, playCard } from './engine.js';
import { playEnemyTurn } from './ai.js';
import { pick } from './random.js';

const MAX_TURNS = 60;

/** Score a card the way a sensible player would: damage first, then draw, then block. */
function scoreForPlayer(game, card) {
  let score = card.power * 2 - card.cost;
  if (card.suit === 'flame') score += 3;
  if (card.suit === 'stone') score += game.enemy.block > 0 ? 6 : 2;
  if (card.suit === 'tide') score += game.player.hand.length <= 3 ? 5 : 1;
  if (card.suit === 'leaf') score += game.player.life <= 12 ? 7 : -2;
  if (game.enemy.life - card.power <= 0 && card.suit !== 'leaf') score += 50;
  return score;
}

/** Play every card a side can sensibly afford, best first. */
function greedySide(game, side) {
  const me = side === 'player' ? game.player : game.enemy;
  for (let guard = 0; guard < 12; guard += 1) {
    if (game.phase === 'over') return;
    const options = affordable(me);
    if (options.length === 0) return;
    let best = options[0];
    let bestScore = scoreForPlayer(game, best);
    for (let i = 1; i < options.length; i += 1) {
      const score = scoreForPlayer(game, options[i]);
      if (score > bestScore) {
        bestScore = score;
        best = options[i];
      }
    }
    if (!playCard(game, side, best.id)) return;
  }
}

/** Play one random affordable card and stop (the losing side's pilot). */
function wildSide(game, side) {
  const me = side === 'player' ? game.player : game.enemy;
  const options = affordable(me);
  if (options.length === 0) return;
  playCard(game, side, pick(options, game.rng).id);
}

/** One full round: your turn, then the Warden's. Returns false when the duel ends. */
function playRound(game, playerWild, enemyWild) {
  beginTurn(game, 'player');
  if (playerWild) wildSide(game, 'player');
  else greedySide(game, 'player');
  if (game.phase === 'over') return false;
  beginTurn(game, 'enemy');
  if (enemyWild) {
    const played = playEnemyTurn(game, true);
    void played;
  } else {
    playEnemyTurn(game, false);
  }
  if (game.phase === 'over') return false;
  game.turn += 1;
  return true;
}

/**
 * Set up the named scene and return the screen to draw over it:
 * 'title' for the title screen, 'play' for a mid-duel table, 'over' for an
 * end screen. Any other name is the title.
 */
export function stageShot(name, seed) {
  const game = newGame(seed);
  if (name === 'table') {
    game.phase = 'play';
    for (let round = 0; round < 4; round += 1) {
      if (!playRound(game, false, false)) break;
    }
    if (game.phase !== 'over') beginTurn(game, 'player');
    return { game, screen: game.phase === 'over' ? 'over' : 'play' };
  }
  if (name === 'win') {
    game.phase = 'play';
    for (let round = 0; round < MAX_TURNS; round += 1) {
      if (!playRound(game, false, true)) break;
    }
    return { game, screen: 'over' };
  }
  if (name === 'loss') {
    game.phase = 'play';
    for (let round = 0; round < MAX_TURNS; round += 1) {
      if (!playRound(game, true, false)) break;
    }
    return { game, screen: 'over' };
  }
  return { game, screen: 'title' };
}
