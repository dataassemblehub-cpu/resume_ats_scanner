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
        # connect_timeout=10 and statement_timeout=15000 ensure connection/query hangs fail fast
        connect_args = {}
        if settings.DATABASE_URL.startswith("postgresql") or settings.DATABASE_URL.startswith("postgres"):
            connect_args["connect_timeout"] = 10
            connect_args["options"] = "-c statement_timeout=15000"
            
        engine = create_engine(
            settings.DATABASE_URL, 
            pool_pre_ping=True, 
            connect_args=connect_args
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info("SQLAlchemy database connection successfully configured with timeout.")
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
        
        # Run table alterations to add new columns if they are not already present
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_generation_count INTEGER DEFAULT 0;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ai_generation_at TIMESTAMP;"))
                conn.execute(text("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS jd_text TEXT;"))
                conn.execute(text("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS recommendations JSONB;"))
                conn.execute(text("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
                conn.commit()
                logger.info("Database migration check: successfully ensured new auth, plans, and recommendations columns exist.")
        except Exception as alt_err:
            logger.warning(f"Could not check or run table migrations: {str(alt_err)}")
            
        logger.info("Database schema verification complete: tables 'users' and 'resumes' are verified/created.")
    except Exception as e:
        logger.error(f"Database auto-migration failed: {str(e)}")

def get_db():
    if SessionLocal is None:
        raise Exception("Database engine is not configured.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
