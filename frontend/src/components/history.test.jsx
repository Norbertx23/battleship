import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import MatchHistory from './MatchHistory';

const ITEMS = [
  { winner_nick: 'TheUnsinkableAdmiralNautilus', player1_nick: 'TheUnsinkableAdmiralNautilus', player2_nick: 'Kraken', played_at: '2026-11-18T20:40:00' },
];

beforeEach(async () => {
  await i18n.changeLanguage('en');
  globalThis.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ items: ITEMS, total: 25 }) }));
});

const setup = () => render(<MemoryRouter><MatchHistory /></MemoryRouter>);

test('wpisanie „krak” wysyła zapytanie z search=krak', async () => {
  setup();
  await userEvent.type(screen.getByLabelText('Find a player'), 'krak');
  await waitFor(() => expect(globalThis.fetch).toHaveBeenLastCalledWith(expect.stringContaining('search=krak')), { timeout: 1500 });
});

test('długi nick ma truncate, a wiersz pełny title', async () => {
  setup();
  const winner = await screen.findByText('TheUnsinkableAdmiralNautilus');
  expect(winner).toHaveClass('truncate');
  expect(winner.closest('[title]').getAttribute('title')).toContain('Kraken');
});

test('pod listą jest notka z linkiem do GitHub Issues', async () => {
  setup();
  const link = await screen.findByRole('link', { name: 'GitHub Issues' });
  expect(link).toHaveAttribute('href', 'https://github.com/Norbertx23/battleship/issues');
});

test('paginacja pokazuje strony i przechodzi dalej', async () => {
  setup();
  await screen.findByText('TheUnsinkableAdmiralNautilus');
  expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await waitFor(() => expect(globalThis.fetch).toHaveBeenLastCalledWith(expect.stringContaining('page=2')));
  expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
});
