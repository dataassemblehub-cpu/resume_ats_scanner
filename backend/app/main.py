import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import resume, jd, section, keyword, score, semantic, formatting, recommendation, auth, user, history
from app.config import settings
from app.database import init_db
from app.utils.logging_config import logger

# Initialize FastAPI App
app = FastAPI(
    title="Resume ATS Scanner API",
    description="Production-grade ATS parser and scoring engine backend.",
    version="1.0.0",
)

# Run database schema auto-migrations on startup
@app.on_event("startup")
def on_startup():
    logger.info("Startup: executing database schema auto-migrations...")
    init_db()
    logger.info("Startup: database migrations complete.")
    try:
        from app.services.supabase_service import SupabaseService
        service = SupabaseService()
        if service.is_configured:
            logger.info("Startup: verifying Supabase resumes storage bucket...")
            service.ensure_bucket_exists("resumes")
            logger.info("Startup: storage bucket verified.")
    except Exception as e:
        logger.warning(f"Failed to auto-ensure storage buckets on startup: {str(e)}")
    logger.info("Startup: all hooks completed successfully.")

# Request logging middleware writing stats to app.log
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    logger.info(
        f"Client: {request.client.host} | "
        f"Method: {request.method} | "
        f"Path: {request.url.path} | "
        f"Status: {response.status_code} | "
        f"Duration: {duration:.4f}s"
    )
    return response

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production (e.g. Next.js domain)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected error occurred: {str(exc)}"},
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.warning(f"Validation ValueError on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )

# Include Routers
app.include_router(resume.router)
app.include_router(jd.router)
app.include_router(section.router)
app.include_router(keyword.router)
app.include_router(score.router)
app.include_router(semantic.router)
app.include_router(formatting.router)
app.include_router(recommendation.router)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(history.router)

# Health Check Route
@app.get("/", tags=["General"])
async def root():
    return {
        "status": "healthy",
        "app": "Resume ATS Scanner Backend",
        "version": "1.0.0",
        "env": settings.ENV
    }
