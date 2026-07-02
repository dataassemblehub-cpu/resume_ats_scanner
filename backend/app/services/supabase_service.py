from supabase import create_client, Client
from app.config import settings
import uuid
from datetime import datetime

class SupabaseService:
    # Shared class-level in-memory tables for offline mockup mode
    _mock_users = {
        "00000000-0000-0000-0000-000000000000": {
            "id": "00000000-0000-0000-0000-000000000000",
            "email": "test@example.com",
            "subscription_plan": "free",
            "ai_generation_count": 0,
            "last_ai_generation_at": None,
            "password_hash": None
        }
    }
    _mock_resumes = {}

    def __init__(self):
        import sys
        # Initialize Supabase client
        self.is_configured = (
            settings.SUPABASE_URL and 
            settings.SUPABASE_URL != "https://your-project-id.supabase.co" and
            settings.SUPABASE_KEY and
            settings.SUPABASE_KEY != "your-supabase-anon-or-service-role-key"
        )
        if "pytest" in sys.modules:
            self.is_configured = False

        try:
            if self.is_configured:
                self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            else:
                self.client = None
        except Exception as e:
            print(f"Warning: Failed to initialize Supabase client: {str(e)}")
            self.client = None
            self.is_configured = False

    def ensure_bucket_exists(self, bucket_name: str = "resumes") -> bool:
        """
        Checks if a storage bucket exists, and if not, creates it automatically.
        """
        if not self.is_configured or not self.client:
            return False
        try:
            buckets = self.client.storage.list_buckets()
            exists = False
            for bucket in buckets:
                b_id = bucket.id if hasattr(bucket, 'id') else (bucket.get('id') if isinstance(bucket, dict) else str(bucket))
                if b_id == bucket_name:
                    exists = True
                    break
            
            if not exists:
                print(f"Storage bucket '{bucket_name}' not found. Creating bucket...")
                self.client.storage.create_bucket(bucket_name, options={"public": True})
                print(f"Storage bucket '{bucket_name}' successfully created.")
            return True
        except Exception as e:
            print(f"Warning: Failed to verify or create storage bucket '{bucket_name}': {str(e)}")
            return False

    def get_or_create_user(self, email: str | None) -> str:
        """
        Retrieves user ID by email. If the user doesn't exist, creates one.
        If no email is provided, generates a unique placeholder user.
        """
        target_email = email if email else f"anonymous-{uuid.uuid4()}@example.com"
        
        if not self.is_configured:
            # Check mock database
            for uid, user in self._mock_users.items():
                if user["email"] == target_email:
                    return uid
            
            # Create mock user
            new_id = str(uuid.uuid4())
            self._mock_users[new_id] = {
                "id": new_id,
                "email": target_email,
                "subscription_plan": "free",
                "ai_generation_count": 0,
                "last_ai_generation_at": None,
                "password_hash": None
            }
            return new_id

        try:
            # Query existing user
            response = self.client.table("users").select("id").eq("email", target_email).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]["id"]
            
            # Create new user
            insert_response = self.client.table("users").insert({
                "email": target_email,
                "subscription_plan": "free"
            }).execute()
            if insert_response.data and len(insert_response.data) > 0:
                return insert_response.data[0]["id"]
            
            raise RuntimeError("Failed to create user record in database.")
        except Exception as e:
            raise RuntimeError(f"Database error during user operations: {str(e)}")

    def get_user_by_uuid(self, user_uuid: str) -> dict | None:
        """
        Retrieves user database record by UUID.
        """
        if not self.is_configured:
            return self._mock_users.get(user_uuid)
            
        try:
            response = self.client.table("users").select("*").eq("id", user_uuid).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Warning: Failed to fetch user by UUID: {str(e)}")
            return None

    def get_user_by_email(self, email: str) -> dict | None:
        """
        Retrieves user database record by Email.
        """
        if not self.is_configured:
            for user in self._mock_users.values():
                if user["email"].lower() == email.lower():
                    return user
            return None

        try:
            response = self.client.table("users").select("*").eq("email", email).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Warning: Failed to fetch user by Email: {str(e)}")
            return None

    def create_user_with_hash(self, email: str, password_hash: str) -> dict:
        """
        Signs up a new user with password credentials.
        """
        if not self.is_configured:
            # Check unique constraint
            if self.get_user_by_email(email):
                raise ValueError("A user with this email address already exists.")
            
            new_id = str(uuid.uuid4())
            new_user = {
                "id": new_id,
                "email": email,
                "subscription_plan": "free",
                "ai_generation_count": 0,
                "last_ai_generation_at": None,
                "password_hash": password_hash
            }
            self._mock_users[new_id] = new_user
            return new_user

        try:
            if self.get_user_by_email(email):
                raise ValueError("A user with this email address already exists.")
                
            payload = {
                "email": email,
                "password_hash": password_hash,
                "subscription_plan": "free",
                "ai_generation_count": 0
            }
            response = self.client.table("users").insert(payload).execute()
            if response.data:
                return response.data[0]
            raise RuntimeError("Database error creating user credentials.")
        except Exception as e:
            raise RuntimeError(str(e))

    def update_user_plan(self, user_uuid: str, plan: str) -> dict | None:
        """
        Upgrades or updates the subscription plan tier of a user.
        """
        if not self.is_configured:
            if user_uuid in self._mock_users:
                self._mock_users[user_uuid]["subscription_plan"] = plan
                return self._mock_users[user_uuid]
            return None

        try:
            response = self.client.table("users").update({"subscription_plan": plan}).eq("id", user_uuid).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise RuntimeError(f"Failed to update user subscription plan: {str(e)}")

    def increment_ai_generation_count(self, user_uuid: str) -> dict | None:
        """
        Increments user AI generation counter and records generation timestamp.
        """
        if not self.is_configured:
            if user_uuid in self._mock_users:
                self._mock_users[user_uuid]["ai_generation_count"] += 1
                self._mock_users[user_uuid]["last_ai_generation_at"] = datetime.now().isoformat()
                return self._mock_users[user_uuid]
            return None

        try:
            user = self.get_user_by_uuid(user_uuid)
            count = (user.get("ai_generation_count") or 0) + 1
            response = self.client.table("users").update({
                "ai_generation_count": count,
                "last_ai_generation_at": datetime.now().isoformat()
            }).eq("id", user_uuid).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise RuntimeError(f"Failed to increment AI generation counters: {str(e)}")

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
        payload = {
            "user_id": user_id,
            "file_name": file_name,
            "file_url": file_url,
            "parsed_text": parsed_text,
            "email": email,
            "phone": phone,
            "name": name,
            "created_at": datetime.now().isoformat()
        }

        if not self.is_configured:
            new_id = str(uuid.uuid4())
            payload["id"] = new_id
            self._mock_resumes[new_id] = payload
            return payload

        try:
            response = self.client.table("resumes").insert({
                "user_id": user_id,
                "file_name": file_name,
                "file_url": file_url,
                "parsed_text": parsed_text,
                "email": email,
                "phone": phone,
                "name": name
            }).execute()
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
            res = self._mock_resumes.get(resume_id)
            if res:
                return {
                    "jd_text": res.get("jd_text"),
                    "recommendations": res.get("recommendations")
                }
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
            if resume_id in self._mock_resumes:
                self._mock_resumes[resume_id]["jd_text"] = jd_text
                self._mock_resumes[resume_id]["recommendations"] = recommendations
            return

        try:
            self.client.table("resumes").update({
                "jd_text": jd_text,
                "recommendations": recommendations
            }).eq("id", resume_id).execute()
        except Exception as e:
            print(f"Warning: Failed to persist recommendations to DB: {str(e)}")

    def get_user_history_paginated(self, user_uuid: str, page: int = 1, limit: int = 10) -> dict:
        """
        Fetches a paginated history list of scans performed by the user.
        """
        offset = (page - 1) * limit

        if not self.is_configured:
            # Filter mock resumes by user_id
            user_resumes = [
                r for r in self._mock_resumes.values() 
                if r.get("user_id") == user_uuid
            ]
            # Order by created_at desc (or mock order)
            user_resumes.reverse()
            
            total = len(user_resumes)
            paginated = user_resumes[offset : offset + limit]
            
            items = []
            for r in paginated:
                items.append({
                    "id": r["id"],
                    "file_name": r["file_name"],
                    "name": r.get("name"),
                    "email": r.get("email"),
                    "phone": r.get("phone"),
                    "created_at": r["created_at"],
                    "has_ai_recommendations": r.get("recommendations") is not None
                })
            
            pages = (total + limit - 1) // limit if total > 0 else 1
            return {
                "items": items,
                "total": total,
                "page": page,
                "limit": limit,
                "pages": pages
            }

        try:
            # Query count
            count_res = self.client.table("resumes").select("id", count="exact").eq("user_id", user_uuid).execute()
            total = count_res.count if count_res.count is not None else 0

            # Query items
            response = self.client.table("resumes").select(
                "id", "file_name", "name", "email", "phone", "created_at", "recommendations"
            ).eq("user_id", user_uuid).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            
            items = []
            if response.data:
                for r in response.data:
                    items.append({
                        "id": r["id"],
                        "file_name": r["file_name"],
                        "name": r.get("name"),
                        "email": r.get("email"),
                        "phone": r.get("phone"),
                        "created_at": r["created_at"],
                        "has_ai_recommendations": r.get("recommendations") is not None
                    })

            pages = (total + limit - 1) // limit if total > 0 else 1
            return {
                "items": items,
                "total": total,
                "page": page,
                "limit": limit,
                "pages": pages
            }
        except Exception as e:
            raise RuntimeError(f"Failed to query scan history: {str(e)}")

    def delete_history_by_id(self, user_uuid: str, resume_id: str) -> bool:
        """
        Deletes a resume record ensuring ownership by the authenticated user UUID.
        """
        if not self.is_configured:
            if resume_id in self._mock_resumes:
                if self._mock_resumes[resume_id].get("user_id") == user_uuid:
                    del self._mock_resumes[resume_id]
                    return True
            return False

        try:
            response = self.client.table("resumes").delete().eq("id", resume_id).eq("user_id", user_uuid).execute()
            return len(response.data) > 0 if response.data else True
        except Exception as e:
            raise RuntimeError(f"Failed to delete history record: {str(e)}")

    def get_resume_by_id(self, user_uuid: str, resume_id: str) -> dict | None:
        """
        Retrieves a full resume record for dashboard reloading, verifying user ownership.
        """
        if not self.is_configured:
            res = self._mock_resumes.get(resume_id)
            if res and res.get("user_id") == user_uuid:
                return res
            return None

        try:
            response = self.client.table("resumes").select("*").eq("id", resume_id).eq("user_id", user_uuid).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise RuntimeError(f"Failed to fetch resume details: {str(e)}")

    def upload_file_to_storage(self, file_name: str, file_content: bytes, bucket_name: str = "resumes") -> str | None:
        """
        Uploads file binary to Supabase Storage bucket and returns the public URL.
        """
        if not self.is_configured:
            return f"https://mock-supabase-storage.local/{bucket_name}/{file_name}"

        unique_filename = f"{uuid.uuid4()}-{file_name}"
        
        try:
            self.client.storage.from_(bucket_name).upload(
                path=unique_filename,
                file=file_content,
                file_options={"content-type": "application/octet-stream"}
            )
            public_url_res = self.client.storage.from_(bucket_name).get_public_url(unique_filename)
            return public_url_res
        except Exception as e:
            print(f"Warning: Failed to upload file to storage: {str(e)}")
            return None

    def update_user_password(self, email: str, new_password_hash: str) -> bool:
        """
        Updates user password hash in the database.
        """
        if not self.is_configured:
            # Update mock database
            user = self.get_user_by_email(email)
            if user:
                user["password_hash"] = new_password_hash
                return True
            return False

        try:
            response = self.client.table("users").update({"password_hash": new_password_hash}).eq("email", email).execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            raise RuntimeError(f"Database error during password update: {str(e)}")
