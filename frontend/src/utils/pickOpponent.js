import { normalizeNick } from './nick';

export function pickOpponent(players, nick) {
  if (!Array.isArray(players)) return '';
  const mine = players.indexOf(normalizeNick(nick));
  if (mine === -1) return '';
  return players.find((_, i) => i !== mine) || '';
}
