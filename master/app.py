import logging

import httpx
from fastapi import FastAPI, HTTPException, UploadFile, File

from master.metadata import MetadataStore, FileMetadata, ChunkInfo
from common.utils import split_bytes

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="DFS Master Node")
metadata = MetadataStore()
node_index = 0


@app.get("/")
def health_check():
    return {"status": "ok", "node": "master"}


@app.post("/register_node")
def register_node(node_id: str, address: str):
    if node_id in metadata.get_nodes():
        raise HTTPException(status_code=409, detail=f"Node '{node_id}' is already registered")
    metadata.add_node(node_id, address)
    logger.info("Registered storage node: %s at %s", node_id, address)
    return {"status": "registered", "node_id": node_id, "address": address}


@app.delete("/delete_node/{node_id}")
def delete_node(node_id: str):
    if node_id not in metadata.get_nodes():
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")
    metadata.remove_node(node_id)
    logger.info("Deleted storage node: %s", node_id.replace("\n", "").replace("\r", ""))
    return {"status": "deleted", "node_id": node_id}


@app.put("/update_node/{node_id}")
def update_node(node_id: str, address: str):
    if node_id not in metadata.get_nodes():
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")
    metadata.update_node(node_id, address)
    logger.info("Updated storage node: %s → %s",
                node_id.replace("\n", "").replace("\r", ""),
                address.replace("\n", "").replace("\r", ""))
    return {"status": "updated", "node_id": node_id, "address": address}


@app.get("/nodes")
def list_nodes():
    return {"nodes": metadata.get_nodes()}


@app.get("/stats")
def get_stats():
    stats = metadata.get_stats()
    nodes = metadata.get_nodes()
    active_nodes = 0
    for address in nodes.values():
        try:
            r = httpx.get(f"{address}/", timeout=2)
            if r.status_code == 200:
                active_nodes += 1
        except httpx.HTTPError:
            pass
    return {**stats, "active_nodes": active_nodes}


@app.get("/files")
def list_files():
    return {"files": metadata.get_files()}


REPLICATION_FACTOR = 2


def _store_chunk(node_address: str, chunk_id: str, chunk_data: bytes) -> int:
    """Send a chunk to a storage node. Returns stored size."""
    response = httpx.post(
        f"{node_address}/store_chunk",
        params={"chunk_id": chunk_id},
        files={"file": (chunk_id, chunk_data, "application/octet-stream")},
    )
    response.raise_for_status()
    return response.json().get("size", len(chunk_data))


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    nodes = metadata.get_nodes()  # dict: {node_id: address}
    if not nodes:
        raise HTTPException(status_code=503, detail="No storage nodes available")

    content  = await file.read()
    chunks   = split_bytes(file.filename, content)
    node_ids = list(nodes.keys())
    n        = len(node_ids)

    global node_index
    chunk_infos: list[ChunkInfo] = []

    for chunk_id, chunk_data in chunks:
        # Select primary + unique secondary nodes
        primary_idx   = node_index % n
        replica_count = min(REPLICATION_FACTOR, n)
        selected      = [node_ids[(primary_idx + i) % n] for i in range(replica_count)]
        node_index   += 1

        replicas: list[dict] = []
        stored_size = len(chunk_data)

        for nid in selected:
            addr = nodes[nid]
            try:
                stored_size = _store_chunk(addr, chunk_id, chunk_data)
                replicas.append({"node_id": nid, "node_address": addr})
            except httpx.HTTPError as e:
                logger.warning("Failed to store chunk %s on %s: %s", chunk_id, addr, e)

        if not replicas:
            raise HTTPException(status_code=502, detail=f"All nodes failed for chunk {chunk_id}")

        node_names = " and ".join(r["node_id"] for r in replicas)
        print("Chunk", chunk_id, "stored in", node_names)
        chunk_infos.append(ChunkInfo(chunk_id=chunk_id, replicas=replicas, size=stored_size))

    file_meta = FileMetadata(filename=file.filename, total_chunks=len(chunk_infos), chunks=chunk_infos)
    metadata.add_file(file_meta)
    logger.info("Uploaded '%s' → %d chunk(s), replication=%d", file.filename, len(chunk_infos), REPLICATION_FACTOR)

    return {
        "message": "File uploaded",
        "filename": file.filename,
        "total_chunks": len(chunk_infos),
        "size": len(content),
        "chunks": [{"chunk_id": c.chunk_id, "nodes": c.replicas} for c in chunk_infos],
    }


@app.get("/download/{filename}")
def download_file(filename: str):
    """Reassemble all chunks, falling back to replicas if the primary is unavailable."""
    file_meta = metadata.get_file(filename)
    if not file_meta:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found")

    assembled = b""
    for chunk in file_meta.chunks:
        data = None
        for replica in chunk.replicas:
            try:
                response = httpx.get(
                    f"{replica['node_address']}/get_chunk/{chunk.chunk_id}",
                    follow_redirects=True,
                    timeout=30,
                )
                response.raise_for_status()
                data = response.content
                break
            except httpx.HTTPError as e:
                logger.warning("Replica %s failed for chunk %s, trying next: %s",
                               replica['node_id'], chunk.chunk_id, e)
        if data is None:
            raise HTTPException(status_code=502, detail=f"All replicas failed for chunk {chunk.chunk_id}")
        assembled += data

    from fastapi.responses import Response
    return Response(
        content=assembled,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
