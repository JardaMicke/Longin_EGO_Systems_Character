import os

with open('backend/main.py', 'r') as f:
    content = f.read()

rag_code = """
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
            session.run(\"\"\"
            CREATE VECTOR INDEX document_chunks IF NOT EXISTS
            FOR (c:Chunk) ON (c.embedding)
            OPTIONS {indexConfig: {
                `vector.dimensions`: 384,
                `vector.similarity_function`: 'cosine'
            }}
            \"\"\")
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
                text += page.extract_text() + "\\n"
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
        doc_query = \"\"\"
        MATCH (char:Character {id: $char_id})
        CREATE (doc:Document {filename: $filename, id: randomUUID()})
        CREATE (char)-[:HAS_DOCUMENT]->(doc)
        RETURN doc.id AS doc_id
        \"\"\"
        res = session.run(doc_query, char_id=character_id, filename=file.filename)
        record = res.single()
        if not record:
            # Fallback if character doesn't exist, create it on the fly
            session.run("MERGE (c:Character {id: $char_id})", char_id=character_id)
            res = session.run(doc_query, char_id=character_id, filename=file.filename)
            record = res.single()
            
        doc_id = record["doc_id"]
        
        # Insert chunks
        chunk_query = \"\"\"
        MATCH (doc:Document {id: $doc_id})
        UNWIND $batch AS item
        CREATE (c:Chunk {text: item.text, embedding: item.embedding, id: randomUUID()})
        CREATE (doc)-[:HAS_CHUNK]->(c)
        \"\"\"
        
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
        search_query = \"\"\"
        CALL db.index.vector.queryNodes('document_chunks', $top_k, $emb)
        YIELD node, score
        MATCH (char:Character {id: $char_id})-[:HAS_DOCUMENT]->(doc:Document)-[:HAS_CHUNK]->(node)
        RETURN node.text AS text, score, doc.filename AS source
        ORDER BY score DESC
        \"\"\"
        
        try:
            res = session.run(search_query, top_k=req.top_k, emb=query_emb, char_id=req.character_id)
            results = [{"text": r["text"], "score": r["score"], "source": r["source"]} for r in res]
            return {"status": "success", "results": results}
        except Exception as e:
            # Fallback for neo4j < 5.15 if the above syntax fails
            print("Vector search failed, attempting fallback:", e)
            return {"status": "error", "results": []}

"""

if "@app.post(\"/api/rag/upload\")" not in content:
    content = content + "\n" + rag_code
    with open('backend/main.py', 'w') as f:
        f.write(content)
    print("Backend patched with RAG endpoints.")
else:
    print("Backend already contains RAG endpoints.")
