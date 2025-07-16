from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "username": "john_doe",
                "email": "john@example.com",
                "password": "secure_password"
            }
        }

class ProcessedFile(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(...)
    original_filename: str = Field(...)
    processed_filename: str = Field(...)
    file_size: int = Field(...)
    file_type: str = Field(...)
    processing_status: str = Field(default="completed")  # pending, processing, completed, failed
    processing_time: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    download_count: int = Field(default=0)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Request/Response models
class UserSignUp(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime
    is_active: bool

class ProcessedFileResponse(BaseModel):
    id: str
    original_filename: str
    processed_filename: str
    file_size: int
    file_type: str
    processing_status: str
    processing_time: Optional[float]
    created_at: datetime
    download_count: int