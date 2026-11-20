import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import en from '../../i18n/locales/en.json';
import pl from '../../i18n/locales/pl.json';
import GameBoard from '../GameBoard';
import RoomCode from '../create/RoomCode';
import { makeSocket, ONE_SHIP } from './testSocket';

beforeEach(async () => { await i18n.changeLanguage('en'); });

const board = (phase) => render(
  <MemoryRouter>
    <GameBoard socket={makeSocket()} roomCode="7F3K9Q" shipConfig={{ 1: 1 }} onLeave={() => {}} nick="Kraken" opponent="Nautilus"
      resumeState={{ phase, my_turn: true, my_ships: ONE_SHIP, enemy_shots: [], my_shots: [], enemy_sunk_sizes: [] }} />
  </MemoryRouter>,
);

test('ekran kodu pokoju nie ma linków w stopce, które odmontowałyby lobby', () => {
  render(<MemoryRouter><RoomCode nick="Kraken" code="7F3K9Q" onCancel={() => {}} /></MemoryRouter>);
  expect(screen.queryByRole('link', { name: 'Privacy' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument();
});

test('miejsce na komunikat bitwy jest zarezerwowane, zanim cokolwiek się pojawi', () => {
  const { container } = board('battle');
  const slot = container.querySelector('[data-slot="battle-status"]');
  expect(slot).toBeInTheDocument();
  expect(slot.className).toMatch(/min-h-/);
});

test('plansza mieści się na wąskim ekranie (szerokość zależna od viewportu, mniejszy padding)', () => {
  const { container } = board('battle');
  const frame = container.querySelector('[data-slot="board-width"]');
  expect(frame.className).toContain('calc(100vw');
  expect(frame.closest('section').className).toContain('p-3');
});

test('w rozstawianiu jest przycisk usuwania zaznaczonego statku, nieaktywny bez zaznaczenia', () => {
  board('placement');
  expect(screen.getByRole('button', { name: 'Remove ship' })).toBeDisabled();
});

test('instrukcje opisują przeciąganie, a nie klikanie', () => {
  expect(en.deploy.tip1).toMatch(/^Drag/);
  expect(pl.deploy.tip1).toMatch(/^Przeciągnij/);
  expect(en.rules.s2.body).toMatch(/Drag/);
  expect(pl.rules.s2.body).toMatch(/Przeciągnij/);
});
