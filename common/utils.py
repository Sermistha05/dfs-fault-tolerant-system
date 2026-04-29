from pathlib import Path
from typing import Generator


CHUNK_SIZE = 256 * 1024  # 256 KB


def split_bytes(filename: str, data: bytes, chunk_size: int = CHUNK_SIZE) -> list[tuple[str, bytes]]:
    """
    Split raw bytes into (chunk_id, data) pairs.
    chunk_id format: <filename>_<index>  e.g. file_0, file_1
    """
    return [
        (f"{filename}_{i}", data[off: off + chunk_size])
        for i, off in enumerate(range(0, len(data), chunk_size))
    ]


def chunk_file(filepath: Path, chunk_size: int = CHUNK_SIZE) -> Generator[tuple[str, bytes], None, None]:
    """
    Read a file and yield (chunk_id, data) tuples.
    chunk_id format: <filename>_part_<index>  e.g. report.pdf_part_0
    """
    filename = filepath.name
    with filepath.open("rb") as f:
        index = 0
        while chunk := f.read(chunk_size):
            yield f"{filename}_part_{index}", chunk
            index += 1


def reassemble_chunks(chunks: list[bytes], dest: Path) -> Path:
    """
    Write an ordered list of byte chunks to dest as a single file.
    Returns the destination path.
    """
    dest.write_bytes(b"".join(chunks))
    return dest


def build_chunk_id(filename: str, index: int) -> str:
    """Canonical chunk ID used across master, storage nodes, and client."""
    return f"{filename}_part_{index}"


def parse_chunk_id(chunk_id: str) -> tuple[str, int]:
    """
    Reverse of build_chunk_id.
    Returns (filename, index). Raises ValueError on bad format.
    """
    try:
        base, _, index_str = chunk_id.rpartition("_part_")
        return base, int(index_str)
    except (ValueError, AttributeError) as e:
        raise ValueError(f"Invalid chunk_id format: '{chunk_id}'") from e
