const COLORS = ["red", "yellow", "green", "blue"];

function shuffle(list) {
  const cards = list.slice();
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function makeDeck() {
  const cards = [];
  let n = 0;
  const id = () => `c${n++}`;
  for (const color of COLORS) {
    cards.push({ id: id(), color, kind: "num", value: 0 });
    for (let value = 1; value <= 9; value += 1) {
      cards.push({ id: id(), color, kind: "num", value });
      cards.push({ id: id(), color, kind: "num", value });
    }
    for (const kind of ["skip", "reverse", "draw2"]) {
      cards.push({ id: id(), color, kind });
      cards.push({ id: id(), color, kind });
    }
  }
  for (let i = 0; i < 4; i += 1) {
    cards.push({ id: id(), color: "wild", kind: "wild" });
    cards.push({ id: id(), color: "wild", kind: "wild4" });
  }
  return shuffle(cards);
}

function clone(state) {
  return {
    ...state,
    hands: [state.hands[0].slice(), state.hands[1].slice()],
    deck: state.deck.slice(),
    discard: state.discard.slice(),
    uno: state.uno.slice(),
    pending: state.pending ? { ...state.pending } : null,
    last: state.last ? { ...state.last } : null,
  };
}

function top(state) {
  return state.discard[state.discard.length - 1] || null;
}

function matches(card, discardTop, currentColor) {
  if (card.kind === "wild" || card.kind === "wild4") return true;
  if (currentColor && card.color === currentColor) return true;
  if (!discardTop) return false;
  if (card.kind === "num" && discardTop.kind === "num" && card.value === discardTop.value) return true;
  if (card.kind !== "num" && card.kind === discardTop.kind) return true;
  return false;
}

function hasColor(hand, color) {
  return hand.some((card) => card.color === color);
}

function label(card) {
  if (!card) return "";
  if (card.kind === "num") return `${card.color} ${card.value}`;
  if (card.kind === "skip") return `${card.color} skip`;
  if (card.kind === "reverse") return `${card.color} reverse`;
  if (card.kind === "draw2") return `${card.color} +2`;
  if (card.kind === "wild4") return "wild +4";
  return "wild";
}

function reshuffle(state) {
  if (state.discard.length <= 1) return;
  const keep = state.discard.pop();
  state.deck = shuffle(state.discard);
  state.discard = keep ? [keep] : [];
}

function takeCards(state, n) {
  const taken = [];
  for (let i = 0; i < n; i += 1) {
    if (!state.deck.length) reshuffle(state);
    if (!state.deck.length) break;
    taken.push(state.deck.pop());
  }
  return taken;
}

function give(state, player, n) {
  const cards = takeCards(state, n);
  state.hands[player].push(...cards);
  if (state.hands[player].length > 1) state.uno[player] = false;
  return cards.length;
}

function checkWin(state, player) {
  if (state.hands[player].length === 0 && !state.pending) {
    state.winner = player;
  }
}

function passTurn(state, player) {
  state.turn = 1 - player;
}

function sameTurn(state, player) {
  state.turn = player;
}

export function create() {
  const deck = makeDeck();
  const hands = [[], []];
  for (let i = 0; i < 7; i += 1) {
    hands[0].push(deck.pop());
    hands[1].push(deck.pop());
  }
  const buried = [];
  let first = deck.pop();
  while (first && first.kind === "wild4") {
    buried.push(first);
    first = deck.pop();
  }
  const rest = shuffle(deck.concat(buried));
  const state = {
    hands,
    deck: rest,
    discard: first ? [first] : [],
    currentColor: first && first.color !== "wild" ? first.color : null,
    turn: 0,
    pending: null,
    winner: null,
    uno: [false, false],
    last: { text: first ? `Kickoff: ${label(first)}` : "Game started", by: null },
  };
  if (!first) return state;
  if (first.kind === "wild") {
    state.pending = { kind: "color", player: 0, keepTurn: true };
    state.turn = 0;
  } else if (first.kind === "skip" || first.kind === "reverse") {
    state.turn = 1;
    state.last = { text: `Kickoff ${label(first)} — you skip`, by: 0 };
  } else if (first.kind === "draw2") {
    give(state, 0, 2);
    state.turn = 1;
    state.last = { text: "Kickoff +2 — first player draws", by: 0 };
  }
  return state;
}

function playCard(state, player, card, chosenColor) {
  const hand = state.hands[player];
  const idx = hand.findIndex((c) => c.id === card.id);
  if (idx === -1) return { error: "That card isn't in your hand." };
  const discardTop = top(state);
  if (!matches(card, discardTop, state.currentColor)) {
    return { error: "That card doesn't match." };
  }

  hand.splice(idx, 1);
  state.discard.push(card);
  state.uno[player] = hand.length === 1;
  state.pending = null;

  if (card.kind === "wild" || card.kind === "wild4") {
    const color = COLORS.includes(chosenColor) ? chosenColor : null;
    if (!color) {
      state.pending = {
        kind: "color",
        player,
        keepTurn: false,
        wild4: card.kind === "wild4",
        legal: card.kind === "wild4" ? !hasColor(hand, state.currentColor) : true,
      };
      state.turn = player;
      state.last = { text: `played ${label(card)}`, by: player };
      return { state };
    }
    return finishWild(state, player, card, color, card.kind === "wild4" ? !hasColor(hand, state.currentColor) : true);
  }

  state.currentColor = card.color;
  if (card.kind === "draw2") {
    give(state, 1 - player, 2);
    sameTurn(state, player);
    state.last = { text: `played ${label(card)} — they draw 2`, by: player };
  } else if (card.kind === "skip" || card.kind === "reverse") {
    sameTurn(state, player);
    state.last = { text: `played ${label(card)} — extra turn`, by: player };
  } else {
    passTurn(state, player);
    state.last = { text: `played ${label(card)}`, by: player };
  }
  if (hand.length === 1) state.last = { text: `${state.last.text} · UNO!`, by: player };
  checkWin(state, player);
  return { state };
}

function finishWild(state, player, card, color, legal) {
  state.currentColor = color;
  if (card.kind === "wild4") {
    state.pending = { kind: "wd4", player: 1 - player, by: player, legal };
    state.turn = 1 - player;
    state.last = { text: `wild +4 → ${color}`, by: player };
    return { state };
  }
  passTurn(state, player);
  state.pending = null;
  state.last = { text: `wild → ${color}`, by: player };
  if (state.hands[player].length === 1) state.last = { text: `${state.last.text} · UNO!`, by: player };
  checkWin(state, player);
  return { state };
}

export function apply(state, playerIndex, action) {
  if (state.winner !== null) return { error: "Game already finished." };
  const s = clone(state);
  const pending = s.pending;

  if (pending && pending.player !== playerIndex && action.type !== "challenge" && action.type !== "accept") {
    return { error: "Waiting on the other player." };
  }

  if (action.type === "chooseColor") {
    if (!pending || pending.kind !== "color" || pending.player !== playerIndex) {
      return { error: "No color to pick." };
    }
    const color = action.color;
    if (!COLORS.includes(color)) return { error: "Pick red, yellow, green, or blue." };
    const card = top(s);
    if (pending.keepTurn) {
      s.currentColor = color;
      s.pending = null;
      s.turn = playerIndex;
      s.last = { text: `color is ${color}`, by: playerIndex };
      return { state: s };
    }
    return finishWild(s, playerIndex, card, color, pending.legal !== false);
  }

  if (action.type === "accept" || action.type === "challenge") {
    if (!pending || pending.kind !== "wd4" || pending.player !== playerIndex) {
      return { error: "Nothing to answer." };
    }
    const by = pending.by;
    if (action.type === "challenge") {
      if (pending.legal) {
        give(s, playerIndex, 6);
        s.last = { text: "challenge failed — draw 6", by: playerIndex };
        sameTurn(s, by);
      } else {
        give(s, by, 4);
        s.last = { text: "caught the +4 bluff", by: playerIndex };
        s.turn = playerIndex;
      }
    } else {
      give(s, playerIndex, 4);
      s.last = { text: "drew 4 from wild +4", by: playerIndex };
      sameTurn(s, by);
    }
    s.pending = null;
    checkWin(s, by);
    return { state: s };
  }

  if (pending && pending.kind === "color") return { error: "Pick a color first." };
  if (pending && pending.kind === "wd4") return { error: "Challenge or take the +4." };

  if (action.type === "playDrawn" || action.type === "keepDrawn") {
    if (!pending || pending.kind !== "drawn" || pending.player !== playerIndex) {
      return { error: "You didn't just draw." };
    }
    if (action.type === "keepDrawn") {
      s.pending = null;
      passTurn(s, playerIndex);
      s.last = { text: "drew and held", by: playerIndex };
      return { state: s };
    }
    const card = s.hands[playerIndex].find((c) => c.id === pending.cardId);
    if (!card) return { error: "Drawn card is gone." };
    return playCard(s, playerIndex, card, action.color);
  }

  if (pending && pending.kind === "drawn") {
    return { error: "Play or keep the card you drew." };
  }

  if (s.turn !== playerIndex) return { error: "Not your turn." };

  if (action.type === "draw") {
    const cards = takeCards(s, 1);
    if (!cards.length) return { error: "No cards left to draw." };
    const card = cards[0];
    s.hands[playerIndex].push(card);
    s.uno[playerIndex] = false;
    if (matches(card, top(s), s.currentColor)) {
      s.pending = { kind: "drawn", player: playerIndex, cardId: card.id };
      s.last = { text: "drew a card — can play it", by: playerIndex };
    } else {
      passTurn(s, playerIndex);
      s.last = { text: "drew a card", by: playerIndex };
    }
    return { state: s };
  }

  if (action.type === "play") {
    const card = s.hands[playerIndex].find((c) => c.id === action.cardId);
    if (!card) return { error: "That card isn't in your hand." };
    return playCard(s, playerIndex, card, action.color);
  }

  return { error: "Unknown action." };
}

function sortHand(hand) {
  const order = { red: 0, yellow: 1, green: 2, blue: 3, wild: 4 };
  return hand.slice().sort((a, b) => {
    const byColor = (order[a.color] ?? 9) - (order[b.color] ?? 9);
    if (byColor) return byColor;
    const av = a.kind === "num" ? a.value : 50;
    const bv = b.kind === "num" ? b.value : 50;
    return av - bv;
  });
}

export function view(state, playerIndex) {
  const discardTop = top(state);
  const pending = state.pending;
  const yourTurn = state.turn === playerIndex && state.winner === null;
  const playable = state.hands[playerIndex]
    .filter((card) => {
      if (pending?.kind === "drawn" && pending.player === playerIndex) return card.id === pending.cardId;
      if (pending) return false;
      return yourTurn && matches(card, discardTop, state.currentColor);
    })
    .map((card) => card.id);

  let prompt = "Their move";
  if (state.winner !== null) prompt = "Game over";
  else if (pending?.kind === "color" && pending.player === playerIndex) prompt = "Pick a color";
  else if (pending?.kind === "color") prompt = "They pick a color";
  else if (pending?.kind === "wd4" && pending.player === playerIndex) prompt = "Challenge or draw 4";
  else if (pending?.kind === "wd4") prompt = "Waiting on +4";
  else if (pending?.kind === "drawn" && pending.player === playerIndex) prompt = "Play it or keep it";
  else if (yourTurn) prompt = "Your move";

  return {
    turn: state.turn,
    winner: state.winner,
    currentColor: state.currentColor,
    top: discardTop,
    deckCount: state.deck.length,
    you: sortHand(state.hands[playerIndex]),
    foeCount: state.hands[1 - playerIndex].length,
    playable,
    pending: pending
      ? {
          kind: pending.kind,
          yours: pending.player === playerIndex,
          cardId: pending.cardId || null,
          legal: pending.kind === "wd4" ? undefined : pending.legal,
        }
      : null,
    uno: state.uno[playerIndex],
    foeUno: state.uno[1 - playerIndex],
    last: state.last,
    prompt,
    colors: COLORS,
  };
}
