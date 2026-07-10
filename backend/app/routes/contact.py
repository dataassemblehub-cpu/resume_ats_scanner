from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contact import ContactMessage
from app.schemas.contact import ContactMessageCreate, ContactMessageResponse
import time
from collections import defaultdict

router = APIRouter()

# In-memory simple rate limiting for simplicity and OOM-safety
# Format: { ip: [timestamps] }
rate_limit_store = defaultdict(list)
HOUR = 3600
DAY = 86400
MAX_PER_HOUR = 5
MAX_PER_DAY = 20

def check_rate_limit(ip: str):
    now = time.time()
    # Clean up old timestamps
    rate_limit_store[ip] = [ts for ts in rate_limit_store[ip] if now - ts < DAY]
    
    timestamps = rate_limit_store[ip]
    
    # Check daily limit
    if len(timestamps) >= MAX_PER_DAY:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily submission limit reached. Please try again tomorrow."
        )
        
    # Check hourly limit
    hourly_timestamps = [ts for ts in timestamps if now - ts < HOUR]
    if len(hourly_timestamps) >= MAX_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Hourly submission limit reached. Please try again later."
        )
        
    # Add new timestamp
    rate_limit_store[ip].append(now)

@router.post("/", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
async def submit_contact_message(
    request: Request,
    message_in: ContactMessageCreate,
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else "unknown"
    
    # Apply rate limiting
    check_rate_limit(ip_address)
    
    user_agent = request.headers.get("user-agent", "unknown")
    
    new_message = ContactMessage(
        name=message_in.name,
        email=message_in.email,
        category=message_in.category,
        subject=message_in.subject,
        message=message_in.message,
        source_page=message_in.source_page,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message
