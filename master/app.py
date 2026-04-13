import logging

from fastapi import FastAPI

from master.metadata import MetadataStore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="DFS Master Node")
metadata = MetadataStore()


@app.get("/")
def health_check():
    return {"status": "ok", "node": "master"}


@app.post("/register_node")
def register_node(node_id: str, address: str):
    """Register a storage node with the master."""
    metadata.add_node(node_id, address)
    logger.info("Registered storage node: %s at %s", node_id, address)
    return {"status": "registered", "node_id": node_id, "address": address}


@app.get("/nodes")
def list_nodes():
    """Return all registered storage nodes."""
    return {"nodes": metadata.get_nodes()}


@app.get("/files")
def list_files():
    """Return metadata for all tracked files."""
    return {"files": metadata.get_files()}
