const LOCALES = { en: 'en-GB', pl: 'pl-PL' };

export function formatMatchDate(playedAt, lang, { withTime = true, tz } = {}) {
  if (!playedAt) return '';
  const date = new Date(playedAt.endsWith('Z') ? playedAt : playedAt + 'Z');
  const locale = LOCALES[lang] || LOCALES.en;
  const opts = { day: 'numeric', month: 'short', timeZone: tz };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit', hour12: false });
  const part = Object.fromEntries(new Intl.DateTimeFormat(locale, opts).formatToParts(date).map((p) => [p.type, p.value]));
  const month = part.month.replace('.', '');
  const day = `${part.day} ${month}`;
  return withTime ? `${day}, ${part.hour}:${part.minute}` : day;
}
