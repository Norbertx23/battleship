import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    """Tworzy schemat przed testami.

    Aplikacja nie robi juz create_all przy starcie, wiec testy musza przejsc
    ta sama sciezka co produkcja - przez init_db.main().
    """
    import init_db

    assert init_db.main() == 0, "init_db.main() zwrocilo blad - schemat nie powstal"
