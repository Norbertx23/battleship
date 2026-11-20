import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import GameBoard from '../GameBoard';
import { makeSocket, ONE_SHIP } from './testSocket';

const battleState = { phase: 'battle', my_turn: true, my_ships: ONE_SHIP, enemy_shots: [], my_shots: [], enemy_sunk_sizes: [] };

const setup = (socket = makeSocket()) => {
  render(
    <MemoryRouter>
      <GameBoard socket={socket} roomCode="7F3K9Q" shipConfig={{ 1: 1 }} onLeave={() => {}} nick="Kraken" opponent="Nautilus" resumeState={battleState} />
    </MemoryRouter>,
  );
  return socket;
};

beforeEach(async () => { await i18n.changeLanguage('en'); });

test('bez trybu zaznaczania klik w radar oddaje strzał', async () => {
  const socket = setup();
  await userEvent.click(screen.getByRole('button', { name: 'C2' }));
  expect(socket.emit).toHaveBeenCalledWith('fire_shot', { room_id: '7F3K9Q', x: 2, y: 1 });
});

test('w trybie zaznaczania klik nie strzela, tylko zaznacza', async () => {
  const socket = setup();
  const toggle = screen.getByRole('button', { name: 'Mark mode' });
  await userEvent.click(toggle);
  expect(screen.getByRole('button', { name: 'Marking: on' })).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(screen.getByRole('button', { name: 'C2' }));
  expect(socket.emit).not.toHaveBeenCalledWith('fire_shot', expect.anything());
  expect(screen.getByRole('button', { name: 'C2' })).toHaveAttribute('data-state', 'mark');
});

test('dotknięcie dwoma palcami zaznacza pole bez strzału', () => {
  const socket = setup();
  const cell = screen.getByRole('button', { name: 'D4' });
  fireEvent.touchStart(cell, { touches: [{ clientX: 0, clientY: 0 }, { clientX: 5, clientY: 5 }] });
  expect(cell).toHaveAttribute('data-state', 'mark');
  expect(socket.emit).not.toHaveBeenCalledWith('fire_shot', expect.anything());
});

test('prawy przycisk zaznacza pole', () => {
  setup();
  const cell = screen.getByRole('button', { name: 'E5' });
  fireEvent.contextMenu(cell);
  expect(cell).toHaveAttribute('data-state', 'mark');
});

test('koniec gry po polsku pokazuje Wygrana!', async () => {
  await i18n.changeLanguage('pl');
  const socket = setup();
  act(() => socket.handlers.game_over({ winner: 'me', enemy_ships: [] }));
  expect(screen.getByRole('heading', { level: 1, name: 'Wygrana!' })).toBeInTheDocument();
});

test('Play again przechodzi w oczekiwanie', async () => {
  const socket = setup();
  act(() => socket.handlers.game_over({ winner: 'me', enemy_ships: [] }));
  await userEvent.click(screen.getByRole('button', { name: 'Play again' }));
  expect(socket.emit).toHaveBeenCalledWith('play_again', { room_id: '7F3K9Q' });
  expect(screen.getByRole('button', { name: 'Waiting for Nautilus…' })).toBeDisabled();
});

test('prośba przeciwnika zmienia przycisk na Accept rematch', () => {
  const socket = setup();
  act(() => socket.handlers.game_over({ winner: 'other', enemy_ships: [] }));
  act(() => socket.handlers.play_again_pending());
  expect(screen.getByRole('button', { name: 'Accept rematch' })).toBeEnabled();
});
