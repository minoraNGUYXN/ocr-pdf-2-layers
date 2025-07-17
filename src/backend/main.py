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
from dotenv import load_dotenv

from src.backend.database.connection import connect_to_mongo, close_mongo_connection
from src.backend.database.repositories import UserRepository, ProcessedFileRepository
from src.backend.database.models import *
from src.app.process import Process

load_dotenv()

# Config
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Global instances
user_repo = None
file_repo = None
security = HTTPBearer()
process = Process()

# Ensure directories
os.makedirs("temp_files", exist_ok=True)
os.makedirs("output_files", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global user_repo, file_repo
    await connect_to_mongo()
    user_repo = UserRepository()
    file_repo = ProcessedFileRepository()
    await user_repo.create_indexes()
    await file_repo.create_indexes()
    yield
    await close_mongo_connection()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Auth utilities
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await user_repo.get_user_by_username(username)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Auth endpoints
@app.post("/auth/signup", response_model=TokenResponse)
async def sign_up(user_data: UserSignUp):
    # Check existing user
    if await user_repo.get_user_by_username(user_data.username):
        raise HTTPException(400, "Username already exists")
    if await user_repo.get_user_by_email(user_data.email):
        raise HTTPException(400, "Email already exists")

    # Create user
    user_dict = {
        **user_data.dict(),
        "password": hash_password(user_data.password),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }

    user = await user_repo.create_user(user_dict)

    # Generate token
    access_token = create_access_token(
        {"sub": user.username},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={"id": str(user.id), "username": user.username, "email": user.email}
    )


@app.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await user_repo.get_user_by_username(user_data.username)
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(400, "Invalid credentials")

    access_token = create_access_token(
        {"sub": user.username},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={"id": str(user.id), "username": user.username, "email": user.email}
    )


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
        is_active=current_user.is_active
    )


# NEW: Change password endpoint
@app.post("/auth/change-password", response_model=SuccessResponse)
async def change_password(
        password_data: ChangePasswordRequest,
        current_user: User = Depends(get_current_user)
):
    # Verify old password
    if len(password_data.old_password) < 6 or not verify_password(password_data.old_password, current_user.password):
        raise HTTPException(400, "Current password is incorrect")

    # Hash new password
    hashed_new_password = hash_password(password_data.new_password)

    # Update password in database
    success = await user_repo.update_user(str(current_user.id), {
        "password": hashed_new_password,
        "updated_at": datetime.utcnow()
    })

    if not success:
        raise HTTPException(500, "Failed to update password")

    return SuccessResponse(message="Password changed successfully")


# NEW: Change email endpoint
@app.post("/auth/change-email", response_model=SuccessResponse)
async def change_email(
        email_data: ChangeEmailRequest,
        current_user: User = Depends(get_current_user)
):
    # Check if email already exists
    existing_user = await user_repo.get_user_by_email(email_data.new_email)
    if existing_user and str(existing_user.id) != str(current_user.id):
        raise HTTPException(400, "Email already in use")

    # Update email in database
    success = await user_repo.update_user(str(current_user.id), {
        "email": email_data.new_email,
        "updated_at": datetime.utcnow()
    })

    if not success:
        raise HTTPException(500, "Failed to update email")

    return SuccessResponse(message="Email changed successfully")


# File processing endpoints
@app.post("/process")
async def process_file_endpoint(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user)
):
    if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(400, "Only PDF, PNG, JPG, JPEG files supported")

    input_path = f"temp_files/{file.filename}"
    output_filename = f"ocr_{int(time.time())}_{file.filename}"
    if not output_filename.endswith('.pdf'):
        output_filename += '.pdf'
    output_path = f"output_files/{output_filename}"

    start_time = time.time()

    try:
        # Save and process file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(input_path)
        process.process_file(input_path, final_output_name=output_path)
        processing_time = time.time() - start_time

        # Save to database
        file_data = {
            "user_id": current_user.id,
            "original_filename": file.filename,
            "processed_filename": output_filename,
            "file_size": file_size,
            "file_type": file.content_type,
            "processing_time": processing_time,
            "created_at": datetime.utcnow()
        }

        processed_file = await file_repo.create_processed_file(file_data)

        # Cleanup
        if os.path.exists(input_path):
            os.remove(input_path)

        return {
            "message": "File processed successfully",
            "download_url": f"/download/{output_filename}",
            "filename": output_filename,
            "file_id": str(processed_file.id),
            "processing_time": processing_time
        }

    except Exception as e:
        if os.path.exists(input_path):
            os.remove(input_path)
        raise HTTPException(500, f"Processing failed: {str(e)}")


@app.get("/download/{output_filename}")
async def download_file(
        output_filename: str,
        current_user: User = Depends(get_current_user)
):
    file_record = await file_repo.get_file_by_filename(output_filename, str(current_user.id))
    if not file_record:
        raise HTTPException(404, "File not found")

    output_path = f"output_files/{output_filename}"
    if not os.path.exists(output_path):
        raise HTTPException(404, "File not found on system")

    await file_repo.increment_download_count(str(file_record.id))
    return FileResponse(output_path, filename=output_filename, media_type="application/pdf")


# NEW: Delete file endpoint
@app.delete("/file/{file_id}", response_model=SuccessResponse)
async def delete_file(
        file_id: str,
        current_user: User = Depends(get_current_user)
):
    # Get file record to verify ownership
    file_record = await file_repo.get_file_by_id(file_id)
    if not file_record:
        raise HTTPException(404, "File not found")

    # Check if user owns this file
    if str(file_record.user_id) != str(current_user.id):
        raise HTTPException(403, "You don't have permission to delete this file")

    # Delete physical file
    output_path = f"output_files/{file_record.processed_filename}"
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
        except Exception as e:
            print(f"Warning: Could not delete physical file {output_path}: {e}")

    # Delete from database
    success = await file_repo.delete_file(file_id)
    if not success:
        raise HTTPException(500, "Failed to delete file from database")

    return SuccessResponse(message="File deleted successfully")


@app.get("/history", response_model=List[ProcessedFileResponse])
async def get_file_history(
        skip: int = 0,
        limit: int = 20,
        current_user: User = Depends(get_current_user)
):
    files = await file_repo.get_files_by_user(str(current_user.id), skip, limit)
    return [ProcessedFileResponse(
        id=str(f.id),
        original_filename=f.original_filename,
        processed_filename=f.processed_filename,
        file_size=f.file_size,
        file_type=f.file_type,
        processing_status=f.processing_status,
        processing_time=f.processing_time,
        created_at=f.created_at,
        download_count=f.download_count
    ) for f in files]


@app.get("/")
async def root():
    return {
        "message": "OCR PDF Service",
        "status": "running",
        "endpoints": {
            "auth": [
                "POST /auth/signup",
                "POST /auth/login",
                "GET /auth/me",
                "POST /auth/change-password",
                "POST /auth/change-email"
            ],
            "files": ["POST /process", "GET /download/{filename}", "GET /history", "DELETE /file/{file_id}"]
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000"))
    )