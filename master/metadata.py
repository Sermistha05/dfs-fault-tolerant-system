import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List

DATA_DIR = Path(__file__).parent
NODES_FILE = DATA_DIR / "nodes.json"
FILES_FILE = DATA_DIR / "files.json"


def _read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text()) or {}
    except (json.JSONDecodeError, OSError):
        return {}


def _write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2))


@dataclass
class ChunkInfo:
    chunk_id: str
    node_id: str
    node_address: str
    size: int = 0


@dataclass
class FileMetadata:
    filename: str
    total_chunks: int
    chunks: List[ChunkInfo] = field(default_factory=list)


class MetadataStore:
    """Persistent store for nodes and file metadata backed by JSON files."""

    def __init__(self):
        self._nodes: Dict[str, str] = _read_json(NODES_FILE)  # node_id → address
        raw_files = _read_json(FILES_FILE)                     # filename → serialised metadata
        self._files: Dict[str, FileMetadata] = {
            name: FileMetadata(
                filename=name,
                total_chunks=v["total_chunks"],
                chunks=[ChunkInfo(**c) for c in v["chunks"]],
            )
            for name, v in raw_files.items()
        }

    # --- Node registry ---

    def add_node(self, node_id: str, address: str) -> None:
        self._nodes[node_id] = address
        _write_json(NODES_FILE, self._nodes)

    def get_nodes(self) -> Dict[str, str]:
        return dict(self._nodes)

    def update_node(self, node_id: str, address: str) -> None:
        self._nodes[node_id] = address
        _write_json(NODES_FILE, self._nodes)

    def remove_node(self, node_id: str) -> None:
        self._nodes.pop(node_id, None)
        _write_json(NODES_FILE, self._nodes)

    # --- File metadata ---

    def add_file(self, metadata: FileMetadata) -> None:
        self._files[metadata.filename] = metadata
        _write_json(FILES_FILE, self._serialise_files())

    def get_file(self, filename: str) -> FileMetadata | None:
        return self._files.get(filename)

    def get_files(self) -> Dict[str, dict]:
        return {
            name: {"total_chunks": meta.total_chunks, "chunks": [vars(c) for c in meta.chunks]}
            for name, meta in self._files.items()
        }

    def delete_file(self, filename: str) -> None:
        self._files.pop(filename, None)
        _write_json(FILES_FILE, self._serialise_files())

    def get_stats(self) -> dict:
        total_storage = sum(
            c.size for meta in self._files.values() for c in meta.chunks
        )
        return {
            "total_nodes": len(self._nodes),
            "total_files": len(self._files),
            "total_storage_used": total_storage,
        }

    def _serialise_files(self) -> dict:
        return {
            name: {"total_chunks": meta.total_chunks, "chunks": [vars(c) for c in meta.chunks]}
            for name, meta in self._files.items()
        }
