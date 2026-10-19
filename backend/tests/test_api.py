from fastapi.testclient import TestClient

from main import fastapi_app

client = TestClient(fastapi_app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Battleship API"}


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_recent_matches_zwraca_liste():
    response = client.get("/stats/recent-matches")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body


def test_top_players_zwraca_liste():
    response = client.get("/stats/top-players")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_api_nie_odsyla_naglowkow_cors_dla_obcej_domeny():
    response = client.get("/stats/top-players", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in response.headers


def test_recent_matches_odrzuca_ujemna_strone():
    response = client.get("/stats/recent-matches?page=-5")
    assert response.status_code == 422


def test_recent_matches_ogranicza_limit():
    response = client.get("/stats/recent-matches?limit=100000")
    assert response.status_code == 422
