"""Icono nativo de Bandeja del Sistema (Windows Shell_NotifyIconW via ctypes, cero dependencias)."""
from __future__ import annotations

import os
import sys
import threading
from pathlib import Path
from typing import Callable, Optional

from app.core.config import settings
from app.core.logging import logger

if sys.platform == "win32":
    import ctypes
    from ctypes import wintypes

    user32 = ctypes.windll.user32
    shell32 = ctypes.windll.shell32
    kernel32 = ctypes.windll.kernel32

    LRESULT = getattr(wintypes, "LRESULT", ctypes.c_ssize_t)
    WNDPROC = ctypes.WINFUNCTYPE(
        LRESULT, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM
    )

    WM_DESTROY = 0x0002
    WM_COMMAND = 0x0111
    WM_USER = 0x0400
    WM_TRAYICON = WM_USER + 20
    WM_LBUTTONUP = 0x0202
    WM_LBUTTONDBLCLK = 0x0203
    WM_RBUTTONUP = 0x0205

    NIM_ADD = 0x00000000
    NIM_DELETE = 0x00000002
    NIF_MESSAGE = 0x00000001
    NIF_ICON = 0x00000002
    NIF_TIP = 0x00000004

    IMAGE_ICON = 1
    LR_LOADFROMFILE = 0x00000010
    LR_DEFAULTSIZE = 0x00000040
    IDI_APPLICATION = 32512

    MF_STRING = 0x00000000
    MF_SEPARATOR = 0x00000800
    TPM_LEFTALIGN = 0x0000
    TPM_BOTTOMALIGN = 0x0020
    TPM_NONOTIFY = 0x0080
    TPM_RETURNCMD = 0x0100

    CMD_OPEN_HOME = 1001
    CMD_OPEN_SESSION = 1002
    CMD_OPEN_UPDATES = 1003
    CMD_EXIT_APP = 1099

    class WNDCLASSEXW(ctypes.Structure):
        _fields_ = [
            ("cbSize", wintypes.UINT),
            ("style", wintypes.UINT),
            ("lpfnWndProc", WNDPROC),
            ("cbClsExtra", ctypes.c_int),
            ("cbWndExtra", ctypes.c_int),
            ("hInstance", wintypes.HINSTANCE),
            ("hIcon", wintypes.HICON),
            ("hCursor", wintypes.HANDLE),
            ("hbrBackground", wintypes.HBRUSH),
            ("lpszMenuName", wintypes.LPCWSTR),
            ("lpszClassName", wintypes.LPCWSTR),
            ("hIconSm", wintypes.HICON),
        ]

    class NOTIFYICONDATAW(ctypes.Structure):
        _fields_ = [
            ("cbSize", wintypes.DWORD),
            ("hWnd", wintypes.HWND),
            ("uID", wintypes.UINT),
            ("uFlags", wintypes.UINT),
            ("uCallbackMessage", wintypes.UINT),
            ("hIcon", wintypes.HICON),
            ("szTip", wintypes.WCHAR * 128),
            ("dwState", wintypes.DWORD),
            ("dwStateMask", wintypes.DWORD),
            ("szInfo", wintypes.WCHAR * 256),
            ("uTimeoutOrVersion", wintypes.UINT),
            ("szInfoTitle", wintypes.WCHAR * 64),
            ("dwInfoFlags", wintypes.DWORD),
        ]

    user32.DefWindowProcW.argtypes = [
        wintypes.HWND,
        wintypes.UINT,
        wintypes.WPARAM,
        wintypes.LPARAM,
    ]
    user32.DefWindowProcW.restype = LRESULT
    user32.CreateWindowExW.restype = wintypes.HWND
    user32.CreatePopupMenu.restype = wintypes.HMENU
    user32.LoadImageW.restype = wintypes.HANDLE
    user32.LoadIconW.restype = wintypes.HICON


def _resolve_tray_icon_path() -> Optional[str]:
    candidates = []
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        candidates.extend(
            [
                Path(meipass) / "installer" / "tornio.ico",
                Path(meipass) / "tornio.ico",
                Path(meipass) / "openpdf.ico",
            ]
        )
    if sys.executable:
        exe_dir = Path(sys.executable).resolve().parent
        candidates.extend([exe_dir / "tornio.ico", exe_dir / "openpdf.ico"])
    root = settings.BASE_DIR.parent
    candidates.extend(
        [
            root / "installer" / "tornio.ico",
            root / "installer" / "openpdf.ico",
        ]
    )
    for c in candidates:
        if c.is_file():
            return str(c.resolve())
    return None


