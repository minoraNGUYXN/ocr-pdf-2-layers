from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from src.app.process import Process

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

process = Process()

# Ensure directories exist
os.makedirs("temp_files", exist_ok=True)
os.makedirs("output_files", exist_ok=True)


@app.post("/process")
async def process_file(file: UploadFile = File(...)):
    """Process uploaded file with OCR"""
    if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ file PDF, PNG, JPG, JPEG"
        )

    input_path = f"temp_files/{file.filename}"
    output_filename = f"ocr_{file.filename}"
    if not output_filename.endswith('.pdf'):
        output_filename += '.pdf'
    output_path = f"output_files/{output_filename}"

    try:
        # Save uploaded file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process file
        process.process_file(input_path, final_output_name=output_path)

        # Clean up input file
        if os.path.exists(input_path):
            os.remove(input_path)

        return {
            "message": "Xử lý file thành công",
            "download_url": f"/download/{output_filename}",
            "filename": output_filename
        }

    except Exception as e:
        # Clean up on error
        if os.path.exists(input_path):
            os.remove(input_path)
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xử lý file: {str(e)}"
        )


@app.get("/download/{output_filename}")
async def download_file(output_filename: str):
    """Download processed file"""
    output_path = f"output_files/{output_filename}"

    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="File không tồn tại")

    return FileResponse(
        output_path,
        filename=output_filename,
        media_type="application/pdf"
    )


@app.get("/")
async def root():
    """API health check and info"""
    return {
        "message": "OCR PDF Service",
        "status": "running",
        "endpoints": {
            "POST /process": "Upload file để xử lý OCR",
            "GET /download/{filename}": "Tải file kết quả"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)