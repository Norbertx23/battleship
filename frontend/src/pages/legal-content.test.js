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
  expect(section(privacyPl, 7)).toMatch(/przeniesienia danych/);
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

test('polityka pkt 7: przenoszenie dla danych z umowy, sprzeciw dla uzasadnionego interesu', () => {
  expect(section(privacyPl, 7)).toMatch(/przeniesienia danych.*lit\. b/s);
  expect(section(privacyPl, 7)).toMatch(/sprzeciw.*lit\. f/s);
  expect(section(privacyEn, 7)).toMatch(/portability.*6\(1\)\(b\)/s);
  expect(section(privacyEn, 7)).toMatch(/object.*6\(1\)\(f\)/s);
});

test('polityka pkt 7: odpowiedź w ciągu miesiąca, nie 30 dni', () => {
  expect(section(privacyPl, 7)).toMatch(/w ciągu miesiąca/);
  expect(section(privacyEn, 7)).toMatch(/within one month/);
  expect(privacyPl).not.toMatch(/30 dni/);
  expect(privacyEn).not.toMatch(/30 days/);
});

test('polityka pkt 3: brak profilowania i decyzji zautomatyzowanych', () => {
  expect(section(privacyPl, 3)).toMatch(/nie profilujemy/);
  expect(section(privacyEn, 3)).toMatch(/profiling/);
});

test('polityka pkt 6: Cloudflare jako podmiot przetwarzający', () => {
  expect(section(privacyPl, 6)).toMatch(/podmiot przetwarzający/);
  expect(section(privacyEn, 6)).toMatch(/processor/);
});

test('polityka pkt 4: podstawa z art. 399 Prawa komunikacji elektronicznej', () => {
  expect(section(privacyPl, 4)).toMatch(/art\. 399/);
  expect(section(privacyEn, 4)).toMatch(/Article 399/);
});

test('regulamin 7.2: nowa wersja dotyczy gier rozpoczętych po publikacji', () => {
  expect(termsPl).toMatch(/\*\*7\.2\.\*\*.*rozpoczętych po/);
  expect(termsEn).toMatch(/\*\*7\.2\.\*\*.*started after/);
});
