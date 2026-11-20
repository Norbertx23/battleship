import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import PaperLayout from './PaperLayout';

function Counter() {
  const [n, setN] = useState(0);
  return <button type="button" onClick={() => setN(n + 1)}>count {n}</button>;
}

const setup = () => render(
  <MemoryRouter>
    <PaperLayout active="lobby"><Counter /></PaperLayout>
  </MemoryRouter>,
);

beforeEach(async () => { await i18n.changeLanguage('en'); });

test('przełącznik zmienia język i aria-pressed', async () => {
  setup();
  await userEvent.click(screen.getByRole('button', { name: 'PL' }));
  expect(i18n.language).toBe('pl');
  expect(screen.getByRole('button', { name: 'PL' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('link', { name: 'Historia meczów' })).toBeInTheDocument();
});

test('zmiana języka nie odmontowuje dzieci', async () => {
  setup();
  await userEvent.click(screen.getByRole('button', { name: 'count 0' }));
  await userEvent.click(screen.getByRole('button', { name: 'PL' }));
  expect(screen.getByRole('button', { name: 'count 1' })).toBeInTheDocument();
});

test('stopka ma właściwe linki', () => {
  setup();
  expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/Norbertx23/battleship');
});

test('logo to dokładnie Battleship i prowadzi do lobby', () => {
  setup();
  const logo = screen.getByRole('link', { name: 'Battleship' });
  expect(logo).toHaveTextContent(/^Battleship$/);
  expect(logo).toHaveAttribute('href', '/');
});

test('bez stopki i nawigacji, gdy wyłączone', () => {
  render(<MemoryRouter><PaperLayout withNav={false} withFooter={false}>x</PaperLayout></MemoryRouter>);
  expect(screen.queryByRole('link', { name: 'Privacy' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Match history' })).not.toBeInTheDocument();
});
