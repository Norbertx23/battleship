import game_manager as gm


def ship(x, y, size, vertical=False):
    return {"x": x, "y": y, "size": size, "vertical": vertical}


class TestValidateShips:
    def test_poprawne_rozmieszczenie(self):
        ships = [ship(0, 0, 3), ship(0, 2, 2, vertical=True), ship(5, 5, 4)]
        assert gm.validate_ships(ships) is True

    def test_statek_poza_plansza(self):
        assert gm.validate_ships([ship(8, 0, 4)]) is False

    def test_statki_stykajace_sie(self):
        ships = [ship(0, 0, 3), ship(0, 1, 2)]
        assert gm.validate_ships(ships) is False

    def test_statki_nachodzace_na_siebie(self):
        ships = [ship(0, 0, 3), ship(1, 0, 2, vertical=True)]
        assert gm.validate_ships(ships) is False

    def test_pusta_lista(self):
        assert gm.validate_ships([]) is True


class TestCheckHit:
    def test_trafienie_poziome(self):
        assert gm.check_hit([ship(2, 3, 3)], 4, 3) == "hit"

    def test_trafienie_pionowe(self):
        assert gm.check_hit([ship(2, 3, 3, vertical=True)], 2, 5) == "hit"

    def test_pudlo(self):
        assert gm.check_hit([ship(2, 3, 3)], 0, 0) == "miss"


class TestSunkAndWin:
    def test_zatopienie_statku(self):
        ships = [ship(0, 0, 2)]
        shots = [
            {"x": 0, "y": 0, "result": "hit"},
            {"x": 1, "y": 0, "result": "hit"},
        ]
        sunk = gm.get_sunk_ships(ships, shots)
        assert len(sunk) == 1
        assert sunk[0]["size"] == 2

    def test_statek_trafiony_ale_nie_zatopiony(self):
        ships = [ship(0, 0, 3)]
        shots = [{"x": 0, "y": 0, "result": "hit"}]
        assert gm.get_sunk_ships(ships, shots) == []

    def test_wygrana_po_zatopieniu_wszystkich(self):
        ships = [ship(0, 0, 2), ship(5, 5, 1)]
        shots = [
            {"x": 0, "y": 0, "result": "hit"},
            {"x": 1, "y": 0, "result": "hit"},
            {"x": 5, "y": 5, "result": "hit"},
        ]
        assert gm.check_win(ships, shots) is True

    def test_brak_wygranej_przy_czesciowych_trafieniach(self):
        ships = [ship(0, 0, 2), ship(5, 5, 1)]
        shots = [{"x": 0, "y": 0, "result": "hit"}]
        assert gm.check_win(ships, shots) is False

    def test_pudla_nie_licza_sie_do_zatopienia(self):
        ships = [ship(0, 0, 1)]
        shots = [{"x": 0, "y": 0, "result": "miss"}]
        assert gm.check_win(ships, shots) is False
