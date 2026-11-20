import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import { cellClasses } from './cellClasses';
import BoardFrame from './BoardFrame';
import GameBoard from '../GameBoard';
import { makeSocket, ONE_SHIP } from './testSocket';

beforeEach(async () => { await i18n.changeLanguage('en'); });

test('cellClasses(mark) ma tło zakreślacza i nie dokłada treści', () => {
  const cls = cellClasses('mark');
  expect(cls).toContain('bg-highlight');
  expect(cls).not.toContain('after:content');
});

test('cellClasses(hit) rysuje czerwony krzyżyk', () => {
  expect(cellClasses('hit')).toContain('text-pen');
});

test('każda komórka jest kwadratowa', () => {
  ['empty', 'ship', 'hit', 'sunk', 'miss', 'mark'].forEach((k) => expect(cellClasses(k)).toContain('aspect-square'));
});

test('BoardFrame renderuje litery A–J i liczby 1–10', () => {
  render(<BoardFrame label="Board"><div /></BoardFrame>);
  'ABCDEFGHIJ'.split('').forEach((l) => expect(screen.getByText(l)).toBeInTheDocument());
  for (let n = 1; n <= 10; n += 1) expect(screen.getByText(String(n))).toBeInTheDocument();
});

test('w fazie rozstawiania Clear board usuwa wszystkie statki', async () => {
  const socket = makeSocket();
  const { container } = render(
    <MemoryRouter>
      <GameBoard socket={socket} roomCode="7F3K9Q" shipConfig={{ 1: 1 }} onLeave={() => {}} nick="Kraken" resumeState={{ phase: 'placement', my_ships: ONE_SHIP }} />
    </MemoryRouter>,
  );
  expect(container.querySelectorAll('[data-ship]')).toHaveLength(1);
  await userEvent.click(screen.getByRole('button', { name: 'Clear board' }));
  expect(container.querySelectorAll('[data-ship]')).toHaveLength(0);
});

test('rozstawianie po polsku pokazuje tytuł i stocznię', async () => {
  await i18n.changeLanguage('pl');
  render(
    <MemoryRouter>
      <GameBoard socket={makeSocket()} roomCode="7F3K9Q" shipConfig={{ 1: 1 }} onLeave={() => {}} nick="Kraken" resumeState={{ phase: 'placement', my_ships: [] }} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: 'Rozstaw statki' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Stocznia' })).toBeInTheDocument();
});
