"""Inicjalizacja schematu bazy - uruchamiana jako osobny krok przed startem API.

Nie jest importowana przez main.py: aplikacja nie tworzy juz tabel przy starcie.
Uruchamiana w compose jako serwis `init-db` (ten sam obraz co api), a api czeka
na nia przez `condition: service_completed_successfully`.

Kod wyjscia: 0 = sukces, 1 = blad (blokuje start api).
"""

import logging
import sys

from sqlalchemy import inspect, text

import models  # noqa: F401  - rejestruje modele w Base.metadata
from database import Base, engine

# Stala dla pg_advisory_xact_lock - chroni przed wyscigiem, gdy dwie instancje
# init-db wystartuja rownoczesnie (np. rownolegly deploy).
ADVISORY_LOCK_ID = 918273645

log = logging.getLogger("init_db")


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    try:
        with engine.begin() as conn:
            # Blokada jest transakcyjna - zwalnia sie sama przy commit/rollback.
            # Dostepna tylko w Postgresie; lokalny dev na SQLite pomija ten krok.
            if conn.dialect.name == "postgresql":
                log.info("Czekam na advisory lock %s...", ADVISORY_LOCK_ID)
                conn.execute(text("SELECT pg_advisory_xact_lock(:lock_id)"),
                             {"lock_id": ADVISORY_LOCK_ID})
                log.info("Advisory lock uzyskany.")

            before = set(inspect(conn).get_table_names())

            Base.metadata.create_all(bind=conn)

            after = set(inspect(conn).get_table_names())

        created = sorted(after - before)
        if created:
            log.info("Utworzono tabele (%d): %s", len(created), ", ".join(created))
        else:
            log.info("Brak nowych tabel - schemat aktualny (%d istniejacych: %s).",
                     len(after), ", ".join(sorted(after)))
        return 0

    except Exception:
        log.exception("Inicjalizacja bazy nie powiodla sie.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
