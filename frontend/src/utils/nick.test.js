import { nickProblem, normalizeNick } from './nick';

test('normalizuje spacje i znaki pełnej szerokości', () => {
  expect(normalizeNick('  Ala   ma\nkota ')).toBe('Ala ma kota');
  expect(normalizeNick('ＡＢＣ')).toBe('ABC');
});

test('rozpoznaje pusty i niepoprawny nick', () => {
  expect(nickProblem('   ')).toBe('nickname_required');
  expect(nickProblem('a​b')).toBe('invalid_nickname');
  expect(nickProblem('...')).toBe('invalid_nickname');
  expect(nickProblem('x'.repeat(31))).toBe('invalid_nickname');
  expect(nickProblem('Kraken')).toBeNull();
});
