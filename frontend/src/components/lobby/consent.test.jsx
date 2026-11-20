import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import { NoticeProvider } from '../../notice/NoticeContext';
import JoinForm from './JoinForm';
import CreateRoom from '../create/CreateRoom';

const CONFIG = { 4: 1, 3: 2, 2: 2, 1: 4 };

const expectConsent = (scope) => {
  expect(scope.getByText(/By playing, you accept the/)).toBeInTheDocument();
  expect(scope.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms');
  expect(scope.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
};

beforeEach(async () => { await i18n.changeLanguage('en'); });

test('formularz dołączania informuje o akceptacji regulaminu', () => {
  render(<MemoryRouter><NoticeProvider><JoinForm nick="" onNickChange={() => {}} code="" onCodeChange={() => {}} onJoin={() => {}} /></NoticeProvider></MemoryRouter>);
  expectConsent(screen);
});

test('tworzenie pokoju informuje o akceptacji regulaminu', () => {
  render(<MemoryRouter><CreateRoom nick="" onNickChange={() => {}} config={CONFIG} onConfigChange={() => {}} onBack={() => {}} onCreate={() => {}} /></MemoryRouter>);
  expectConsent(screen);
});

test('po polsku informacja ma polskie nazwy dokumentów', async () => {
  await i18n.changeLanguage('pl');
  render(<MemoryRouter><NoticeProvider><JoinForm nick="" onNickChange={() => {}} code="" onCodeChange={() => {}} onJoin={() => {}} /></NoticeProvider></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Regulamin' })).toHaveAttribute('href', '/terms');
  expect(screen.getByRole('link', { name: 'Politykę prywatności' })).toHaveAttribute('href', '/privacy');
});
