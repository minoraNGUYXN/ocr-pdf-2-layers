from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(lambda x: str(x)),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema: JsonSchemaValue, handler) -> JsonSchemaValue:
        field_schema.update(type="string")
        return field_schema


# Base config for all models
BASE_CONFIG = ConfigDict(
    populate_by_name=True,
    arbitrary_types_allowed=True,
    json_encoders={ObjectId: str}
)


class User(BaseModel):
    model_config = BASE_CONFIG

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class ProcessedFile(BaseModel):
    model_config = BASE_CONFIG

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    original_filename: str
    processed_filename: str
    file_size: int
    file_type: str
    processing_status: str = "completed"
    processing_time: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    download_count: int = 0


# Request models
class UserSignUp(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


# NEW: Change password request model
class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)


# NEW: Change email request model
class ChangeEmailRequest(BaseModel):
    new_email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')


# Response models
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


# NEW: Standard success response model
class SuccessResponse(BaseModel):
    message: str