import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import i18n from '../i18n';
import App from '../App';

vi.mock('../components/Lobby', () => ({ default: () => null }));

const visit = (path) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

beforeEach(async () => { await i18n.changeLanguage('en'); });

test('/privacy po polsku pokazuje nagłówek i datę obowiązywania', async () => {
  await i18n.changeLanguage('pl');
  visit('/privacy');
  expect(screen.getByRole('heading', { level: 1, name: 'Polityka prywatności' })).toBeInTheDocument();
  expect(screen.getByText('Obowiązuje od 20 listopada 2026 r.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'swistak.fun@gmail.com' })).toHaveAttribute('href', 'mailto:swistak.fun@gmail.com');
  expect(screen.queryByText(/Polish version prevails/)).not.toBeInTheDocument();
});

test('/privacy po angielsku pokazuje tłumaczenie z zastrzeżeniem', () => {
  visit('/privacy');
  expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
  expect(screen.getByText('Effective from 20 November 2026')).toBeInTheDocument();
  expect(screen.getByText(/Polish version prevails/)).toBeInTheDocument();
});

test('przełączenie języka zmienia wersję dokumentu', async () => {
  visit('/terms');
  expect(screen.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeInTheDocument();
  await i18n.changeLanguage('pl');
  expect(await screen.findByRole('heading', { level: 1, name: 'Regulamin' })).toBeInTheDocument();
});

test('/terms ma punkty 1.–7. i nie zawiera znaku §', async () => {
  await i18n.changeLanguage('pl');
  const { container } = visit('/terms');
  expect(screen.getByRole('heading', { level: 1, name: 'Regulamin' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: '7. Postanowienia końcowe' })).toBeInTheDocument();
  expect(container.textContent).not.toContain('§');
});

test('/terms po angielsku ma 7 punktów bez znaku §', () => {
  const { container } = visit('/terms');
  expect(screen.getByRole('heading', { level: 2, name: '7. Final provisions' })).toBeInTheDocument();
  expect(container.textContent).not.toContain('§');
});

test('/rules po polsku pokazuje punkt o zaznaczaniu bez dwukliku', async () => {
  await i18n.changeLanguage('pl');
  const { container } = visit('/rules');
  expect(screen.getByRole('heading', { name: 'Zaznaczaj podejrzenia' })).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/dwukli/);
  expect(container.textContent).toContain('dwoma palcami');
});
