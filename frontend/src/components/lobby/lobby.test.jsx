import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import { NoticeProvider } from '../../notice/NoticeContext';
import JoinForm from './JoinForm';
import RecentGames from './RecentGames';
import TopPlayers from './TopPlayers';

beforeEach(async () => { await i18n.changeLanguage('en'); });

const renderJoin = (props) => render(
  <MemoryRouter>
    <NoticeProvider>
      <JoinForm nick="" onNickChange={() => {}} code="" onCodeChange={() => {}} onJoin={() => {}} {...props} />
    </NoticeProvider>
  </MemoryRouter>,
);

test('JoinForm wywołuje onJoin przy wypełnionym nicku', async () => {
  const onJoin = vi.fn();
  renderJoin({ nick: 'Kraken', code: '7F3K9Q', onJoin });
  await userEvent.click(screen.getByRole('button', { name: 'Join' }));
  expect(onJoin).toHaveBeenCalledTimes(1);
});

test('pusty nick nie dołącza i pokazuje komunikat', async () => {
  const onJoin = vi.fn();
  renderJoin({ nick: '  ', code: '7F3K9Q', onJoin });
  await userEvent.click(screen.getByRole('button', { name: 'Join' }));
  expect(onJoin).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent('Sign your name first.');
});

test('JoinForm przekazuje wpisany kod', async () => {
  const onCodeChange = vi.fn();
  renderJoin({ nick: 'K', onCodeChange });
  await userEvent.type(screen.getByLabelText('Room code'), 'a');
  expect(onCodeChange).toHaveBeenCalledWith('a');
});

test('RecentGames ucina długie nicki w jednej linii i ma pełny title', () => {
  render(<RecentGames matches={[{ winner_nick: 'TheUnsinkableAdmiralNautilus', player1_nick: 'TheUnsinkableAdmiralNautilus', player2_nick: 'Kraken', played_at: '2026-11-18T20:40:00' }]} />);
  const winner = screen.getByText('TheUnsinkableAdmiralNautilus');
  expect(winner).toHaveClass('truncate');
  const row = winner.closest('[title]');
  expect(row.getAttribute('title')).toContain('TheUnsinkableAdmiralNautilus');
  expect(row.getAttribute('title')).toContain('Kraken');
  expect(screen.getByText('Kraken')).toHaveClass('truncate');
});

test('TopPlayers pokazuje liczbę wygranych w bieżącym języku', async () => {
  await i18n.changeLanguage('pl');
  render(<TopPlayers players={[{ nick: 'Kraken', wins: 42 }]} />);
  expect(screen.getByText('42 wygranych')).toBeInTheDocument();
});
