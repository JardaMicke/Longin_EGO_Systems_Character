import os

with open('backend/main.py', 'r') as f:
    content = f.read()

download_code = """
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
"""

if "start_download" not in content:
    content = content + "\n" + download_code
    with open('backend/main.py', 'w') as f:
        f.write(content)
    print("Backend patched with downloader.")
else:
    print("Backend already contains downloader.")
