from typing import List, Optional
from bson import ObjectId
from pymongo import ASCENDING, DESCENDING
from motor.motor_asyncio import AsyncIOMotorCollection
from .connection import get_database
from .models import User, ProcessedFile


class BaseRepository:
    """Base repository with common operations"""

    def __init__(self, collection_name: str):
        self.collection: AsyncIOMotorCollection = get_database()[collection_name]

    async def find_by_id(self, doc_id: str, model_class):
        """Generic find by ID"""
        data = await self.collection.find_one({"_id": ObjectId(doc_id)})
        return model_class(**data) if data else None

    async def update_by_id(self, doc_id: str, update_data: dict) -> bool:
        """Generic update by ID"""
        result = await self.collection.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def delete_by_id(self, doc_id: str) -> bool:
        """Generic delete by ID"""
        result = await self.collection.delete_one({"_id": ObjectId(doc_id)})
        return result.deleted_count > 0


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")

    async def create_user(self, user_data: dict) -> User:
        result = await self.collection.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        return User(**user_data)

    async def get_user_by_username(self, username: str) -> Optional[User]:
        data = await self.collection.find_one({"username": username})
        return User(**data) if data else None

    async def get_user_by_email(self, email: str) -> Optional[User]:
        data = await self.collection.find_one({"email": email})
        return User(**data) if data else None

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        return await self.find_by_id(user_id, User)

    async def update_user(self, user_id: str, update_data: dict) -> bool:
        return await self.update_by_id(user_id, update_data)

    async def delete_user(self, user_id: str) -> bool:
        return await self.delete_by_id(user_id)

    async def create_indexes(self):
        await self.collection.create_index([("username", ASCENDING)], unique=True)
        await self.collection.create_index([("email", ASCENDING)], unique=True)


class ProcessedFileRepository(BaseRepository):
    def __init__(self):
        super().__init__("processed_files")

    async def create_processed_file(self, file_data: dict) -> ProcessedFile:
        result = await self.collection.insert_one(file_data)
        file_data["_id"] = result.inserted_id
        return ProcessedFile(**file_data)

    async def get_files_by_user(self, user_id: str, skip: int = 0, limit: int = 20) -> List[ProcessedFile]:
        cursor = (self.collection.find({"user_id": ObjectId(user_id)})
                  .sort("created_at", DESCENDING)
                  .skip(skip).limit(limit))

        return [ProcessedFile(**data) async for data in cursor]

    async def get_file_by_id(self, file_id: str) -> Optional[ProcessedFile]:
        return await self.find_by_id(file_id, ProcessedFile)

    async def get_file_by_filename(self, filename: str, user_id: str) -> Optional[ProcessedFile]:
        data = await self.collection.find_one({
            "processed_filename": filename,
            "user_id": ObjectId(user_id)
        })
        return ProcessedFile(**data) if data else None

    async def update_file(self, file_id: str, update_data: dict) -> bool:
        return await self.update_by_id(file_id, update_data)

    async def increment_download_count(self, file_id: str) -> bool:
        result = await self.collection.update_one(
            {"_id": ObjectId(file_id)},
            {"$inc": {"download_count": 1}}
        )
        return result.modified_count > 0

    async def delete_file(self, file_id: str) -> bool:
        return await self.delete_by_id(file_id)

    async def get_user_file_count(self, user_id: str) -> int:
        return await self.collection.count_documents({"user_id": ObjectId(user_id)})

    async def create_indexes(self):
        await self.collection.create_index([("user_id", ASCENDING)])
        await self.collection.create_index([("created_at", DESCENDING)])
        await self.collection.create_index([("processed_filename", ASCENDING)])