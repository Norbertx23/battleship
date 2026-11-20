# 🚢 Battleship

Sieciowa gra w statki dla dwóch graczy - klasyczne zasady, interfejs w stylu zeszytu w kratkę i rozgrywka w czasie rzeczywistym przez WebSocket.

**Zagraj online: [battleship.swistak.fun](https://battleship.swistak.fun)**

---

## 🎮 Jak grać

Interfejs jest po polsku i po angielsku. Język przełączysz w nagłówku (`PL` / `EN`), a wybór zostaje zapamiętany. Krótkie zasady są też w samej grze, w zakładce **Jak grać**.

### Rozpoczęcie

Gra jest dla **dwóch osób** i opiera się na kodach pokojów:

1. **Gracz 1** klika **Utwórz pokój**, wpisuje nick i zakreśla, ile statków każdego rozmiaru dostajecie. Dostaje 6-znakowy kod pokoju, który może skopiować przyciskiem obok kodu.
2. **Gracz 2** wpisuje w lobby swój nick i otrzymany kod, a potem klika **Dołącz**.
3. Obaj gracze rozstawiają statki i klikają **Gotowe - zaczynamy bitwę**. Bitwa zaczyna się, gdy gotowi są obaj.

Nick jest zapamiętywany w przeglądarce, więc przy kolejnej wizycie nie trzeba go wpisywać od nowa.

### Rozstawianie statków

| Akcja | Sterowanie |
|---|---|
| Postawienie statku | przeciągnij statek ze **Stoczni** na swoją planszę |
| Obrót | klawisz `R`, prawy przycisk myszy albo przycisk **Obróć** |
| Obrót na telefonie | dotknij drugim palcem podczas przeciągania |
| Przesunięcie | przeciągnij postawiony statek w inne miejsce |
| Usunięcie | zaznacz statek i wciśnij `Delete` / `Backspace` albo kliknij **Usuń statek** |
| Wyczyszczenie planszy | przycisk **Wyczyść planszę** |

Statki **nie mogą się stykać**, ani bokami, ani rogami. Dopóki cała flota nie stoi poprawnie, przycisk startu jest zablokowany i pokazuje napis **Najpierw rozstaw wszystkie statki**.

### Bitwa

- Tytuł nad planszami mówi, czyja jest tura. Gdy widzisz **Twoja tura - strzelaj!**, kliknij puste pole na **Morzu przeciwnika**.
- **Trafienie daje kolejny strzał.** Pudło oddaje turę przeciwnikowi.
- Trafienie to czerwony krzyżyk, zatopiony statek jest dodatkowo zakreskowany, a pudło to kropka ołówkiem.
- Panel **Wciąż na wodzie** pokazuje, ile statków każdego rozmiaru zostało przeciwnikowi.
- **Zaznaczanie** (prawy przycisk myszy, dotknięcie dwoma palcami albo przycisk **Tryb zaznaczania**) koloruje pole na żółto. To tylko Twoja notatka, nie strzał. Drugie zaznaczenie tego samego pola je zmazuje.

Wygrywa ten, kto pierwszy zatopi całą flotę przeciwnika.

### Po grze

Na ekranie końca gry widać **Flotę przeciwnika**: zakreskowane na niebiesko są statki, których nie udało Ci się znaleźć. Wynik trafia do globalnej historii meczów i rankingu widocznych w lobby.

Przycisk **Zagraj ponownie** proponuje rewanż z tym samym przeciwnikiem, bez nowego kodu i ponownego łączenia. Druga strona widzi propozycję i potwierdza ją przyciskiem **Przyjmij rewanż**. Gdy zgodzą się obaj, plansze się czyszczą i wracacie do rozstawiania w tym samym pokoju. Jeśli przeciwnik wyjdzie z pokoju, przycisk zmienia się w nieaktywne **Przeciwnik wyszedł**. Każda rozegrana partia trafia do historii jako osobny mecz.

### Rozłączenie

Po chwilowym zerwaniu połączenia gra **sama wraca do pokoju**. Po odświeżeniu strony (`F5`) wystarczy w tej samej karcie wpisać ten sam kod i kliknąć **Dołącz**, a gra rozpozna, że to Ty.

- **W trakcie bitwy** masz **60 sekund na powrót**. Stan gry (Twoja flota, oddane strzały, czyja kolej) zostanie odtworzony. Po tym czasie przeciwnik wygrywa walkowerem.
- **Przed bitwą** (oczekiwanie na przeciwnika, rozstawianie statków) masz **180 sekund**. Po tym czasie opuszczasz pokój.

---

## 🛠️ Technologie

**Frontend**
- React 19 + Vite 7
- Tailwind CSS 4
- Socket.IO client — komunikacja w czasie rzeczywistym
- react-i18next — interfejs po angielsku i po polsku
- react-markdown — regulamin i polityka prywatności z plików `.md`
- Vitest + Testing Library — testy frontendu

**Backend**
- Python 3.12 + FastAPI
- python-socketio — serwer WebSocket
- SQLAlchemy 2 + PostgreSQL 15
- pytest

**Infrastruktura**
- Docker + Docker Compose
- GitHub Actions → GitHub Container Registry (GHCR)
- nginx jako reverse proxy
- Cloudflare Tunnel

---

## 🏗️ Jak to działa

### Podział odpowiedzialności

**Stan rozgrywki żyje w pamięci serwera** (słownik pokojów), nie w bazie. Baza przechowuje wyłącznie **historię zakończonych meczów** — dzięki temu rozgrywka jest błyskawiczna, a restart aplikacji nie kasuje statystyk.

Serwer jest **jedynym źródłem prawdy**. Przeglądarka nigdy nie zna pozycji statków przeciwnika — walidacja rozstawienia, sprawdzanie trafień i wykrywanie zwycięstwa dzieją się po stronie backendu ([`game_manager.py`](backend/game_manager.py)). Pozycje floty przeciwnika są wysyłane dopiero w momencie zakończenia gry, na potrzeby podglądu `SHOW BOARD`.

### Przepływ żądania

```
Przeglądarka
    │  HTTPS
    ▼
Cloudflare Tunnel  (TLS, ochrona DDoS, brak otwartych portów na routerze)
    │
    ▼
nginx  ──►  kontener web (nginx + statyczny build React)
                 │
                 ├─ /       → pliki aplikacji
                 └─ /api/   → kontener backend :8000 (REST + Socket.IO)
                                    │
                                    ▼
                              PostgreSQL (wolumen Dockera)
```

Wszystkie porty aplikacji są przypięte do `127.0.0.1` — z sieci lokalnej ani z internetu nie da się połączyć bezpośrednio z bazą czy API. Jedyną drogą do środka jest tunel, który jest połączeniem **wychodzącym** z serwera.

### Wdrożenie w modelu pull

`git push` na `main` uruchamia [`release.yml`](.github/workflows/release.yml):

1. **Testy backendu** (pytest na prawdziwym PostgreSQL) i **build frontendu** działają jako bramka.
2. Dopiero po ich przejściu budowane są obrazy i publikowane do GHCR z tagami `:<sha>` i `:latest`.

Serwer **sam pobiera** nowe obrazy — timer systemd co 30 sekund porównuje wersję uruchomioną z dostępną. Gdy wykryje różnicę:

```
backup bazy (twardy warunek)  →  init-db  →  start API  →  healthcheck
                                                              │
                                            niepowodzenie  ───┴──► automatyczny rollback
```

Nieudany backup **przerywa wdrożenie**. Jeśli nowa wersja nie przejdzie healthchecku, skrypt wraca na poprzedni obraz i zapamiętuje wadliwą wersję, żeby nie wpaść w pętlę.

Dzięki temu modelowi **żadna maszyna w sieci domowej nie przyjmuje zadań z internetu** — serwer jedynie sam odpytuje rejestr.

---

## 💻 Uruchomienie lokalne

Wymagania: Python 3.12+, Node.js 20+.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
```

Do zabawy wystarczy SQLite — nie trzeba stawiać PostgreSQL:

```bash
DATABASE_URL="sqlite:///./dev.db" python -m init_db
DATABASE_URL="sqlite:///./dev.db" uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikacja: **http://localhost:5173**. Vite przekierowuje `/api` na backend, więc działa tak samo jak na produkcji.

Aby zagrać samemu ze sobą, otwórz dwie karty — każda karta to osobny gracz. Obie podpowiedzą ten sam zapamiętany nick, więc w jednej warto go zmienić.

### Testy

```bash
cd backend && pytest -v
```

---

## 🖥️ Aplikacja desktopowa

Cienki klient w Electronie — okno bez paska adresu, łączy się z publiczną instancją gry.

### Instalacja (macOS)

1. Otwórz `Battleship-1.0.0-arm64.dmg` i przeciągnij aplikację do `Applications`.
2. **Przy pierwszym uruchomieniu kliknij ikonę prawym przyciskiem → `Otwórz`**, a następnie potwierdź w oknie dialogowym.

Drugi krok jest konieczny, ponieważ aplikacja nie ma podpisu dewelopera Apple (wymaga on płatnego konta). Zwykłe dwukliknięcie zostanie zablokowane przez Gatekeeper. Alternatywnie:

```bash
xattr -cr /Applications/Battleship.app
```

### Budowanie ze źródeł

```bash
cd desktop-client
npm install
npm run build:mac    # macOS  → dist/*.dmg
npm run build:win    # Windows → dist/*.exe
```

### Własny serwer

Domyślnie klient łączy się z `https://battleship.swistak.fun`. Aby wskazać własną instancję:

```bash
BATTLESHIP_URL="http://192.168.1.50:3000" npm start
```

---

## 🐳 Wdrożenie własnej instancji

```bash
cp .env.example .env    # uzupełnij POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
docker compose up -d --build
docker exec battleship_backend python -m init_db
```

Gra będzie dostępna pod adresem **http://localhost:3000**. Wszystkie porty są celowo związane z `127.0.0.1` — usługi nie są widoczne z sieci lokalnej ani z internetu. Aby udostępnić grę na zewnątrz, postaw przed nią reverse proxy (np. nginx) zamiast otwierać porty.

Konfiguracja produkcyjna oparta na obrazach z GHCR znajduje się w katalogu [`deploy/`](deploy/).

Podgląd logów i stanu:

```bash
docker compose ps
docker logs battleship_backend --tail 50
curl http://localhost:8001/healthz
```

---

## 🩺 Healthcheck

`GET /healthz` sprawdza połączenie z bazą danych:

- `200 {"status": "ok", "database": "ok"}` — wszystko działa
- `503 {"status": "error", "database": "unreachable"}` — baza niedostępna

Endpoint jest używany przez healthcheck kontenera oraz przez skrypt wdrożeniowy do decyzji o rollbacku.

---

## 🗄️ Zmiana schematu bazy

Schemat tworzy osobny krok [`init_db.py`](backend/init_db.py), uruchamiany **przed** startem API (usługa `init-db`). Aplikacja nie tworzy tabel przy starcie, więc wdrożenie nie modyfikuje schematu w locie, a API nie wstanie, jeśli inicjalizacja zwróci błąd.

⚠️ **`create_all()` tworzy wyłącznie brakujące tabele — nie modyfikuje istniejących.**

Jeśli dodasz kolumnę do modelu, `init_db.py` przejdzie bez błędu, ale kolumna nie powstanie. Awaria ujawni się dopiero w trakcie działania (`UndefinedColumn`), przy pierwszym zapytaniu użytkownika. Przy realnej zmianie modelu potrzebny jest więc ręczny `ALTER TABLE` albo wprowadzenie Alembica (`alembic stamp head` na istniejącej bazie oznacza obecny schemat jako punkt wyjścia).

---

## 📂 Struktura projektu

```
backend/          FastAPI, Socket.IO, logika gry, modele
frontend/         React + Vite, interfejs gry
desktop-client/   Electron — cienki klient
deploy/           compose produkcyjny, skrypt wdrożeniowy, unit systemd
.github/          pipeline CI/CD
```

### Endpointy API

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/healthz` | stan aplikacji i bazy |
| `GET` | `/stats/recent-matches` | historia meczów (stronicowana, wyszukiwanie) |
| `GET` | `/stats/top-players` | ranking według liczby zwycięstw |
| `GET` | `/stats/player/{nick}` | statystyki gracza |

### Zdarzenia Socket.IO

**Od klienta:** `create_room`, `join_room`, `place_ships`, `fire_shot`, `play_again`, `leave_room`

**Do klienta:** `room_created`, `session`, `game_start`, `battle_start`, `shot_result`, `game_over`, `play_again_pending`, `opponent_disconnected`, `opponent_reconnected`, `game_resumed`, `rejoin_failed`, `player_disconnected`, `error`

Powrót po rozłączeniu działa na tokenie sesji: przy tworzeniu lub dołączaniu do pokoju serwer wysyła zdarzenie `session` z tokenem, który klient zapisuje w `sessionStorage` (osobno dla każdej karty, więc dwie karty to dwóch różnych graczy). Po ponownym połączeniu socketu klient sam wysyła `join_room` z tym tokenem i flagą `rejoin` (po odświeżeniu strony token dołącza ręczne dołączenie przyciskiem **Dołącz** z tym samym kodem) — serwer rozpoznaje powrót tego samego gracza i odtwarza stan rozgrywki (`game_resumed`) zamiast tworzyć nowego uczestnika. Gdy powrót jest już niemożliwy (minął czas albo pokój zniknął), serwer odpowiada `rejoin_failed` i klient wraca do lobby.

Ponowna gra: `play_again` od pierwszego gracza trafia do przeciwnika jako `play_again_pending`. Gdy kliknie drugi, serwer czyści stan pokoju i wysyła obu zwykłe `game_start`, więc nowa partia startuje tą samą ścieżką co pierwsza.

### Walidacja po stronie serwera

Serwer nie ufa klientowi. Każde zdarzenie sprawdza sam, a niepoprawne odrzuca, więc zmodyfikowany klient albo kilka linijek w konsoli przeglądarki nie dają przewagi w grze.

- **Nick** (`create_room`, `join_room`) musi mieć od 1 do 30 znaków po obcięciu spacji. W przeciwnym razie serwer odpowiada `error`.
- **Konfiguracja floty** (`create_room`) może zawierać tylko klucze `'1'`–`'4'` (liczba masztów), a każda wartość musi być liczbą całkowitą od 0 do 5. Flota musi mieć co najmniej jeden statek, np. `{'4': 1, '3': 2, '2': 2, '1': 4}`.
- **Rozstawienie** (`place_ships`) przyjmuje tylko gracz tego pokoju, tylko przed bitwą i tylko gdy w pokoju jest dwóch graczy. Flota musi dokładnie odpowiadać konfiguracji pokoju (liczba statków każdego rozmiaru), a statki muszą mieścić się na planszy i nie mogą się stykać. Po starcie bitwy floty nie da się już zmienić.
- **Strzał** (`fire_shot`) liczy się tylko w trakcie bitwy, w turze strzelającego i gdy nikt nie czeka na powrót po rozłączeniu. Współrzędne muszą być liczbami całkowitymi 0–9, a w to samo pole nie da się strzelić dwa razy. Po końcu gry kolejne strzały są ignorowane, więc nie da się nabić wygranych w rankingu.

Niepoprawne strzały serwer pomija bez odpowiedzi, bo normalny klient i tak ich nie wysyła. Endpointy statystyk mają limity parametrów: `page` od 1, `limit` od 1 do 50, `search` do 50 znaków. Wartość spoza zakresu daje odpowiedź `422`.

---

## 📄 Licencja

Kod gry jest udostępniony na licencji **MIT** (plik [`LICENSE`](LICENSE)).

Wykorzystane zasoby i ich licencje:

| Zasób | Licencja |
|---|---|
| Ikony [Lucide](https://lucide.dev) (`lucide-react`) | ISC |
| Logo GitHuba z [Simple Icons](https://simpleicons.org) | CC0 |
| Fonty Caveat i Nunito (`@fontsource`) | SIL Open Font License 1.1 |
| react-i18next, i18next, react-markdown | MIT |
