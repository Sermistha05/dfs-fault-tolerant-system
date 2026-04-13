# Distributed File System (DFS)

A fault-tolerant distributed file system built with Python and FastAPI.

## Architecture

```
client  ──►  master node  ──►  storage node(s)
              (coordinator)      (workers)
```

| Component | Role |
|-----------|------|
| Master Node | Tracks file metadata and registered storage nodes |
| Storage Nodes | Store and serve raw file chunks |
| Client | Splits files into chunks, uploads/downloads via the master |
| Common | Shared utilities (chunking, chunk ID helpers) |

## Project Structure

```
DFS-project/
├── master/
│   ├── app.py          # FastAPI coordinator
│   └── metadata.py     # In-memory metadata store
├── storage_node/
│   ├── node.py         # FastAPI worker
│   ├── storage.py      # Chunk read/write/delete helpers
│   └── data/           # Stored chunks (auto-created)
├── client/
│   └── client.py       # Upload/download interface
├── common/
│   └── utils.py        # Chunking & reassembly utilities
├── requirements.txt
└── README.md
```

## Setup

```bash
pip install -r requirements.txt
```

## Running

```bash
# Master node (port 8000)
uvicorn master.app:app --port 8000 --reload

# Storage node 1 (port 8001)
uvicorn storage_node.node:app --port 8001 --reload

# Storage node 2 (port 8002)
uvicorn storage_node.node:app --port 8002 --reload
```

## API Overview

### Master (`localhost:8000`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/register_node` | Register a storage node |
| GET | `/nodes` | List registered nodes |
| GET | `/files` | List tracked files |

### Storage Node (`localhost:8001`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/store_chunk` | Upload a chunk |
| GET | `/get_chunk/{chunk_id}` | Download a chunk |
