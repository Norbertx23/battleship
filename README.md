# 🚢 Battleship_NET

Witaj w projekcie **Battleship_NET**! To nowoczesna implementacja gry w statki z trybem multiplayer, zbudowana w architekturze klient-serwer.

## 🛠️ Wymagania

Aby uruchomić projekt, potrzebujesz zainstalowanych:
*   [Python](https://www.python.org/) (wersja 3.8+)
*   [Node.js](https://nodejs.org/) (wersja 16+)

---


## 🎮 Jak zacząć grę?

1.  Upewnij się, że oba terminale działają (Backend i Frontend).
2.  Otwórz w przeglądarce adres Frontendu.
3.  **Gracz 1**: Kliknij "CREATE ROOM", wpisz swój nick i ustaw statki.
4.  **Gracz 2**: Skopiuj kod pokoju od Gracza 1, kliknij "JOIN ROOM" i dołącz do gry.
5.  Miłej zabawy!

---

## 📂 Struktura Projektu

*   `/backend` - Logika serwera (FastAPI, Socket.IO, Baza danych).
*   `/frontend` - Interfejs użytkownika (React, Tailwind CSS).

---

## 🐳 Wdrożenie na Homelab / Serwer (Docker)

Zamiast odpalać grę z dwóch oddzielnych terminali u siebie, całość używa architektury Dockera. Wszystko co musisz zrobić, to wysłać pliki i odpalić jeden plik Compose!

### 1. Kopiowanie na serwer (Aktualizacja Kodu)
Komenda ignoruje wielkie foldery (Node_modules/Venv) i błyskawicznie przesyła projekt na Twój Homelab (zmień docelowy adrees IP serwera na swój):
```bash
rsync -avz --exclude 'node_modules' --exclude '.venv' --exclude '__pycache__' --exclude 'dist' ./ uzytkownik@192.168.1.200:~/battleship
```

### 2. Włączenie Kontenerów i Gry
Będąc zalogowanym na serwer w folderze `battleship`, przebuduj i włącz aplikację w tle jednym rzutem.
```bash
docker compose up -d --build
```
*(Gdy tylko skrypt się zakończy, wejdź w przeglądarce po prostu na adres serwera `http://192.168.1.200/`)*

### 3. Pierwsze uruchomienie (Inicjalizacja Bazy Danych)
Gdy zainstalujesz grę po raz pierwszy, Twoja baza danych PostgreSQL jest pusta (brakuje tabel). Odpal w pracującym dockerze skrypt, który ją zbuduje!
```bash
docker exec -it battleship_backend python init_db.py
```

### 4. Wyłączanie Gry i Logi (Utrzymanie)
Kiedy gra napotka 500 Internal Error, albo chcesz ją "zdjąć" z serwera:
*   **Wyłączenie (Zdjęcie z sieci):**
    ```bash
    docker compose down
    ```
*   **Podgląd błędów Pythona (Ostatnie 50 linii):**
    ```bash
    docker logs battleship_backend --tail 50
    ```

---

## 🩺 Healthcheck

Backend wystawia endpoint `GET /healthcheck`, który sprawdza połączenie z bazą danych:
*   `200 {"status": "ok", "database": "ok"}` — wszystko działa.
*   `503 {"status": "error", "database": "unreachable"}` — baza jest niedostępna.

Docker Compose używa go automatycznie (healthcheck kontenera), a pipeline CI/CD weryfikuje nim każdy deploy. Ręczne sprawdzenie:
```bash
curl http://192.168.1.200:8001/healthcheck
```

---

## 🔄 CI/CD (GitHub Actions)

Każdy `git push` na branch `main` uruchamia pipeline (`.github/workflows/ci-cd.yml`):

1.  **Testy backendu** — pytest z prawdziwym PostgreSQL (logika gry + endpointy API).
2.  **Build frontendu** — `npm ci && npm run build` (wyłapuje błędy kompilacji Reacta/Vite).
3.  **Budowanie obrazów Dockera** — weryfikacja obu Dockerfile.
4.  **Deploy na homelab** — tylko gdy wszystkie powyższe przejdą; runner na serwerze odpala `docker compose up -d --build` i weryfikuje `/healthcheck`.

Pull requesty uruchamiają tylko kroki 1–3 (bez deployu).

### Jednorazowa konfiguracja

**1. Sekrety repozytorium** (GitHub → Settings → Secrets and variables → Actions → New repository secret):
*   `POSTGRES_USER`
*   `POSTGRES_PASSWORD`
*   `POSTGRES_DB`

**2. Self-hosted runner na serwerze** (GitHub → Settings → Actions → Runners → New self-hosted runner → Linux). Skopiuj wyświetlone komendy i wykonaj je na homelabie, a potem zainstaluj runnera jako usługę:
```bash
cd ~/actions-runner
sudo ./svc.sh install
sudo ./svc.sh start
```
Runner łączy się z GitHubem połączeniem **wychodzącym** — nie wymaga otwierania żadnych portów na routerze (działa też za CGNAT).

Po tej konfiguracji ręczny `rsync` z sekcji wyżej nie jest już potrzebny — wystarczy `git push`.

---

## 🖥️ Aplikacja Desktopowa (Cienki Klient)

Możesz zbudować aplikację desktopową, która połączy się z Twoją instancją gry (homelab / serwer LAN), działając jako szybka do uruchomienia "okienkowa" przeglądarka bez paska adresu.

1.  Zainstaluj zależności (wymaga Node.js):
    ```bash
    cd desktop-client
    npm install
    ```

2.  Zbuduj aplikację dla swojego systemu (Windows, macOS lub Linux):
    *   **macOS:**
        ```bash
        npm run build:mac
        ```
    *   **Windows:**
        ```bash
        npm run build:win
        ```
    Gotowe pliki instalacyjne (`.exe`, `.dmg`) pojawią się w folderze `desktop-client/dist/`.
