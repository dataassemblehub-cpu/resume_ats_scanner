from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.base import Base
from app.utils.logging_config import logger

engine = None
SessionLocal = None

# If DATABASE_URL is configured, initialize the SQLAlchemy engine
if settings.DATABASE_URL:
    try:
        # pool_pre_ping checks the connection validity before executing queries
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info("SQLAlchemy database connection successfully configured.")
    except Exception as e:
        logger.error(f"Failed to initialize SQLAlchemy database engine: {str(e)}")
else:
    logger.warning("DATABASE_URL environment variable is missing. Direct SQL operations will run in mockup mode.")

def init_db():
    """
    Auto-creates database tables in the schema if they do not exist.
    Called during application startup.
    """
    if not settings.DATABASE_URL or engine is None:
        logger.warning("Auto-migration skipped: database engine is not configured.")
        return
        
    try:
        logger.info("Checking database tables and running auto-migrations...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema verification complete: tables 'users' and 'resumes' are verified/created.")
    except Exception as e:
        logger.error(f"Database auto-migration failed: {str(e)}")
