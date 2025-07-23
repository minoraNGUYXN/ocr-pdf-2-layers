# Dự án Số hóa tài liệu PDF 2 lớp với PaddleOCR và VietOCR

## Mục tiêu

Xây dựng hệ thống tự động xử lý các **file PDF hoặc ảnh** đầu vào để:

1. **Phát hiện văn bản (Text Detection)** bằng **PaddleOCR**.
2. **Nhận dạng văn bản (Text Recognition)** bằng **VietOCR**.
3. Tạo **PDF 2 lớp (searchable PDF)** giữ nguyên hình ảnh gốc và thêm lớp text nhận dạng bên dưới để phục vụ tra cứu, tìm kiếm và lưu trữ.

## Công nghệ sử dụng
- Frontend: ReactJS
- Backend: FastAPI
- Storage: MongoDB Atlas
- Xác thực: JWT
- Email OTP reset password: SMTP
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR): phát hiện vùng chứa văn bản trong ảnh.
- [VietOCR](https://github.com/quanpn90/VietOCR): nhận dạng nội dung văn bản từ ảnh cắt ra.
- Python libraries: `opencv`, `PIL`, `reportlab`, `PyMuPDF`, v.v.

## Quy trình xử lý

1. **Đọc file PDF hoặc ảnh** đầu vào.
2. Dùng **PaddleOCR** để **detect** tất cả vùng chứa text.
3. Cắt các vùng text ra thành từng ảnh nhỏ.
4. Dùng **VietOCR** để **recognize** nội dung text của từng vùng.
5. Tạo file PDF mới:
   - Lớp dưới cùng: hình ảnh gốc.
   - Lớp trên: text nhận dạng được, đặt đúng vị trí, cho phép select/copy/search.

## Kết quả

- File PDF đầu ra **giữ nguyên định dạng và layout gốc**.
- Có thể **search text, copy text** từ PDF.

## Yêu cầu cài đặt và sử dụng
1. Repository cloning:
```bash
git clone https://github.com/minoraNGUYXN/pdf_2_layers.git
cd pdf_2_layers
```  
2. Cấu hình môi trường:
```bash
cd src/backend
```
Tạo file .env trong thư mục backend với các biến sau:
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
3. Cài đặt và thực thi chương trình
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

4. Phát triển cục bộ với Docker Compose:
```bash
cd pdf_2_layers
docker build -t pdf2layers-app:latest
docker run -p 8000:8000 --name pdf2layers-container  pdf2layers-app:latest
```
