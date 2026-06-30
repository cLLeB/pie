import importlib
import os

from fastapi.testclient import TestClient


def test_cors_header_present_when_origins_configured(monkeypatch):
    monkeypatch.setenv("PIE_CORS_ORIGINS", "http://localhost:5173")
    # Re-import app module so create_app reads the env at construction time.
    import pie_server.app as appmod

    importlib.reload(appmod)
    client = TestClient(appmod.create_app())
    r = client.get("/healthz", headers={"Origin": "http://localhost:5173"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"
    os.environ.pop("PIE_CORS_ORIGINS", None)
    importlib.reload(appmod)
