from dataclasses import dataclass, field
from typing import Dict, List


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
    """In-memory store for nodes and file metadata. Replace with persistent DB for production."""

    def __init__(self):
        self._nodes: Dict[str, str] = {}          # node_id → address
        self._files: Dict[str, FileMetadata] = {} # filename → FileMetadata

    # --- Node registry ---

    def add_node(self, node_id: str, address: str) -> None:
        self._nodes[node_id] = address

    def get_nodes(self) -> Dict[str, str]:
        return dict(self._nodes)

    def remove_node(self, node_id: str) -> None:
        self._nodes.pop(node_id, None)

    # --- File metadata ---

    def add_file(self, metadata: FileMetadata) -> None:
        self._files[metadata.filename] = metadata

    def get_file(self, filename: str) -> FileMetadata | None:
        return self._files.get(filename)

    def get_files(self) -> Dict[str, dict]:
        return {
            name: {"total_chunks": meta.total_chunks, "chunks": [vars(c) for c in meta.chunks]}
            for name, meta in self._files.items()
        }

    def delete_file(self, filename: str) -> None:
        self._files.pop(filename, None)
