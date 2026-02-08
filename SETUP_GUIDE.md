# Przewodnik Instalacji Projektu Battleship

Ten dokument wyjaśnia, jak skonfigurować środowisko i uruchomić aplikację, oraz opisuje strukturę projektu.

## 1. Backend (Python/FastAPI)

### Struktura
Kod backendu znajduje się w katalogu `backend/`.

### Instalacja
Aby skonfigurować środowisko Python:

```bash
cd backend
# Utwórz wirtualne środowisko (opcjonalne, ale zalecane)
python -m venv .venv
source .venv/bin/activate  # Na Windows: .venv\Scripts\activate

# Zainstaluj zależności
pip install -r requirements.txt
```

### Uruchomienie
```bash
uvicorn main:app --reload
```

## 2. Frontend (React/Vite)

### Struktura
Kod frontendu znajduje się w katalogu `frontend/`.

### Instalacja
Zależności zostały zainstalowane za pomocą:

```bash
cd frontend
npm install
npm install socket.io-client
npm install -D tailwindcss postcss autoprefixer

### Co to jest Vite?
**Vite** (czyt. "vit", co po francusku znaczy "szybko") to narzędzie do budowania nowoczesnych aplikacji webowych. Zastępuje starsze i wolniejsze rozwiązania (jak Create React App).
- **Startuje natychmiastowo**: Dzięki wykorzystaniu natywnych modułów ES w przeglądarce.
- **Szybkie odświeżanie (HMR)**: Zmiany w kodzie widać w ułamku sekundy, bez przeładowania całej strony.
- **Zoptymalizowany build**: Tworzy bardzo lekkie i szybkie pliki produkcyjne.

### Konfiguracja
- `postcss.config.js` został zaktualizowany, aby używać `@tailwindcss/postcss`.
npm install @tailwindcss/postcss
# Konfiguracja Tailwind v4 wymaga odpowiedniego pluginu PostCSS
npx tailwindcss init -p
```

### Uruchomienie
```bash
npm run dev
```

## 3. Struktura Projektu
```
battleship/
├── backend/            # Backend FastAPI
│   ├── requirements.txt
│   └── ...
├── frontend/           # Frontend React
│   ├── package.json
│   ├── tailwind.config.js
│   └── ...
└── SETUP_GUIDE.md      # Ten plik
```

## 4. Szczegółowy Opis Plików

Poniżej znajduje się wyjaśnienie przeznaczenia każdego pliku utworzonego w projekcie.

### Backend (`backend/`)

- **`main.py`**
  Główny plik startowy aplikacji. Tutaj inicjowana jest instancja `FastAPI`, konfigurowane są podstawowe ustawienia serwera oraz (w przyszłości) podłączane będą routery i obsługa WebSocket. To "serce" Twojego serwera.

- **`database.py`**
  Zawiera konfigurację połączenia z bazą danych PostgreSQL. Definiuje `engine` (silnik bazy danych) oraz `SessionLocal`, która służy do tworzenia sesji dla każdego zapytania.

- **`models.py`**
  Definiuje modele bazy danych przy użyciu SQLAlchemy (ORM). Każda klasa tutaj (np. `MatchHistory`) odpowiada tabeli w bazie danych. To tutaj określasz, jakie dane są trwałe (zapisywane na dysku).

- **`game_manager.py`**
  Odpowiada za logikę gry przechowywaną w pamięci RAM. Ponieważ gra toczy się w czasie rzeczywistym, stan planszy, położenie statków i tury graczy muszą być dostępne natychmiastowo, bez ciągłego odpytywania bazy danych. Ten plik będzie zarządzał aktywnymi "pokojami" (rooms).

- **`sockets.py`**
  Obsługuje komunikację w czasie rzeczywistym (Socket.IO). Tutaj zdefiniowane będą zdarzenia takie jak `connect` (dołączenie gracza), `fire` (oddanie strzału) czy `disconnect` (rozłączenie). To most między graczami.

- **`requirements.txt`**
  Lista wszystkich zewnętrznych bibliotek Python potrzebnych do działania projektu (takich jak `fastapi`, `sqlalchemy`, `python-socketio`).

### Frontend (`frontend/`)

- **`src/components/GameBoard.jsx`**
  Komponent Reacta odpowiedzialny za wyświetlanie siatki gry (10x10). Będzie obsługiwał interakcje gracza, takie jak kliknięcie w pole, aby oddać strzał, oraz wizualizację statków i trafień.

- **`src/components/Lobby.jsx`**
  Ekran startowy gry. Tutaj gracz będzie wpisywał swój nick oraz decydował, czy chce stworzyć nowy pokój, czy dołączyć do istniejącego (wpisując kod pokoju).

- **`src/components/Leaderboard.jsx`**
  Komponent wyświetlający tabelę wyników. Będzie pobierał dane z backendu (z bazy danych) poprzez API REST i wyświetlał listę najlepszych graczy.

- **`src/hooks/useSocket.js`**
  Niestandardowy hook (Custom Hook) Reacta. Jego zadaniem jest zarządzanie połączeniem Socket.IO w jednym miejscu. Dzięki niemu inne komponenty mogą łatwo wysyłać i odbierać zdarzenia z serwera bez powielania kodu połączenia.

- **`src/index.css`**
  Główny plik stylów CSS. Zostały do niego dodane dyrektywy `@tailwind`, co pozwala na używanie klas narzędziowych Tailwind CSS w całej aplikacji.

- **`tailwind.config.js`**
  Plik konfiguracyjny biblioteki Tailwind CSS. Określa m.in., które pliki mają być skanowane w poszukiwaniu klas (np. pliki `.jsx` w folderze `src`), aby wygenerować odpowiedni CSS.

- **`postcss.config.js`**
  Plik konfiguracyjny dla PostCSS. Jest to narzędzie wymagane przez Tailwind CSS do przetwarzania nowoczesnych funkcji CSS i dodawania prefiksów przeglądarkowych (poprzez wtyczkę `autoprefixer`).
