import pytest

from pie_server.store import Store, SqliteStore


@pytest.mark.parametrize("make_store", [lambda _t: Store(), lambda _t: SqliteStore(":memory:")])
def test_event_and_certificate_roundtrip(make_store, tmp_path):
    store = make_store(tmp_path)
    assert store.append_events("s1", [{"type": "a"}, {"type": "b"}]) == 2
    assert store.events_for("s1") == [{"type": "a"}, {"type": "b"}]
    assert store.events_for("unknown") == []

    cert = {"root": "r1", "alg": "HMAC-SHA256", "signedAt": 1, "signature": "sig"}
    store.save_certificate(cert)
    assert store.certificate("r1") == cert
    assert store.certificate("missing") is None


def test_sqlite_store_persists_across_instances(tmp_path):
    db = str(tmp_path / "pie.db")
    s1 = SqliteStore(db)
    s1.append_events("sess", [{"type": "focus.lost"}])
    s1.save_certificate({"root": "abc", "signature": "z"})

    # A fresh store object on the same file sees the persisted data.
    s2 = SqliteStore(db)
    assert s2.events_for("sess") == [{"type": "focus.lost"}]
    assert s2.certificate("abc") == {"root": "abc", "signature": "z"}
