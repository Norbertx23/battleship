# 🚢 Battleship_NET

Sieciowa gra w statki dla dwóch graczy — klasyczne zasady, cyberpunkowy interfejs i rozgrywka w czasie rzeczywistym przez WebSocket.

**Zagraj online: [battleship.swistak.fun](https://battleship.swistak.fun)**

---

## 🎮 Jak grać

### Rozpoczęcie

Gra jest dla **dwóch osób** i opiera się na kodach pokojów:

1. **Gracz 1** klika `CREATE ROOM`, wpisuje nick i wybiera konfigurację floty. Dostaje 6-znakowy kod pokoju.
2. **Gracz 2** klika `JOIN ROOM`, wpisuje nick i wkleja otrzymany kod.
3. Obaj gracze rozstawiają flotę i zatwierdzają — bitwa zaczyna się automatycznie.

### Rozstawianie floty

| Akcja | Sterowanie |
|---|---|
| Postawienie statku | przeciągnij z panelu `AVAILABLE SHIPS` na planszę |
| Obrót | klawisz `R`, prawy przycisk myszy, lub przycisk `ROTATE` |
| Przesunięcie | przeciągnij już postawiony statek |
| Usunięcie | zaznacz statek i wciśnij `Delete` / `Backspace` |
| Obrót na telefonie | dotknij drugim palcem podczas przeciągania |

Statki **nie mogą się stykać** — ani bokami, ani rogami. Nieprawidłowe ustawienie podświetla się na czerwono, a przycisk `CONFIRM DEPLOYMENT` pozostaje zablokowany do momentu poprawnego rozstawienia całej floty.

### Bitwa

- Klikasz pole na **radarze** (plansza przeciwnika), żeby strzelić.
- **Trafienie daje kolejny ruch.** Pudło oddaje turę przeciwnikowi.
- Nagłówek u góry jest **zielony**, gdy Twoja kolej, i **czerwony**, gdy czeka się na przeciwnika.
- Panel `ENEMY FLEET` pokazuje, ile statków każdego rozmiaru zostało przeciwnikowi.
- **Tryb oznaczeń** (`MARK MODE` lub prawy przycisk myszy) pozwala żółtym znacznikiem notować pola, gdzie statku na pewno nie ma. To tylko Twoja notatka — nie wysyła strzału.

Wygrywa ten, kto pierwszy zatopi całą flotę przeciwnika.

### Po grze

Po zakończeniu bitwy przycisk **`SHOW BOARD`** odsłania planszę: na **zielono** zobaczysz, gdzie stały statki przeciwnika, których nie trafiłeś. Wynik trafia do globalnej historii meczów i rankingu widocznych w lobby.

### Rozłączenie

Jeśli stracisz połączenie w trakcie bitwy, masz **60 sekund na powrót** — stan gry (Twoja flota, oddane strzały, czyja kolej) zostanie odtworzony. Po tym czasie przeciwnik wygrywa walkowerem.

---

## 🛠️ Technologie

**Frontend**
- React 19 + Vite 7
- Tailwind CSS 4
- Socket.IO client — komunikacja w czasie rzeczywistym

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

Aby zagrać samemu ze sobą, otwórz dwie karty (jedną w trybie incognito).

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

**Od klienta:** `create_room`, `join_room`, `place_ships`, `fire_shot`, `leave_room`

**Do klienta:** `room_created`, `session`, `game_start`, `battle_start`, `shot_result`, `game_over`, `opponent_disconnected`, `opponent_reconnected`, `game_resumed`, `player_disconnected`, `error`

Powrót po rozłączeniu działa na tokenie sesji: przy tworzeniu lub dołączaniu do pokoju serwer wysyła zdarzenie `session` z jednorazowym tokenem, który klient zapisuje w `localStorage`. Ponowne `join_room` z tym samym tokenem jest rozpoznawane jako powrót tego samego gracza i odtwarza stan rozgrywki zamiast tworzyć nowego uczestnika.

---

## 📄 Licencja

ISC
