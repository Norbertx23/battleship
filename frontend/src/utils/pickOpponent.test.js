import { pickOpponent } from './pickOpponent';

test('zwraca drugiego gracza', () => {
  expect(pickOpponent(['Kraken', 'Nautilus'], 'Kraken')).toBe('Nautilus');
});

test('ignoruje spacje na końcu własnego nicku', () => {
  expect(pickOpponent(['Kraken', 'Nautilus'], 'Kraken ')).toBe('Nautilus');
});

test('bez dopasowania zwraca pusty tekst zamiast własnego nicku', () => {
  expect(pickOpponent(['Kraken', 'Nautilus'], 'Ktoś')).toBe('');
});

test('brak listy graczy daje pusty tekst', () => {
  expect(pickOpponent(undefined, 'Kraken')).toBe('');
});
