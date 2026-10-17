import socket
from fastapi.testclient import TestClient
import app.main as main_module
from app.main import app, resolve_frontend_path, select_port

client = TestClient(app)


def test_frontend_serving_and_path_traversal_blocked(tmp_path, monkeypatch):
    frontend_out = tmp_path / "out"
    frontend_out.mkdir()
    (frontend_out / "index.html").write_text("<html>Home</html>", encoding="utf-8")
    (frontend_out / "compress-pdf.html").write_text("<html>Compress</html>", encoding="utf-8")
    secret_file = tmp_path / "secret.txt"
    secret_file.write_text("TOP_SECRET", encoding="utf-8")

    monkeypatch.setattr(main_module, "FRONTEND_DIST_DIR", frontend_out)

    # Rutas válidas
    res_index = client.get("/")
    assert res_index.status_code == 200
    assert "Home" in res_index.text

    res_tool = client.get("/compress-pdf")
    assert res_tool.status_code == 200
    assert "Compress" in res_tool.text

    # Intentos de path traversal directos sobre el resolvedor y vía HTTP
    assert resolve_frontend_path(frontend_out, "../secret.txt") is None
    assert resolve_frontend_path(frontend_out, "..\\secret.txt") is None
    assert resolve_frontend_path(frontend_out, "../../etc/passwd") is None

    res_traversal_1 = client.get("/..%2fsecret.txt")
    assert res_traversal_1.status_code == 404
    assert "TOP_SECRET" not in res_traversal_1.text

    res_traversal_2 = client.get("/..%5csecret.txt")
    assert res_traversal_2.status_code == 404
    assert "TOP_SECRET" not in res_traversal_2.text


def test_select_port_respects_env_and_fallback(monkeypatch):
    # Ocupar un puerto y verificar que select_port elige el siguiente si el primero está ocupado
    monkeypatch.setattr(main_module, "is_port_free", lambda host, port: port == 8002)
    monkeypatch.delenv("OPENPDF_PORT", raising=False)
    assert select_port("127.0.0.1") == 8002

    # Si OPENPDF_PORT está libre, lo usa
    monkeypatch.setenv("OPENPDF_PORT", "8005")
    monkeypatch.setattr(main_module, "is_port_free", lambda host, port: port == 8005)
    assert select_port("127.0.0.1") == 8005
