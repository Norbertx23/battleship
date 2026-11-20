import privacyPl from '../content/legal/privacy.md?raw';
import privacyEn from '../content/legal/privacy.en.md?raw';
import termsPl from '../content/legal/terms.md?raw';
import termsEn from '../content/legal/terms.en.md?raw';

const section = (md, n) => md.split('\n## ').find((s) => s.startsWith(`${n}. `)) || '';

test('regulamin pkt 4: zgłoszenie nicku także mailem (PL i EN)', () => {
  expect(section(termsPl, 4)).toContain('mailto:swistak.fun@gmail.com');
  expect(section(termsEn, 4)).toContain('mailto:swistak.fun@gmail.com');
});

test('polityka pkt 2: dobrowolność podania nicku', () => {
  expect(section(privacyPl, 2)).toMatch(/dobrowolne/);
  expect(section(privacyEn, 2)).toMatch(/voluntary/);
});

test('polityka pkt 4: techniczne cookies Cloudflare', () => {
  expect(section(privacyPl, 4)).toMatch(/Cloudflare może zapisać/);
  expect(section(privacyEn, 4)).toMatch(/Cloudflare may set/);
});

test('polityka pkt 7: prawo do przenoszenia danych', () => {
  expect(section(privacyPl, 7)).toMatch(/przeniesienie danych/);
  expect(section(privacyEn, 7)).toMatch(/data portability/);
});

test('regulamin ma numerację 1.1, 1.2… zapisaną wprost, bez list numerowanych', () => {
  [termsPl, termsEn].forEach((md) => {
    expect(md).toContain('**1.1.**');
    expect(md).toContain('**4.3.**');
    expect(md).toContain('**5.5.**');
    expect(md).toContain('**7.3.**');
    expect(md).not.toMatch(/^\d+\. /m);
  });
});
