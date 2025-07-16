from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import os
import shutil
import jwt
import bcrypt
from typing import Optional, List
import time

# Import database modules
from database.connection import connect_to_mongo, close_mongo_connection
from database.repositories import UserRepository, ProcessedFileRepository
from database.models import (
    UserSignUp, UserLogin, TokenResponse, UserResponse,
    ProcessedFileResponse, User, ProcessedFile
)

# Load environment variables
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()

    # Create database indexes
    user_repo = UserRepository()
    file_repo = ProcessedFileRepository()
    await user_repo.create_indexes()
    await file_repo.create_indexes()

    yield

    # Shutdown
    await close_mongo_connection()


app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize repositories
user_repo = UserRepository()
file_repo = ProcessedFileRepository()

# Import your existing process module
from src.app.process import Process

process = Process()

# Ensure directories exist
os.makedirs("temp_files", exist_ok=True)
os.makedirs("output_files", exist_ok=True)


# Authentication helper functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = await user_repo.get_user_by_username(username)
    if user is None:
        raise credentials_exception

    return user


# Authentication endpoints
@app.post("/auth/signup", response_model=TokenResponse)
async def sign_up(user_data: UserSignUp):
    """User registration endpoint"""
    # Check if username already exists
    existing_user = await user_repo.get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    # Check if email already exists
    existing_email = await user_repo.get_user_by_email(user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user_dict = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }

    user = await user_repo.create_user(user_dict)

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email
        }
    }


@app.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """User login endpoint"""
    # Get user from database
    user = await user_repo.get_user_by_username(user_data.username)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password"
        )

    # Verify password
    if not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password"
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email
        }
    }


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
        is_active=current_user.is_active
    )


@app.post("/process")
async def process_file_endpoint(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user)
):
    """Process uploaded file with OCR"""
    if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ file PDF, PNG, JPG, JPEG"
        )

    input_path = f"temp_files/{file.filename}"
    output_filename = f"ocr_{int(time.time())}_{file.filename}"
    if not output_filename.endswith('.pdf'):
        output_filename += '.pdf'
    output_path = f"output_files/{output_filename}"

    start_time = time.time()

    try:
        # Save uploaded file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Get file size
        file_size = os.path.getsize(input_path)

        # Process file
        process.process_file(input_path, final_output_name=output_path)

        # Calculate processing time
        processing_time = time.time() - start_time

        # Save file info to database
        file_data = {
            "user_id": current_user.id,
            "original_filename": file.filename,
            "processed_filename": output_filename,
            "file_size": file_size,
            "file_type": file.content_type,
            "processing_status": "completed",
            "processing_time": processing_time,
            "created_at": datetime.utcnow(),
            "download_count": 0
        }

        processed_file = await file_repo.create_processed_file(file_data)

        # Clean up input file
        if os.path.exists(input_path):
            os.remove(input_path)

        return {
            "message": "Xử lý file thành công",
            "download_url": f"/download/{output_filename}",
            "filename": output_filename,
            "file_id": str(processed_file.id),
            "processing_time": processing_time,
            "processed_by": current_user.username
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
async def download_file(
        output_filename: str,
        current_user: User = Depends(get_current_user)
):
    """Download processed file"""
    # Get file info from database
    file_record = await file_repo.get_file_by_filename(output_filename, str(current_user.id))
    if not file_record:
        raise HTTPException(status_code=404, detail="File không tồn tại")

    output_path = f"output_files/{output_filename}"
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="File không tồn tại trên hệ thống")

    # Increment download count
    await file_repo.increment_download_count(str(file_record.id))

    return FileResponse(
        output_path,
        filename=output_filename,
        media_type="application/pdf"
    )


@app.get("/history", response_model=List[ProcessedFileResponse])
async def get_file_history(
        skip: int = 0,
        limit: int = 20,
        current_user: User = Depends(get_current_user)
):
    """Get user's file processing history"""
    files = await file_repo.get_files_by_user(str(current_user.id), skip, limit)

    return [
        ProcessedFileResponse(
            id=str(file.id),
            original_filename=file.original_filename,
            processed_filename=file.processed_filename,
            file_size=file.file_size,
            file_type=file.file_type,
            processing_status=file.processing_status,
            processing_time=file.processing_time,
            created_at=file.created_at,
            download_count=file.download_count
        ) for file in files
    ]


@app.get("/")
async def root():
    """API health check and info"""
    return {
        "message": "OCR PDF Service with MongoDB",
        "status": "running",
        "endpoints": {
            "POST /auth/signup": "User registration",
            "POST /auth/login": "User login",
            "GET /auth/me": "Get current user info",
            "POST /process": "Upload file để xử lý OCR",
            "GET /download/{filename}": "Tải file kết quả",
            "GET /history": "Get file processing history"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "database": "connected"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000"))
    )