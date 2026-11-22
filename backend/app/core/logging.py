import logging
import sys


def get_logger(name: str = "tornio") -> logging.Logger:
    """Retorna un logger configurado para la aplicacion."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        stream = sys.stderr if sys.stderr is not None else sys.stdout
        handler = logging.StreamHandler(stream)
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger


logger = get_logger("tornio")
