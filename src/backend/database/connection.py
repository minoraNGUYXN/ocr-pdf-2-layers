import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()


class MongoDB:
    client: AsyncIOMotorClient = None
    database = None


# Global instance
mongodb = MongoDB()


async def connect_to_mongo():
    """Create database connection"""
    mongodb.client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    mongodb.database = mongodb.client[os.getenv("DATABASE_NAME")]

    # Test connection
    try:
        await mongodb.client.admin.command('ping')
        print("Connected to MongoDB successfully")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")


async def close_mongo_connection():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()
        print("Disconnected from MongoDB")


def get_database():
    """Get database instance"""
    return mongodb.database