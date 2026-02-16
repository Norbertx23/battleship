# 🚢 Battleship_NET

Witaj w projekcie **Battleship_NET**! To nowoczesna implementacja gry w statki z trybem multiplayer, zbudowana w architekturze klient-serwer.

## 🛠️ Wymagania

Aby uruchomić projekt, potrzebujesz zainstalowanych:
*   [Python](https://www.python.org/) (wersja 3.8+)
*   [Node.js](https://nodejs.org/) (wersja 16+)

---

## 🚀 Instrukcja Uruchomienia (Krok po Kroku)

Projekt składa się z dwóch niezależnych części: **Backendu** (serwer gry) i **Frontendu** (interfejs gracza). Musisz uruchomić obie, aby gra działała.

### 1. Backend (Serwer)

Backend zarządza logiką gry, pokojami i komunikacją między graczami.

1.  Otwórz terminal i wejdź do folderu `backend`:
    ```bash
    cd backend
    ```

2.  (Opcjonalnie, ale zalecane) Stwórz wirtualne środowisko Python:
    ```bash
    python -m venv venv
    
    # Aktywacja (Windows):
    venv\Scripts\activate
    
    # Aktywacja (Mac/Linux):
    source venv/bin/activate
    ```

3.  Zainstaluj wymagane biblioteki:
    ```bash
    pip install -r requirements.txt
    ```

4.  Uruchom serwer:
    ```bash
    uvicorn main:app --reload
    ```
    ✅ Serwer wystartuje pod adresem: `http://127.0.0.1:8000`

---

### 2. Frontend (Klient)

Frontend to warstwa wizualna, w której grasz.

1.  Otwórz **nowy terminal** (nie zamykaj tego z backendem!) i wejdź do folderu `frontend`:
    ```bash
    cd frontend
    ```

2.  Zainstaluj zależności (tylko za pierwszym razem):
    ```bash
    npm install
    ```

3.  Uruchom aplikację:
    ```bash
    npm run dev
    ```
    ✅ Aplikacja będzie dostępna pod adresem: `http://localhost:5173` (lub podobnym, sprawdź w terminalu).

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

*Battleship_NET © 2026*
