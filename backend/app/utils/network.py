"""Utilidades de red seguras con protección anti-SSRF para módulos con acceso a Internet."""
import ipaddress
import re
import socket
import time
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.core.exceptions import BusinessRuleError

BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "0.0.0.0",
    "::1",
    "[::1]",
    "metadata.google.internal",
}


def _is_forbidden_ip(ip_str: str) -> bool:
    try:
        clean_ip = ip_str.strip("[]").split("%")[0]
        ip_obj = ipaddress.ip_address(clean_ip)
        return (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        )
    except ValueError:
        return False


def validate_public_http_url(raw_url: str) -> str:
    """
    Valida que una URL sea HTTP/HTTPS pública y segura frente a SSRF.
    Bloquea direcciones de loopback, redes privadas RFC1918, link-local y metadatos cloud.
    """
    if not raw_url or not isinstance(raw_url, str) or not raw_url.strip():
        raise BusinessRuleError("Debes proporcionar una URL válida (http:// o https://).")

    url = raw_url.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        url = f"https://{url}"

    try:
        parsed = urlparse(url)
    except Exception:
        raise BusinessRuleError("El formato de la URL proporcionada no es válido.")

    if parsed.scheme.lower() not in ("http", "https"):
        raise BusinessRuleError("Solo se permiten URLs con protocolo HTTP o HTTPS.")

    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        raise BusinessRuleError("La URL debe incluir un dominio o servidor válido.")

    if (
        hostname in BLOCKED_HOSTNAMES
        or hostname.endswith(".local")
        or hostname.endswith(".internal")
        or hostname.endswith(".localhost")
    ):
        raise BusinessRuleError(
            "Por seguridad (protección SSRF), no se permiten conexiones hacia localhost o dominios internos."
        )

    if _is_forbidden_ip(hostname):
        raise BusinessRuleError(
            "Por seguridad (protección SSRF), no se permiten direcciones IP privadas, locales o reservadas."
        )

    try:
        addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror:
        raise BusinessRuleError(f"No se pudo resolver el dominio '{hostname}'. Verifica la URL o tu conexión.")
    except Exception as exc:
        raise BusinessRuleError(f"Error validando el dominio '{hostname}': {str(exc)}")

    for entry in addr_info:
        sockaddr = entry[4]
        if sockaddr and len(sockaddr) >= 1:
            resolved_ip = str(sockaddr[0])
            if _is_forbidden_ip(resolved_ip):
                raise BusinessRuleError(
                    "Por seguridad (protección SSRF), el dominio resuelve a una red privada o local no permitida."
                )

    return url


def _extract_html_title(raw_bytes: bytes) -> Optional[str]:
    try:
        sample = raw_bytes[:16384].decode("utf-8", errors="ignore")
        match = re.search(r"<title[^>]*>(.*?)</title>", sample, flags=re.IGNORECASE | re.DOTALL)
        if match:
            title = re.sub(r"\s+", " ", match.group(1)).strip()
            return title[:140] if title else None
    except Exception:
        pass
    return None


async def check_url_reachability(raw_url: str, timeout: float = 5.0) -> Dict[str, Any]:
    """
    Comprueba en línea si una URL pública responde correctamente.
    Retorna metadatos de estado HTTP, tipo de contenido, título y latencia en milisegundos.
    """
    validated_url = validate_public_http_url(raw_url)
    start = time.perf_counter()
    headers = {
        "User-Agent": f"OpenPDF/{settings.VERSION} (+https://github.com/albert-dilas/OpenPDF)",
        "Accept": "text/html,application/xhtml+xml,application/pdf,*/*;q=0.8",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, max_redirects=5) as client:
            response = await client.get(validated_url, headers=headers)
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            final_url = str(response.url)
            # Validar también la URL final tras posibles redirecciones
            validate_public_http_url(final_url)

            content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
            title = _extract_html_title(response.content) if "html" in content_type else None
            reachable = 200 <= response.status_code < 400

            return {
                "url": validated_url,
                "final_url": final_url,
                "reachable": reachable,
                "status_code": response.status_code,
                "content_type": content_type or None,
                "title": title,
                "elapsed_ms": elapsed_ms,
                "error": None if reachable else f"El servidor respondió con estado HTTP {response.status_code}.",
            }
    except BusinessRuleError:
        raise
    except httpx.TimeoutException:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return {
            "url": validated_url,
            "final_url": validated_url,
            "reachable": False,
            "status_code": None,
            "content_type": None,
            "title": None,
            "elapsed_ms": elapsed_ms,
            "error": "Tiempo de espera agotado al conectar con el servidor remoto.",
        }
    except Exception as exc:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return {
            "url": validated_url,
            "final_url": validated_url,
            "reachable": False,
            "status_code": None,
            "content_type": None,
            "title": None,
            "elapsed_ms": elapsed_ms,
            "error": f"No se pudo conectar con la URL: {str(exc)}",
        }
