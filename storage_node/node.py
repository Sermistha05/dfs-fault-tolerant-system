import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="DFS Storage Node")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)


@app.get("/")
def health_check():
    return {"status": "ok", "node": "storage"}


@app.post("/store_chunk")
async def store_chunk(chunk_id: str, file: UploadFile = File(...)):
    chunk_path = DATA_DIR / chunk_id
    try:
        content = await file.read()
        chunk_path.write_bytes(content)
        logger.info("Stored chunk: %s (%d bytes)", chunk_id, len(content))
        return {"chunk_id": chunk_id, "size": len(content), "status": "stored"}
    except Exception as e:
        logger.error("Failed to store chunk %s: %s", chunk_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to store chunk: {e}")


@app.get("/get_chunk/{chunk_id}")
def get_chunk(chunk_id: str):
    chunk_path = DATA_DIR / chunk_id
    if not chunk_path.exists():
        logger.warning("Chunk not found: %s", chunk_id)
        raise HTTPException(status_code=404, detail=f"Chunk '{chunk_id}' not found")
    logger.info("Serving chunk: %s", chunk_id)
    return FileResponse(path=chunk_path, media_type="application/octet-stream", filename=chunk_id)
