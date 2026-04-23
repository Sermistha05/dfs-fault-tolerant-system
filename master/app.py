import logging

import httpx
from fastapi import FastAPI, HTTPException, UploadFile, File

from master.metadata import MetadataStore, FileMetadata, ChunkInfo

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


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    nodes = metadata.get_nodes()  # dict: {node_id: address}
    if not nodes:
        raise HTTPException(status_code=503, detail="No storage nodes available")

    content = await file.read()
    chunk_id = file.filename

    # Round-robin node selection
    global node_index
    node_ids = list(nodes.keys())
    selected_node_id = node_ids[node_index % len(node_ids)]
    node_index += 1
    node_id, node_address = selected_node_id, nodes[selected_node_id]
    print("Selected Node:", selected_node_id)

    try:
        response = httpx.post(
            f"{node_address}/store_chunk",
            params={"chunk_id": chunk_id},
            files={"file": (file.filename, content, "application/octet-stream")},
        )
        response.raise_for_status()
    except httpx.HTTPError as e:
        logger.error("Failed to forward chunk to %s: %s", node_address, e)
        raise HTTPException(status_code=502, detail=f"Storage node error: {e}")

    # Record metadata
    storage_response = response.json()
    chunk_size = storage_response.get("size", len(content))
    file_meta = FileMetadata(
        filename=file.filename,
        total_chunks=1,
        chunks=[ChunkInfo(chunk_id=chunk_id, node_id=node_id, node_address=node_address, size=chunk_size)],
    )
    metadata.add_file(file_meta)
    logger.info("Uploaded '%s' → node %s (%s)", file.filename, node_id, node_address)

    return {
        "message": "File uploaded",
        "node_id": node_id,
        "node": node_address,
        "status": storage_response.get("status", "stored"),
        "size": chunk_size,
    }


@app.get("/download/{filename}")
def download_file(filename: str):
    """Proxy a file download from the storage node that holds its first chunk."""
    file_meta = metadata.get_file(filename)
    if not file_meta:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found")

    chunk = file_meta.chunks[0]
    try:
        response = httpx.get(
            f"{chunk.node_address}/get_chunk/{chunk.chunk_id}",
            follow_redirects=True,
            timeout=30,
        )
        response.raise_for_status()
    except httpx.HTTPError as e:
        logger.error("Failed to fetch chunk from %s: %s", chunk.node_address, e)
        raise HTTPException(status_code=502, detail=f"Storage node error: {e}")

    from fastapi.responses import Response
    return Response(
        content=response.content,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
