export const MAX_NICK_LENGTH = 30;

export function normalizeNick(nick) {
  return (nick || '').normalize('NFKC').split(/\s+/).filter(Boolean).join(' ');
}

export function nickProblem(nick) {
  const clean = normalizeNick(nick);
  if (!clean) return 'nickname_required';
  if (clean.length > MAX_NICK_LENGTH || /\p{C}/u.test(clean) || !/[\p{L}\p{N}]/u.test(clean)) return 'invalid_nickname';
  return null;
}
