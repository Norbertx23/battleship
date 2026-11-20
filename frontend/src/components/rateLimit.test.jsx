import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import en from '../i18n/locales/en.json';
import pl from '../i18n/locales/pl.json';
import { NoticeProvider } from '../notice/NoticeContext';
import MatchHistory from './MatchHistory';

const limited = () => Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve({ code: 'rate_limited', message: 'Too many requests. Try again in a moment.' }) });

beforeEach(async () => {
  await i18n.changeLanguage('en');
  globalThis.fetch = vi.fn(limited);
});

test('komunikat rate_limited istnieje w obu językach', () => {
  expect(en.errors.rate_limited).toBeTruthy();
  expect(pl.errors.rate_limited).toBeTruthy();
});

test('historia przy 429 pokazuje komunikat o zbyt wielu zapytaniach', async () => {
  render(<MemoryRouter><NoticeProvider><MatchHistory /></NoticeProvider></MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent(en.errors.rate_limited);
});
