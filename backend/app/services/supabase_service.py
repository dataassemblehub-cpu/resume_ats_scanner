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
                "subscription_plan": "free",
                "environment": settings.ENV,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
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
        If a placeholder record already exists (created by anonymous scans, i.e. password_hash is empty),
        it updates that record with the credentials instead of raising an error.
        """
        existing_user = self.get_user_by_email(email)
        
        if not self.is_configured:
            if existing_user:
                if existing_user.get("password_hash"):
                    raise ValueError("A user with this email address already exists.")
                # Update existing mock placeholder
                existing_user["password_hash"] = password_hash
                return existing_user
            
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
            if existing_user:
                if existing_user.get("password_hash"):
                    raise ValueError("A user with this email address already exists.")
                
                # Update existing placeholder database record
                response = self.client.table("users").update({
                    "password_hash": password_hash,
                    "updated_at": datetime.now().isoformat()
                }).eq("id", existing_user["id"]).execute()
                
                if response.data:
                    return response.data[0]
                raise RuntimeError("Database error updating existing user credentials.")
                
            payload = {
                "email": email,
                "password_hash": password_hash,
                "subscription_plan": "free",
                "ai_generation_count": 0,
                "environment": settings.ENV,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            response = self.client.table("users").insert(payload).execute()
            if response.data:
                return response.data[0]
            raise RuntimeError("Database error creating user credentials.")
        except Exception as e:
            raise RuntimeError(str(e))

    def migrate_user_uuid_by_email(self, email: str, new_uuid: str) -> dict | None:
        """
        Migrates an existing user's record (and associated resumes) from an old UUID
        to the new Supabase Auth UUID if the email matches.
        """
        if not self.is_configured:
            # Mock mode implementation
            old_uid = None
            for uid, u in self._mock_users.items():
                if u["email"].lower() == email.lower() and uid != new_uuid:
                    old_uid = uid
                    break
            
            if old_uid:
                user_data = self._mock_users.pop(old_uid)
                user_data["id"] = new_uuid
                self._mock_users[new_uuid] = user_data
                
                # Migrate mock resumes
                for resume in self._mock_resumes.values():
                    if resume.get("user_id") == old_uid:
                        resume["user_id"] = new_uuid
            return self._mock_users.get(new_uuid)

        try:
            # Query if user exists with the matching email
            response = self.client.table("users").select("*").eq("email", email).execute()
            if response.data and len(response.data) > 0:
                old_user = response.data[0]
                old_uuid = old_user["id"]
                if old_uuid != new_uuid:
                    print(f"Migrating user {email} from old UUID {old_uuid} to new UUID {new_uuid}...")
                    
                    # 1. Insert temporary new user with temp email to satisfy resumes FK constraint
                    temp_email = f"{email}-temp-{uuid.uuid4()}"
                    self.client.table("users").insert({
                        "id": new_uuid,
                        "email": temp_email,
                        "subscription_plan": old_user.get("subscription_plan", "free"),
                        "ai_generation_count": old_user.get("ai_generation_count", 0),
                        "last_ai_generation_at": old_user.get("last_ai_generation_at"),
                        "environment": settings.ENV,
                        "created_at": old_user.get("created_at", datetime.now().isoformat()),
                        "updated_at": datetime.now().isoformat()
                    }).execute()
                    
                    # 2. Update resumes user_id to new_uuid
                    self.client.table("resumes").update({"user_id": new_uuid}).eq("user_id", old_uuid).execute()
                    
                    # 3. Delete old user record
                    self.client.table("users").delete().eq("id", old_uuid).execute()
                    
                    # 4. Update new user to restore original email
                    self.client.table("users").update({"email": email}).eq("id", new_uuid).execute()
                    
                response = self.client.table("users").select("*").eq("id", new_uuid).execute()
                return response.data[0] if response.data else None
            return None
        except Exception as e:
            print(f"Warning: Failed to migrate user UUID by email: {str(e)}")
            return None



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
        file_url: str | None = None,
        jd_text: str | None = None
    ) -> dict:
        """
        Saves parsed resume data into Supabase 'resumes' table and prunes history to latest 10.
        """
        payload = {
            "user_id": user_id,
            "file_name": file_name,
            "file_url": file_url,
            "parsed_text": parsed_text,
            "email": email,
            "phone": phone,
            "name": name,
            "jd_text": jd_text,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "environment": settings.ENV
        }

        if not self.is_configured:
            new_id = str(uuid.uuid4())
            payload["id"] = new_id
            self._mock_resumes[new_id] = payload
            
            # Prune mock resumes to latest 10
            user_resumes = [r for r in self._mock_resumes.values() if r.get("user_id") == user_id and not r.get("is_deleted", False)]
            user_resumes.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            if len(user_resumes) > 10:
                to_delete = user_resumes[10:]
                for old_res in to_delete:
                    old_id = old_res.get("id")
                    if old_id in self._mock_resumes:
                        self._mock_resumes[old_id]["is_deleted"] = True
                        
            return payload

        try:
            response = self.client.table("resumes").insert({
                "user_id": user_id,
                "file_name": file_name,
                "file_url": file_url,
                "parsed_text": parsed_text,
                "email": email,
                "phone": phone,
                "name": name,
                "jd_text": jd_text,
                "environment": settings.ENV,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }).execute()
            if response.data and len(response.data) > 0:
                inserted_resume = response.data[0]
                
                # Prune Supabase database resumes to latest 10
                try:
                    res_query = self.client.table("resumes").select("id").eq("user_id", user_id).eq("is_deleted", False).order("created_at", desc=True).execute()
                    if res_query.data and len(res_query.data) > 10:
                        ids_to_keep = [r["id"] for r in res_query.data[:10]]
                        ids_to_delete = [r["id"] for r in res_query.data if r["id"] not in ids_to_keep]
                        if ids_to_delete:
                            self.client.table("resumes").update({"is_deleted": True}).in_("id", ids_to_delete).execute()
                except Exception as prune_err:
                    print(f"Warning: Failed to prune user scan history in DB: {str(prune_err)}")
                    
                return inserted_resume
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
                "recommendations": recommendations,
                "updated_at": datetime.now().isoformat()
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
                if r.get("user_id") == user_uuid and not r.get("is_deleted", False)
            ]
            # Order by updated_at desc
            user_resumes.sort(key=lambda x: x.get("updated_at", x.get("created_at", "")), reverse=True)
            
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
                    "updated_at": r.get("updated_at", r["created_at"]),
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
            count_res = self.client.table("resumes").select("id", count="exact").eq("user_id", user_uuid).eq("is_deleted", False).execute()
            total = count_res.count if count_res.count is not None else 0

            # Query items
            response = self.client.table("resumes").select(
                "id", "file_name", "name", "email", "phone", "created_at", "updated_at", "recommendations"
            ).eq("user_id", user_uuid).eq("is_deleted", False).order("updated_at", desc=True).range(offset, offset + limit - 1).execute()
            
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
                        "updated_at": r.get("updated_at", r["created_at"]),
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
        Soft deletes a resume record ensuring ownership by the authenticated user UUID.
        """
        if not self.is_configured:
            if resume_id in self._mock_resumes:
                if self._mock_resumes[resume_id].get("user_id") == user_uuid:
                    self._mock_resumes[resume_id]["is_deleted"] = True
                    return True
            return False

        try:
            response = self.client.table("resumes").update({"is_deleted": True}).eq("id", resume_id).eq("user_id", user_uuid).execute()
            return len(response.data) > 0 if response.data else True
        except Exception as e:
            raise RuntimeError(f"Failed to soft delete history record: {str(e)}")

    def get_resume_by_id(self, user_uuid: str, resume_id: str) -> dict | None:
        """
        Retrieves a full resume record for dashboard reloading, verifying user ownership and active status.
        """
        if not self.is_configured:
            res = self._mock_resumes.get(resume_id)
            if res and res.get("user_id") == user_uuid and not res.get("is_deleted", False):
                return res
            return None

        try:
            response = self.client.table("resumes").select("*").eq("id", resume_id).eq("user_id", user_uuid).eq("is_deleted", False).execute()
            if response.data:
                res = response.data[0]
                print(f"GET_RESUME_BY_ID: fetched {resume_id}, jd_text length: {len(res.get('jd_text', '')) if res.get('jd_text') else 0}")
                return res
            return None
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

    def claim_resume(self, resume_id: str, user_uuid: str) -> bool:
        """
        Updates the user_id of an existing resume scan, effectively assigning an anonymous scan to a logged-in user.
        """
        if not self.is_configured:
            if resume_id in self._mock_resumes:
                self._mock_resumes[resume_id]["user_id"] = user_uuid
                return True
            return False

        try:
            response = self.client.table("resumes").update({"user_id": user_uuid}).eq("id", resume_id).execute()
            return len(response.data) > 0 if response.data else True
        except Exception as e:
            raise RuntimeError(f"Failed to claim resume: {str(e)}")
