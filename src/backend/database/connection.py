import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv


env_path = "./src/backend/.env"
load_dotenv(dotenv_path=env_path)

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None


mongodb = MongoDB()


async def connect_to_mongo():
    """Connect to MongoDB Atlas"""
    try:
        mongodb.client = AsyncIOMotorClient(
            os.getenv("MONGODB_URL"),
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
            socketTimeoutMS=20000,
            connectTimeoutMS=10000,
        )

        mongodb.database = mongodb.client[os.getenv("DATABASE_NAME")]
        await mongodb.client.admin.command('ping')

        server_info = await mongodb.client.server_info()
        print(f"Connected to MongoDB v{server_info.get('version')}")

    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    if mongodb.client:
        mongodb.client.close()
        print("MongoDB disconnected")


def get_database():
    """Get database instance"""
    return mongodb.database