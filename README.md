# Webapp for PDF 2-Layer Digitization with PaddleOCR and VietOCR

## Objective

Build a system that automatically processes **PDF files or images** as input to:

1. **Detect text** using **PaddleOCR**.  
2. **Recognize text** using **VietOCR**.  
3. Generate a **2-layer PDF (searchable PDF)** that keeps the original image intact and overlays a recognized text layer to enable search, lookup, and archiving.

## Technologies Used
- Frontend: ReactJS  
- Backend: FastAPI  
- Storage: MongoDB Atlas  
- Authentication: JWT  
- Email OTP password reset: SMTP  
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR): detects text regions in images.  
- [VietOCR](https://github.com/quanpn90/VietOCR): recognizes text content from cropped image regions.  
- Python libraries: `opencv`, `PIL`, `reportlab`, `PyMuPDF`, etc.  

## Processing Workflow

1. **Read input PDF or image file.**  
2. Use **PaddleOCR** to **detect** all text regions.  
3. Crop detected text regions into smaller images.  
4. Use **VietOCR** to **recognize** the text content from each region.  
5. Generate a new PDF file:  
   - Bottom layer: original image.  
   - Top layer: recognized text, positioned correctly, allowing select/copy/search.  

## Result

- The output PDF **retains the original format and layout**.  
- Users can **search and copy text** from the PDF.  

## Essential Requirements

Before installation, make sure you have:  
- Docker  
- Docker Compose  
- GitHub  
- At least 35GB of free disk space  

---

## Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/minoraNGUYXN/pdf_2_layers.git
cd pdf_2_layers
```  
### 2. Configure environment
```bash
cd src/backend
```
### Create a .env file inside the backend directory with the following variables:
```bash
# Database Configuration
MONGODB_URL=mongodb+srv://<your_mongodb_username>:<your_password>@<your_cluster_name>.mongodb.net
DATABASE_NAME=your_db_name

# JWT Configuration
SECRET_KEY=Eyour_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# SMTP Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email #hãy lập email khác để gửi email có mã OTP cho user khi reset password
SMTP_PASSWORD=your_2FA_password

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
``` 
### 3. Install and run the application
```bash
python -m venv venv # dành cho lần chạy đầu tiên
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt # dành cho lần chạy đầu tiên'
pip install torch==2.0.1+cu118 torchvision==0.15.2+cu118 torchaudio==2.0.2+cu118 --no-deps -f https://download.pytorch.org/whl/cu118/torch_stable.html
pip install torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --no-deps
python -m pip install paddlepaddle-gpu==3.1.0 -i https://www.paddlepaddle.org.cn/packages/stable/cu118/
python -m pip install paddlepaddle==3.1.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/

uvicorn src.backend.main:app --reload --host 0.0.0.0 --port 8000

cd src/frontend
npm install
npm run dev
```

### 4. Run with Docker Compose
```bash
cd pdf_2_layers
docker-compose build
docker compose up
```
