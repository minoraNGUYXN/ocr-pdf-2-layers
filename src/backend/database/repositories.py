from typing import List, Optional
from bson import ObjectId
from pymongo import ASCENDING, DESCENDING
from motor.motor_asyncio import AsyncIOMotorCollection

from .connection import get_database
from .models import User, ProcessedFile, UserResponse, ProcessedFileResponse


class UserRepository:
    def __init__(self):
        self.collection: AsyncIOMotorCollection = get_database()["users"]

    async def create_user(self, user_data: dict) -> User:
        """Create a new user"""
        result = await self.collection.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        return User(**user_data)

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        user_data = await self.collection.find_one({"username": username})
        return User(**user_data) if user_data else None

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        user_data = await self.collection.find_one({"email": email})
        return User(**user_data) if user_data else None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        user_data = await self.collection.find_one({"_id": ObjectId(user_id)})
        return User(**user_data) if user_data else None

    async def update_user(self, user_id: str, update_data: dict) -> bool:
        """Update user"""
        result = await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        result = await self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0

    async def create_indexes(self):
        """Create database indexes"""
        await self.collection.create_index([("username", ASCENDING)], unique=True)
        await self.collection.create_index([("email", ASCENDING)], unique=True)


class ProcessedFileRepository:
    def __init__(self):
        self.collection: AsyncIOMotorCollection = get_database()["processed_files"]

    async def create_processed_file(self, file_data: dict) -> ProcessedFile:
        """Create a new processed file record"""
        result = await self.collection.insert_one(file_data)
        file_data["_id"] = result.inserted_id
        return ProcessedFile(**file_data)

    async def get_files_by_user(self, user_id: str, skip: int = 0, limit: int = 20) -> List[ProcessedFile]:
        """Get processed files by user"""
        cursor = self.collection.find({"user_id": ObjectId(user_id)}) \
            .sort("created_at", DESCENDING) \
            .skip(skip) \
            .limit(limit)

        files = []
        async for file_data in cursor:
            files.append(ProcessedFile(**file_data))
        return files

    async def get_file_by_id(self, file_id: str) -> Optional[ProcessedFile]:
        """Get processed file by ID"""
        file_data = await self.collection.find_one({"_id": ObjectId(file_id)})
        return ProcessedFile(**file_data) if file_data else None

    async def get_file_by_filename(self, filename: str, user_id: str) -> Optional[ProcessedFile]:
        """Get processed file by filename and user"""
        file_data = await self.collection.find_one({
            "processed_filename": filename,
            "user_id": ObjectId(user_id)
        })
        return ProcessedFile(**file_data) if file_data else None

    async def update_file(self, file_id: str, update_data: dict) -> bool:
        """Update processed file"""
        result = await self.collection.update_one(
            {"_id": ObjectId(file_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def increment_download_count(self, file_id: str) -> bool:
        """Increment download count"""
        result = await self.collection.update_one(
            {"_id": ObjectId(file_id)},
            {"$inc": {"download_count": 1}}
        )
        return result.modified_count > 0

    async def delete_file(self, file_id: str) -> bool:
        """Delete processed file record"""
        result = await self.collection.delete_one({"_id": ObjectId(file_id)})
        return result.deleted_count > 0

    async def get_user_file_count(self, user_id: str) -> int:
        """Get total file count for user"""
        return await self.collection.count_documents({"user_id": ObjectId(user_id)})

    async def create_indexes(self):
        """Create database indexes"""
        await self.collection.create_index([("user_id", ASCENDING)])
        await self.collection.create_index([("created_at", DESCENDING)])
        await self.collection.create_index([("processed_filename", ASCENDING)])