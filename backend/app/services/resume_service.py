from fastapi import UploadFile, HTTPException
from app.parsers import get_parser
from app.utils.extraction import extract_name, extract_email, extract_phone
from app.services.supabase_service import SupabaseService
from app.utils.logging_config import logger

class ResumeService:
    def __init__(self, supabase_service: SupabaseService):
        self.supabase_service = supabase_service

    async def process_and_save_resume(self, file: UploadFile) -> dict:
        """
        Coordinates parsing, contact info extraction, and storage/DB persistence.
        """
        try:
            content = await file.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read upload file: {str(e)}")

        # 1. Select appropriate parser and extract text
        try:
            parser = get_parser(file.content_type)
            parsed_text = parser.parse(content)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error parsing resume content: {str(e)}")

        if not parsed_text:
            raise HTTPException(status_code=400, detail="The resume file contains no extractable text.")

        # 2. Extract metadata using utilities
        name = extract_name(parsed_text)
        email = extract_email(parsed_text)
        phone = extract_phone(parsed_text)

        # 3. Save to database using Supabase Service
        try:
            # Get or create a user associated with the extracted email
            user_id = self.supabase_service.get_or_create_user(email)
            
            # Attempt uploading to storage
            file_url = self.supabase_service.upload_file_to_storage(file.filename, content)
            
            # Insert record into resumes table
            saved_resume = self.supabase_service.save_resume(
                user_id=user_id,
                file_name=file.filename,
                parsed_text=parsed_text,
                name=name,
                email=email,
                phone=phone,
                file_url=file_url
            )
            
            # Return mapped data matching the ResumeUploadResponse schema
            return {
                "id": saved_resume["id"],
                "name": saved_resume["name"],
                "email": saved_resume["email"],
                "phone": saved_resume["phone"],
                "parsed_text": saved_resume["parsed_text"]
            }
        except Exception as e:
            logger.error(f"Error processing resume upload: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
