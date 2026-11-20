import { formatMatchDate } from './formatMatchDate';

test('en: dzień przed miesiącem, 24h', () => {
  expect(formatMatchDate('2026-11-18T20:40:00', 'en', { tz: 'Europe/Warsaw' })).toBe('18 Nov, 21:40');
});

test('pl: skrót miesiąca bez kropki', () => {
  expect(formatMatchDate('2026-11-18T20:40:00', 'pl', { tz: 'Europe/Warsaw' })).toBe('18 lis, 21:40');
});

test('bez godziny', () => {
  expect(formatMatchDate('2026-11-18T20:40:00', 'pl', { withTime: false, tz: 'Europe/Warsaw' })).toBe('18 lis');
});

test('pusta data daje pusty tekst', () => {
  expect(formatMatchDate('', 'en')).toBe('');
});
