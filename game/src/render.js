// Everything the player sees: the table, the hands, the life bars, the mana
// crystals, the log, and the title / victory / defeat screens. No rules live
// here — render() only turns a game state into DOM, so the screenshot scenes
// can stage any state and draw it exactly as a real game would.
import { SUITS, effectLine } from './cards.js';
import { START_LIFE } from './engine.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** One face-up card. `state` is 'playable', 'poor' (unaffordable) or 'idle'. */
export function cardNode(card, state, owner) {
  const suit = SUITS[card.suit];
  const node = el('div', `card ${card.suit} ${state}`);
  node.dataset.id = `${owner}-${card.id}`;
  node.style.setProperty('--suit', suit.color);
  node.style.setProperty('--suit-dark', suit.dark);
  node.appendChild(el('div', 'cost', String(card.cost)));
  node.appendChild(el('div', 'suit-mark', suit.shape));
  node.appendChild(el('div', 'power', String(card.power)));
  node.appendChild(el('div', 'card-name', card.name));
  node.appendChild(el('div', 'effect', effectLine(card)));
  return node;
}

/** One face-down card back for the Warden's hand. */
function cardBackNode() {
  const node = el('div', 'card back');
  node.appendChild(el('div', 'back-mark', '◆'));
  node.appendChild(el('div', 'back-word', 'EMBER'));
  return node;
}

function lifeBar(duelist) {
  const wrap = el('div', 'life-bar');
  const fill = el('div', 'life-fill');
  fill.style.width = `${Math.max(0, (duelist.life / START_LIFE) * 100)}%`;
  if (duelist.life <= 10) fill.classList.add('low');
  wrap.appendChild(fill);
  return wrap;
}

function manaRow(duelist) {
  const row = el('div', 'mana-row');
  for (let i = 0; i < duelist.maxMana; i += 1) {
    row.appendChild(el('div', `mana-crystal${i < duelist.mana ? ' lit' : ''}`, '◆'));
  }
  if (duelist.maxMana === 0) row.appendChild(el('div', 'mana-none', 'no mana yet'));
  return row;
}

function duelistPanel(node, name, duelist, sub) {
  node.replaceChildren();
  const head = el('div', 'duelist-head');
  head.appendChild(el('div', 'duelist-name', name));
  head.appendChild(el('div', 'life-num', `♥ ${Math.max(0, duelist.life)}`));
  if (duelist.block > 0) head.appendChild(el('div', 'block-num', `🛡 ${duelist.block}`));
  node.appendChild(head);
  node.appendChild(lifeBar(duelist));
  node.appendChild(manaRow(duelist));
  node.appendChild(el('div', 'duelist-sub', sub));
}

function renderHand(container, duelist, side, selectedId, onPick) {
  container.replaceChildren();
  if (side === 'enemy') {
    for (let i = 0; i < duelist.hand.length; i += 1) container.appendChild(cardBackNode());
    return;
  }
  duelist.hand.forEach((card, index) => {
    const affordable = card.cost <= duelist.mana;
    const node = cardNode(card, affordable ? 'playable' : 'poor', 'you');
    if (selectedId === card.id) node.classList.add('selected');
    node.title = `${card.name} — ${index + 1} to select, Enter to play`;
    node.addEventListener('click', () => onPick(card));
    container.appendChild(node);
  });
}

/**
 * Draw the whole table for `game`. `ui` carries the live element handles,
 * the selected card id and the callbacks (onPick, onEndTurn). Called after
 * every action; cheap enough to rebuild the hands each time.
 */
export function render(game, ui) {
  duelistPanel(ui.enemyPanel, 'CINDER WARDEN', game.enemy, `${game.enemy.deck.length} cards left · ${game.enemy.hand.length} in hand`);
  duelistPanel(ui.playerPanel, 'EMBER KNIGHT — YOU', game.player, `${game.player.deck.length} cards left · turn ${game.turn}`);
  renderHand(ui.enemyHand, game.enemy, 'enemy');
  renderHand(ui.playerHand, game.player, 'player', ui.selectedId, ui.onPick);
  ui.endTurn.disabled = game.phase !== 'play' || ui.busy;
  ui.endTurn.textContent = game.phase === 'play' ? (ui.busy ? 'WARDEN PLAYING…' : 'END TURN  [E]') : 'END TURN';
  ui.turnBanner.textContent = game.phase === 'play' ? (ui.busy ? "The Warden's turn" : 'Your turn — play a card, then end your turn') : '';
  const log = ui.log;
  log.replaceChildren();
  game.log.slice(-4).forEach((line) => log.appendChild(el('div', 'log-line', line)));
  ui.deckCount.textContent = `Deck: ${game.player.deck.length} · Discard: ${game.player.discard.length}`;
}

/** Flash a duelist's life bar when they take damage. */
export function flashDamage(panel) {
  panel.classList.remove('hurt');
  void panel.offsetWidth;
  panel.classList.add('hurt');
}

export function showTitle(ui) {
  ui.titleScreen.classList.remove('hidden');
  ui.overScreen.classList.add('hidden');
}

export function hideTitle(ui) {
  ui.titleScreen.classList.add('hidden');
}

export function showOver(game, ui) {
  const won = game.winner === 'player';
  ui.overTitle.textContent = won ? 'VICTORY' : 'DEFEAT';
  ui.overTitle.classList.toggle('won', won);
  ui.overTitle.classList.toggle('lost', !won);
  ui.overText.textContent = won
    ? 'The Cinder Warden is extinguished. Your ember burns on.'
    : 'Your ember has gone out. The Warden keeps the table.';
  ui.overStats.textContent = `Turns: ${game.turn} · Cards played: ${game.player.played} · Life left: ${Math.max(0, game.player.life)} · Warden's life: ${Math.max(0, game.enemy.life)}`;
  ui.overScreen.classList.remove('hidden');
}
