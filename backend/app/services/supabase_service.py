from supabase import create_client, Client
from app.config import settings
import uuid

class SupabaseService:
    def __init__(self):
        # Initialize Supabase client
        # In a real environment, URL and Key are required. 
        # We handle cases where they are placeholders gracefully for offline testing.
        self.is_configured = (
            settings.SUPABASE_URL and 
            settings.SUPABASE_URL != "https://your-project-id.supabase.co" and
            settings.SUPABASE_KEY and
            settings.SUPABASE_KEY != "your-supabase-anon-or-service-role-key"
        )
        try:
            if self.is_configured:
                self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            else:
                self.client = None
        except Exception as e:
            print(f"Warning: Failed to initialize Supabase client: {str(e)}")
            self.client = None
            self.is_configured = False

    def get_or_create_user(self, email: str | None) -> str:
        """
        Retrieves user ID by email. If the user doesn't exist, creates one.
        If no email is provided, generates a unique placeholder user.
        """
        if not self.is_configured:
            # Return a mock UUID for testing when Supabase is not configured
            return str(uuid.uuid4())

        target_email = email if email else f"anonymous-{uuid.uuid4()}@ats.local"
        
        try:
            # Query existing user
            response = self.client.table("users").select("id").eq("email", target_email).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]["id"]
            
            # Create new user
            insert_response = self.client.table("users").insert({"email": target_email}).execute()
            if insert_response.data and len(insert_response.data) > 0:
                return insert_response.data[0]["id"]
            
            raise RuntimeError("Failed to create user record in database.")
        except Exception as e:
            raise RuntimeError(f"Database error during user operations: {str(e)}")

    def save_resume(
        self, 
        user_id: str, 
        file_name: str, 
        parsed_text: str, 
        name: str | None, 
        email: str | None, 
        phone: str | None,
        file_url: str | None = None
    ) -> dict:
        """
        Saves parsed resume data into Supabase 'resumes' table.
        """
        if not self.is_configured:
            # Return mock data for testing when Supabase is not configured
            return {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "file_name": file_name,
                "file_url": file_url,
                "parsed_text": parsed_text,
                "email": email,
                "phone": phone,
                "name": name
            }

        payload = {
            "user_id": user_id,
            "file_name": file_name,
            "file_url": file_url,
            "parsed_text": parsed_text,
            "email": email,
            "phone": phone,
            "name": name
        }

        try:
            response = self.client.table("resumes").insert(payload).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            raise RuntimeError("No data returned from database insert.")
        except Exception as e:
            raise RuntimeError(f"Database error during resume insertion: {str(e)}")

    def get_resume_recommendations(self, resume_id: str) -> dict | None:
        """
        Retrieves the persisted jd_text and recommendations for a given resume.
        """
        if not self.is_configured:
            return None
        try:
            response = self.client.table("resumes").select("jd_text", "recommendations").eq("id", resume_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Warning: Failed to fetch recommendations from DB: {str(e)}")
            return None

    def save_resume_recommendations(self, resume_id: str, jd_text: str, recommendations: dict) -> None:
        """
        Saves the target jd_text and generated recommendations into the 'resumes' table.
        """
        if not self.is_configured:
            return
        try:
            self.client.table("resumes").update({
                "jd_text": jd_text,
                "recommendations": recommendations
            }).eq("id", resume_id).execute()
        except Exception as e:
            print(f"Warning: Failed to persist recommendations to DB: {str(e)}")

    def upload_file_to_storage(self, file_name: str, file_content: bytes, bucket_name: str = "resumes") -> str | None:
        """
        Uploads file binary to Supabase Storage bucket and returns the public URL.
        """
        if not self.is_configured:
            return f"https://mock-supabase-storage.local/{bucket_name}/{file_name}"

        # Generate a unique path within the bucket
        unique_filename = f"{uuid.uuid4()}-{file_name}"
        
        try:
            # Upload file content
            self.client.storage.from_(bucket_name).upload(
                path=unique_filename,
                file=file_content,
                file_options={"content-type": "application/octet-stream"}
            )
            # Retrieve public URL
            public_url_res = self.client.storage.from_(bucket_name).get_public_url(unique_filename)
            return public_url_res
        except Exception as e:
            # Log warning or handle gracefully depending on production policies
            print(f"Warning: Failed to upload file to storage: {str(e)}")
            return None
