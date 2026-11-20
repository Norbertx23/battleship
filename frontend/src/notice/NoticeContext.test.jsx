import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../i18n';
import pl from '../i18n/locales/pl.json';
import { NoticeProvider } from './NoticeContext';
import { useNotice } from './useNotice';

let api;
function Grab() {
  api = useNotice();
  return null;
}

const setup = () => render(<NoticeProvider><Grab /></NoticeProvider>);

test('pokazuje przetłumaczony komunikat dla znanego kodu', async () => {
  await i18n.changeLanguage('pl');
  setup();
  act(() => api.notify({ code: 'room_not_found_or_full', message: 'Room does not exist or is full' }));
  expect(screen.getByRole('alert')).toHaveTextContent(pl.errors.room_not_found_or_full);
});

test('dla nieznanego kodu pokazuje surowe message', async () => {
  await i18n.changeLanguage('en');
  setup();
  act(() => api.notify({ code: 'cos_nowego', message: 'Raw text' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Raw text');
});

test('wstawia nick do komunikatu', async () => {
  await i18n.changeLanguage('en');
  setup();
  act(() => api.notify({ code: 'opponent_forfeit', nick: 'Kraken' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Kraken');
});

test('znika po kliknięciu zamknięcia', async () => {
  await i18n.changeLanguage('en');
  setup();
  act(() => api.notify({ code: 'session_expired' }));
  await userEvent.click(screen.getByRole('button', { name: 'Close message' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
