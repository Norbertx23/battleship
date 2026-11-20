import en from './locales/en.json';
import pl from './locales/pl.json';
import i18n from './index';

const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, p + k + '.') : [p + k]));

test('en i pl mają identyczny zestaw kluczy', () => {
  expect(keys(pl).sort()).toEqual(keys(en).sort());
});

test('nieobsługiwany język spada na en', async () => {
  await i18n.changeLanguage('de');
  expect(i18n.t('nav.history')).toBe('Match history');
});

test('wybór języka trafia do localStorage pod kluczem lang', async () => {
  await i18n.changeLanguage('pl');
  expect(localStorage.getItem('lang')).toBe('pl');
  expect(i18n.t('nav.history')).toBe('Historia meczów');
});

test('zmiana języka ustawia atrybut lang dokumentu', async () => {
  await i18n.changeLanguage('pl');
  expect(document.documentElement.lang).toBe('pl');
});
