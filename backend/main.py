import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from neo4j import GraphDatabase
from typing import List, Optional

app = FastAPI(title="Companion AI - Semantica Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "semantica_password")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

class CharacterCreate(BaseModel):
    id: str
    name: str
    description: str

class MemoryEvent(BaseModel):
    character_id: str
    event_text: str
    timestamp: float

@app.on_event("shutdown")
def shutdown_db():
    driver.close()

@app.get("/health")
def health_check():
    try:
        with driver.session() as session:
            session.run("RETURN 1")
        return {"status": "ok", "message": "Connected to Neo4j graph successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Neo4j connection failed: {str(e)}"}

@app.post("/api/characters")
def create_character_node(char: CharacterCreate):
    with driver.session() as session:
        query = (
            "MERGE (c:Character {id: $id}) "
            "SET c.name = $name, c.description = $description "
            "RETURN c"
        )
        result = session.run(query, id=char.id, name=char.name, description=char.description)
        record = result.single()
        if not record:
            raise HTTPException(status_code=500, detail="Failed to create character node")
        return {"status": "success", "character_id": char.id}

@app.post("/api/memory")
def add_memory_event(event: MemoryEvent):
    with driver.session() as session:
        # Create event and link to character
        query = (
            "MATCH (c:Character {id: $char_id}) "
            "CREATE (e:Event {text: $text, timestamp: $ts}) "
            "CREATE (c)-[:EXPERIENCED]->(e) "
            "RETURN e"
        )
        result = session.run(query, char_id=event.character_id, text=event.event_text, ts=event.timestamp)
        if not result.single():
            raise HTTPException(status_code=404, detail="Character not found")
        return {"status": "success", "event_added": True}

@app.get("/api/memory/{character_id}")
def get_character_memory(character_id: str):
    with driver.session() as session:
        query = (
            "MATCH (c:Character {id: $char_id})-[:EXPERIENCED]->(e:Event) "
            "RETURN e.text AS text, e.timestamp AS ts "
            "ORDER BY e.timestamp DESC"
        )
        result = session.run(query, char_id=character_id)
        events = [{"text": record["text"], "timestamp": record["ts"]} for record in result]
        return {"character_id": character_id, "events": events}



import urllib.request
import threading
from pathlib import Path

downloads_progress = {}

class DownloadRequest(BaseModel):
    url: str
    model_type: str
    filename: str

@app.post("/api/models/download")
def start_download(req: DownloadRequest):
    # Cesta mapovana z docker-compose volume ./local_disk:/local_disk
    target_dir = Path("/local_disk/models") / req.model_type
    target_dir.mkdir(parents=True, exist_ok=True)
    file_path = target_dir / req.filename

    if file_path.exists():
        return {"status": "exists", "path": str(file_path)}

    task_id = f"{req.model_type}_{req.filename}"
    if downloads_progress.get(task_id) not in [None, -1, 100]:
        return {"status": "already_downloading", "task_id": task_id}

    def download_task(url, path, tid):
        downloads_progress[tid] = 0
        try:
            req_obj = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req_obj) as response, open(path, 'wb') as out_file:
                total_length = response.getheader('content-length')
                if total_length is None:
                    out_file.write(response.read())
                    downloads_progress[tid] = 100
                else:
                    total_length = int(total_length)
                    downloaded = 0
                    chunk_size = 1024 * 1024 * 5 # 5MB chunks
                    while True:
                        data = response.read(chunk_size)
                        if not data:
                            break
                        out_file.write(data)
                        downloaded += len(data)
                        downloads_progress[tid] = int(100.0 * downloaded / total_length)
        except Exception as e:
            downloads_progress[tid] = -1
            print(f"Download failed for {tid}: {e}")

    threading.Thread(target=download_task, args=(req.url, file_path, task_id), daemon=True).start()
    return {"status": "started", "task_id": task_id}

@app.get("/api/models/download/{task_id}")
def get_download_progress(task_id: str):
    return {"task_id": task_id, "progress": downloads_progress.get(task_id, 0)}


