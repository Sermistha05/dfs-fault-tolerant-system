#this file is the client interface for uploading and downloading files to/from the DFS. It interacts with the 
#master to get node info and with storage nodes to store/fetch chunks. The upload/download logic is not fully 
#implemented yet, but the structure is in place for future development.
# The client uses httpx for HTTP requests and relies on the common utils for chunking and reassembly.
# The client can be extended to include features like progress tracking, retry logic, and more sophisticated 
# node selection strategies.
import logging
from pathlib import Path
from typing import List
import httpx

from common.utils import chunk_file, reassemble_chunks

logger = logging.getLogger(__name__)


class DFSClient:
    def __init__(self, master_url: str = "http://localhost:8000"):
        self.master_url = master_url.rstrip("/")

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    def upload(self, filepath: str | Path, chunk_size: int = 1024 * 1024) -> dict:
        """
        Split a file into chunks and distribute them across storage nodes.
        TODO: implement node selection and replication strategy.
        """
        filepath = Path(filepath)
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")

        nodes = self._get_nodes()
        if not nodes:
            raise RuntimeError("No storage nodes available")

        chunks = list(chunk_file(filepath, chunk_size))
        logger.info("Uploading '%s' in %d chunk(s)", filepath.name, len(chunks))

        # TODO: distribute chunks across nodes with replication
        raise NotImplementedError("Upload distribution logic not yet implemented")

    # ------------------------------------------------------------------
    # Download
    # ------------------------------------------------------------------

    def download(self, filename: str, dest: str | Path = ".") -> Path:
        """
        Fetch all chunks for a file from storage nodes and reassemble.
        TODO: implement chunk fetching and fault-tolerant retry.
        """
        # TODO: query master for chunk locations, fetch each chunk, reassemble
        raise NotImplementedError("Download logic not yet implemented")

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _get_nodes(self) -> dict:
        response = httpx.get(f"{self.master_url}/nodes")
        response.raise_for_status()
        return response.json().get("nodes", {})

    def _store_chunk(self, node_address: str, chunk_id: str, data: bytes) -> None:
        url = f"{node_address.rstrip('/')}/store_chunk"
        files = {"file": (chunk_id, data, "application/octet-stream")}
        response = httpx.post(url, params={"chunk_id": chunk_id}, files=files)
        response.raise_for_status()

    def _fetch_chunk(self, node_address: str, chunk_id: str) -> bytes:
        url = f"{node_address.rstrip('/')}/get_chunk/{chunk_id}"
        response = httpx.get(url)
        response.raise_for_status()
        return response.content