class WindowsTrayIcon:
    """Controlador de icono en bandeja del sistema de Windows en hilo daemon."""

    def __init__(
        self,
        on_open_route: Callable[[str], None],
        on_exit: Callable[[], None],
    ) -> None:
        self._on_open_route = on_open_route
        self._on_exit = on_exit
        self._thread: Optional[threading.Thread] = None
        self._hwnd: Optional[int] = None
        self._stop_event = threading.Event()
        self._wndproc_ref = None

    def start(self) -> None:
        if sys.platform != "win32" or self._thread is not None:
            return
        self._thread = threading.Thread(target=self._run_loop, daemon=True, name="TornioTrayThread")
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if sys.platform != "win32":
            return
        hwnd = self._hwnd
        if hwnd:
            try:
                user32.PostMessageW(hwnd, WM_DESTROY, 0, 0)
            except Exception:
                pass

    def _run_loop(self) -> None:
        try:
            hinst = kernel32.GetModuleHandleW(None)
            class_name = "TornioTrayMessageWindow"

            def _wnd_proc(hwnd, msg, wparam, lparam):
                if msg == WM_TRAYICON:
                    if lparam in (WM_LBUTTONUP, WM_LBUTTONDBLCLK):
                        self._on_open_route("/")
                        return 0
                    if lparam == WM_RBUTTONUP:
                        self._show_context_menu(hwnd)
                        return 0
                elif msg == WM_COMMAND:
                    cmd_id = wparam & 0xFFFF
                    self._handle_command(cmd_id)
                    return 0
                elif msg == WM_DESTROY:
                    self._remove_nid(hwnd)
                    user32.PostQuitMessage(0)
                    return 0
                return user32.DefWindowProcW(hwnd, msg, wparam, lparam)

            self._wndproc_ref = WNDPROC(_wnd_proc)
            wc = WNDCLASSEXW()
            wc.cbSize = ctypes.sizeof(WNDCLASSEXW)
            wc.lpfnWndProc = self._wndproc_ref
            wc.hInstance = hinst
            wc.lpszClassName = class_name
            user32.RegisterClassExW(ctypes.byref(wc))

            hwnd = user32.CreateWindowExW(
                0,
                class_name,
                "TornioTrayHost",
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                hinst,
                0,
            )
            if not hwnd:
                return
            self._hwnd = hwnd

            icon_handle = None
            ico_path = _resolve_tray_icon_path()
            if ico_path:
                icon_handle = user32.LoadImageW(
                    0,
                    ico_path,
                    IMAGE_ICON,
                    0,
                    0,
                    LR_LOADFROMFILE | LR_DEFAULTSIZE,
                )
            if not icon_handle:
                icon_handle = user32.LoadIconW(0, IDI_APPLICATION)

            nid = NOTIFYICONDATAW()
            nid.cbSize = ctypes.sizeof(NOTIFYICONDATAW)
            nid.hWnd = hwnd
            nid.uID = 1
            nid.uFlags = NIF_MESSAGE | NIF_ICON | NIF_TIP
            nid.uCallbackMessage = WM_TRAYICON
            nid.hIcon = icon_handle
            nid.szTip = "Tornio - Motor local activo (127.0.0.1)"
            shell32.Shell_NotifyIconW(NIM_ADD, ctypes.byref(nid))

            msg = wintypes.MSG()
            while not self._stop_event.is_set() and user32.GetMessageW(ctypes.byref(msg), 0, 0, 0) > 0:
                user32.TranslateMessage(ctypes.byref(msg))
                user32.DispatchMessageW(ctypes.byref(msg))
        except Exception as exc:
            logger.warning("Bandeja del sistema desactivada en esta sesion: %s", exc)
        finally:
            if self._hwnd:
                self._remove_nid(self._hwnd)
                try:
                    user32.DestroyWindow(self._hwnd)
                except Exception:
                    pass
                self._hwnd = None

    @staticmethod
    def _remove_nid(hwnd: int) -> None:
        try:
            nid = NOTIFYICONDATAW()
            nid.cbSize = ctypes.sizeof(NOTIFYICONDATAW)
            nid.hWnd = hwnd
            nid.uID = 1
            shell32.Shell_NotifyIconW(NIM_DELETE, ctypes.byref(nid))
        except Exception:
            pass

    def _show_context_menu(self, hwnd: int) -> None:
        menu = user32.CreatePopupMenu()
        if not menu:
            return
        try:
            user32.AppendMenuW(menu, MF_STRING, CMD_OPEN_HOME, "Abrir Tornio")
            user32.AppendMenuW(menu, MF_STRING, CMD_OPEN_SESSION, "Archivos de Sesion")
            user32.AppendMenuW(menu, MF_STRING, CMD_OPEN_UPDATES, "Buscar actualizaciones")
            user32.AppendMenuW(menu, MF_SEPARATOR, 0, None)
            user32.AppendMenuW(menu, MF_STRING, CMD_EXIT_APP, "Salir por completo")

            pt = wintypes.POINT()
            user32.GetCursorPos(ctypes.byref(pt))
            user32.SetForegroundWindow(hwnd)
            chosen = user32.TrackPopupMenu(
                menu,
                TPM_LEFTALIGN | TPM_BOTTOMALIGN | TPM_RETURNCMD | TPM_NONOTIFY,
                pt.x,
                pt.y,
                0,
                hwnd,
                None,
            )
            if chosen:
                self._handle_command(int(chosen))
        finally:
            user32.DestroyMenu(menu)

    def _handle_command(self, cmd_id: int) -> None:
        if cmd_id == CMD_OPEN_HOME:
            self._on_open_route("/")
        elif cmd_id == CMD_OPEN_SESSION:
            self._on_open_route("/workspace")
        elif cmd_id == CMD_OPEN_UPDATES:
            self._on_open_route("/settings?tab=updates")
        elif cmd_id == CMD_EXIT_APP:
            self._on_exit()
