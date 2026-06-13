from fastapi.testclient import TestClient

from main import fastapi_app

client = TestClient(fastapi_app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Battleship API"}


def test_healthcheck():
    response = client.get("/healthcheck")
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
