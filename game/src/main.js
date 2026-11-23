// Boots Ember Duel: wires the table's buttons and keys, runs the turn flow,
// and stages the ?shot= scenes for screenshots. The game itself lives in
// engine.js (rules), ai.js (the Warden) and render.js (the table); this file
// only connects them to the page.
//
// Controls: click a card to select it, click it again (or press Enter) to
// play it; keys 1-7 select a card in hand; E ends your turn; R restarts
// from an end screen; Enter starts from the title screen. M mutes sound.
import { beginTurn, newGame, playCard } from './engine.js';
import { choosePlay } from './ai.js';
import { flashDamage, hideTitle, render, showOver, showTitle } from './render.js';
import { stageShot } from './shots.js';
import { sfxClick, sfxHurt, sfxLose, sfxPlay, sfxWin, toggleMute } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed')) || 7;

const ui = {
  enemyPanel: document.getElementById('enemy-panel'),
  playerPanel: document.getElementById('player-panel'),
  enemyHand: document.getElementById('enemy-hand'),
  playerHand: document.getElementById('player-hand'),
  endTurn: document.getElementById('end-turn'),
  turnBanner: document.getElementById('turn-banner'),
  log: document.getElementById('log'),
  deckCount: document.getElementById('deck-count'),
  titleScreen: document.getElementById('title-screen'),
  overScreen: document.getElementById('over-screen'),
  overTitle: document.getElementById('over-title'),
  overText: document.getElementById('over-text'),
  overStats: document.getElementById('over-stats'),
  selectedId: null,
  busy: false,
  onPick: null,
  onEndTurn: null,
};

let game = newGame(seed);

function draw() {
  render(game, ui);
  if (game.phase === 'over') showOver(game, ui);
}

function startDuel() {
  game = newGame(seed);
  game.phase = 'play';
  ui.selectedId = null;
  ui.busy = false;
  hideTitle(ui);
  ui.overScreen.classList.add('hidden');
  beginTurn(game, 'player');
  sfxClick();
  draw();
}

function playSelected() {
  if (game.phase !== 'play' || ui.busy || ui.selectedId === null) return;
  const before = game.enemy.life;
  const ok = playCard(game, 'player', ui.selectedId);
  if (!ok) return;
  ui.selectedId = null;
  sfxPlay();
  if (game.enemy.life < before) flashDamage(ui.enemyPanel);
  draw();
  if (game.phase === 'over') {
    if (game.winner === 'player') sfxWin();
    else sfxLose();
  }
}

/** The Warden's turn, one card at a time so the player can follow it. */
function endTurn() {
  if (game.phase !== 'play' || ui.busy) return;
  ui.busy = true;
  ui.selectedId = null;
  draw();
  beginTurn(game, 'enemy');
  const stepDelay = 650;
  function nextStep() {
    if (game.phase === 'over') {
      ui.busy = false;
      draw();
      if (game.winner === 'player') sfxWin();
      else sfxLose();
      return;
    }
    const card = choosePlay(game, false);
    if (!card) {
      game.turn += 1;
      beginTurn(game, 'player');
      ui.busy = false;
      draw();
      return;
    }
    const before = game.player.life;
    playCard(game, 'enemy', card.id);
    draw();
    if (game.player.life < before) {
      flashDamage(ui.playerPanel);
      sfxHurt();
    }
    setTimeout(nextStep, stepDelay);
  }
  setTimeout(nextStep, stepDelay);
}

ui.onPick = (card) => {
  if (game.phase !== 'play' || ui.busy) return;
  if (ui.selectedId === card.id) {
    playSelected();
    return;
  }
  ui.selectedId = card.id;
  sfxClick();
  draw();
};
ui.onEndTurn = endTurn;

ui.endTurn.addEventListener('click', endTurn);
document.getElementById('start-button').addEventListener('click', startDuel);
document.getElementById('again-button').addEventListener('click', startDuel);
document.getElementById('mute-button').addEventListener('click', (event) => {
  const nowMuted = toggleMute();
  event.currentTarget.textContent = nowMuted ? 'SOUND: OFF [M]' : 'SOUND: ON [M]';
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') {
    const nowMuted = toggleMute();
    document.getElementById('mute-button').textContent = nowMuted ? 'SOUND: OFF [M]' : 'SOUND: ON [M]';
    return;
  }
  if (!ui.titleScreen.classList.contains('hidden')) {
    if (event.key === 'Enter') startDuel();
    return;
  }
  if (game.phase === 'over') {
    if (event.key === 'r' || event.key === 'R' || event.key === 'Enter') startDuel();
    return;
  }
  if (event.key === 'e' || event.key === 'E') {
    endTurn();
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    playSelected();
    return;
  }
  const digit = Number(event.key);
  if (digit >= 1 && digit <= game.player.hand.length) {
    const card = game.player.hand[digit - 1];
    ui.selectedId = card.id;
    sfxClick();
    draw();
  }
});

// A ?shot= URL stages a deterministic scene instead of the title screen:
// the screenshots are real renders of the game's own code, mid-duel.
if (shotName) {
  const staged = stageShot(shotName, seed);
  game = staged.game;
  hideTitle(ui);
  if (staged.screen === 'over') {
    draw();
  } else if (staged.screen === 'play') {
    game.phase = 'play';
    draw();
  } else {
    showTitle(ui);
    draw();
  }
} else {
  showTitle(ui);
  draw();
}
