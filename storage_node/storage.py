import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)


def save_chunk(chunk_id: str, data: bytes) -> Path:
    """Persist a chunk to disk. Returns the path written."""
    path = DATA_DIR / chunk_id
    path.write_bytes(data)
    logger.info("Saved chunk %s (%d bytes)", chunk_id, len(data))
    return path


def load_chunk(chunk_id: str) -> bytes:
    """Read a chunk from disk. Raises FileNotFoundError if missing."""
    path = DATA_DIR / chunk_id
    if not path.exists():
        raise FileNotFoundError(f"Chunk '{chunk_id}' not found")
    return path.read_bytes()


def delete_chunk(chunk_id: str) -> bool:
    """Delete a chunk from disk. Returns True if deleted, False if not found."""
    path = DATA_DIR / chunk_id
    if path.exists():
        path.unlink()
        logger.info("Deleted chunk %s", chunk_id)
        return True
    return False


def list_chunks() -> list[str]:
    """Return all stored chunk IDs."""
    return [p.name for p in DATA_DIR.iterdir() if p.is_file()]