from fastapi import UploadFile, File, Form
from pydantic import BaseModel
import io

# We wrap the RAG imports in try/except so backend doesn't crash if they fail to load immediately
try:
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print("Warning: SentenceTransformer not loaded", e)
    embedder = None

try:
    import PyPDF2
except Exception as e:
    print("Warning: PyPDF2 not loaded", e)

@app.on_event("startup")
def startup_db():
    try:
        with driver.session() as session:
            # Create vector index for Neo4j 5.x
            session.run("""
            CREATE VECTOR INDEX document_chunks IF NOT EXISTS
            FOR (c:Chunk) ON (c.embedding)
            OPTIONS {indexConfig: {
                `vector.dimensions`: 384,
                `vector.similarity_function`: 'cosine'
            }}
            """)
            print("Vector index created or already exists.")
    except Exception as e:
        print("Could not create vector index:", e)

@app.post("/api/rag/upload")
async def upload_document(file: UploadFile = File(...), character_id: str = Form(...)):
    if not embedder:
        raise HTTPException(status_code=500, detail="Embedding model not initialized.")
    
    content_bytes = await file.read()
    text = ""
    
    if file.filename.endswith('.pdf'):
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")
    else:
        try:
            text = content_bytes.decode('utf-8')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse text: {e}")
            
    # Simple chunking
    chunk_size = 1000
    overlap = 200
    chunks = []
    
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        if len(chunk) > 100: # ignore very small chunks
            chunks.append(chunk)
            
    if not chunks:
        return {"status": "success", "chunks": 0, "message": "No text extracted"}
        
    embeddings = embedder.encode(chunks).tolist()
    
    # Store in Neo4j
    with driver.session() as session:
        # Create a Document node
        doc_query = """
        MATCH (char:Character {id: $char_id})
        CREATE (doc:Document {filename: $filename, id: randomUUID()})
        CREATE (char)-[:HAS_DOCUMENT]->(doc)
        RETURN doc.id AS doc_id
        """
        res = session.run(doc_query, char_id=character_id, filename=file.filename)
        record = res.single()
        if not record:
            # Fallback if character doesn't exist, create it on the fly
            session.run("MERGE (c:Character {id: $char_id})", char_id=character_id)
            res = session.run(doc_query, char_id=character_id, filename=file.filename)
            record = res.single()
            
        doc_id = record["doc_id"]
        
        # Insert chunks
        chunk_query = """
        MATCH (doc:Document {id: $doc_id})
        UNWIND $batch AS item
        CREATE (c:Chunk {text: item.text, embedding: item.embedding, id: randomUUID()})
        CREATE (doc)-[:HAS_CHUNK]->(c)
        """
        
        batch = [{"text": c, "embedding": e} for c, e in zip(chunks, embeddings)]
        session.run(chunk_query, doc_id=doc_id, batch=batch)
        
    return {"status": "success", "chunks": len(chunks), "document": file.filename}

class RagQuery(BaseModel):
    query: str
    character_id: str
    top_k: int = 3

@app.post("/api/rag/search")
def search_documents(req: RagQuery):
    if not embedder:
        raise HTTPException(status_code=500, detail="Embedding model not initialized.")
        
    query_emb = embedder.encode(req.query).tolist()
    
    with driver.session() as session:
        # Neo4j 5.x vector search
        search_query = """
        CALL db.index.vector.queryNodes('document_chunks', $top_k, $emb)
        YIELD node, score
        MATCH (char:Character {id: $char_id})-[:HAS_DOCUMENT]->(doc:Document)-[:HAS_CHUNK]->(node)
        RETURN node.text AS text, score, doc.filename AS source
        ORDER BY score DESC
        """
        
        try:
            res = session.run(search_query, top_k=req.top_k, emb=query_emb, char_id=req.character_id)
            results = [{"text": r["text"], "score": r["score"], "source": r["source"]} for r in res]
            return {"status": "success", "results": results}
        except Exception as e:
            # Fallback for neo4j < 5.15 if the above syntax fails
            print("Vector search failed, attempting fallback:", e)
            return {"status": "error", "results": []}

