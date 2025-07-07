from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import os
import shutil
from .process import Process

app = FastAPI()
process = Process()

os.makedirs("temp_files", exist_ok=True)
os.makedirs("output_files", exist_ok=True)


@app.post("/process")
async def process_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(400, "Chỉ hỗ trợ PDF, PNG, JPG, JPEG")

    input_path = f"temp_files/{file.filename}"
    output_filename = f"ocr_{file.filename}.pdf"
    output_path = f"output_files/{output_filename}"

    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        process.process_file(input_path, final_output_name=output_path)
        os.remove(input_path)

        return {"message": "Xử lý thành công", "download_url": f"/download/{output_filename}"}

    except Exception as e:
        if os.path.exists(input_path):
            os.remove(input_path)
        raise HTTPException(500, f"Lỗi xử lý file: {str(e)}")


@app.get("/download/{output_filename}")
async def download_file(output_filename: str):
    output_path = f"output_files/{output_filename}"
    if not os.path.exists(output_path):
        raise HTTPException(404, "File không tồn tại")
    return FileResponse(output_path, filename=output_filename, media_type="application/pdf")


@app.get("/")
async def root():
    return {"message": "OCR PDF Service",
            "endpoints": {"POST /process": "Upload file để xử lý OCR", "GET /download/{filename}": "Tải file kết quả"}}