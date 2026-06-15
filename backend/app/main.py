from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import resume, jd, section
from app.config import settings

# Initialize FastAPI App
app = FastAPI(
    title="Resume ATS Scanner API",
    description="Production-grade ATS parser and scoring engine backend.",
    version="1.0.0",
)

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production (e.g. Next.js domain)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected error occurred: {str(exc)}"},
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )

# Include Routers
app.include_router(resume.router)
app.include_router(jd.router)
app.include_router(section.router)

# Health Check Route
@app.get("/", tags=["General"])
async def root():
    return {
        "status": "healthy",
        "app": "Resume ATS Scanner Backend",
        "version": "1.0.0",
        "env": settings.ENV
    }
