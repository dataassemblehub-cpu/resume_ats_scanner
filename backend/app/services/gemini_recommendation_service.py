import json
import time
import uuid
import hashlib
import httpx
import asyncio
from typing import Dict, Any
from app.config import settings
from app.utils.logging_config import logger
from app.services.ai_recommendation_service import AIRecommendationService

class GeminiRecommendationService(AIRecommendationService):
    PROMPT_VERSION = "v2"
    
    # In-memory cache to save API usage
    # Format: { cache_key: (expiration_timestamp, response_dict) }
    _cache: Dict[str, tuple[float, dict]] = {}
    _cache_ttl = 86400  # 24 hours in seconds

    async def generate_recommendations(self, resume_text: str, jd_text: str, ats_results: dict) -> dict:
        req_id = str(uuid.uuid4())
        
        # 1. API Key Validation
        if not settings.GEMINI_API_KEY:
            logger.warning(f"[{req_id}] GEMINI_API_KEY is not configured in settings.")
            raise ValueError("GEMINI_API_KEY is not configured. Please set it in your environment variables.")

        # 2. Caching Layer
        # Serialize the ATS results with sorted keys to ensure deterministic hashing
        ats_results_str = json.dumps(ats_results, sort_keys=True)
        combined_string = resume_text + jd_text + ats_results_str + self.PROMPT_VERSION
        cache_key = hashlib.sha256(combined_string.encode('utf-8')).hexdigest()
        
        current_time = time.time()
        if cache_key in self._cache:
            exp_time, cached_data = self._cache[cache_key]
            if current_time < exp_time:
                logger.info(f"[{req_id}] Cache HIT. Returning cached recommendations.")
                return cached_data
            else:
                logger.info(f"[{req_id}] Cache EXPIRED. Evicting cache key.")
                del self._cache[cache_key]
        else:
            logger.info(f"[{req_id}] Cache MISS. Initiating API call.")

        # 3. Construct Prompts & Instructions
        prompt = (
            f"You are an expert resume reviewer and professional recruiter.\n"
            f"Review the candidate's resume and target job description along with the computed ATS metrics to generate concrete, highly specific, and actionable recommendations.\n\n"
            f"CRITICAL RULES:\n"
            f"1. Do NOT recalculate or invent ATS scores. Use the deterministic results provided.\n"
            f"2. Never fabricate certifications, companies, employers, or years of experience.\n"
            f"3. Do NOT add technologies or skills to the experience bullet suggestions that are not already present in the resume or specifically asked for in the job description.\n"
            f"4. Preserve the user's actual quantified achievements (e.g. percentages, money saved, metrics).\n"
            f"5. All suggestions must be specific and actionable. Avoid vague advice like 'improve formatting', 'add keywords', or 'write better bullets'. Instead, state exactly what to add, remove, or edit.\n"
            f"6. 'suggested_bullet_points' MUST be actual, ready-to-use rewritten experience sentences based on the candidate's real work history in the resume, rewritten to integrate missing keywords naturally and increase impact. Do not output meta-instructions.\n\n"
            f"Candidate Resume:\n"
            f"\"\"\"\n{resume_text}\n\"\"\"\n\n"
            f"Target Job Description:\n"
            f"\"\"\"\n{jd_text}\n\"\"\"\n\n"
            f"Computed ATS Metrics:\n"
            f"- Overall score: {ats_results.get('overall')}\n"
            f"- Skills score: {ats_results.get('skills')}\n"
            f"- Experience score: {ats_results.get('experience')}\n"
            f"- Projects score: {ats_results.get('projects')}\n"
            f"- Education score: {ats_results.get('education')}\n"
            f"- Matched Keywords: {ats_results.get('keywords', {}).get('matched', [])}\n"
            f"- Missing Keywords: {ats_results.get('keywords', {}).get('missing', [])}\n"
            f"- Formatting Issues: {ats_results.get('formatting', {}).get('issues', [])}\n"
            f"- Formatting Warnings: {ats_results.get('formatting', {}).get('warnings', [])}\n\n"
            f"Please generate:\n"
            f"- A summary of the resume\n"
            f"- Gaps/Weaknesses and Strengths\n"
            f"- Priority missing skills (in priority order)\n"
            f"- High-impact ATS improvements\n"
            f"- Experience bullet suggestions (actual rewritten sentences from the candidate experience, incorporating missing keywords)\n"
            f"- Formatting recommendations\n"
            f"- Recruiter readability advice\n"
        )

        response_schema = {
            "type": "object",
            "properties": {
                "resume_summary": {"type": "string"},
                "strengths": {"type": "array", "items": {"type": "string"}},
                "weaknesses": {"type": "array", "items": {"type": "string"}},
                "missing_skills": {"type": "array", "items": {"type": "string"}},
                "ats_improvements": {"type": "array", "items": {"type": "string"}},
                "recruiter_improvements": {"type": "array", "items": {"type": "string"}},
                "suggested_bullet_points": {"type": "array", "items": {"type": "string"}},
                "resume_improvements": {"type": "array", "items": {"type": "string"}},
                "ats_recommendations": {"type": "array", "items": {"type": "string"}}
            },
            "required": [
                "resume_summary",
                "strengths",
                "weaknesses",
                "missing_skills",
                "ats_improvements",
                "recruiter_improvements",
                "suggested_bullet_points",
                "resume_improvements",
                "ats_recommendations"
            ]
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "response_schema": response_schema
            }
        }

        # 4. HTTP client call with Retry Logic & Timeout (30s)
        max_retries = 3
        retry_status_codes = {429, 500, 502, 503, 504}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(1, max_retries + 1):
                start_time = time.time()
                try:
                    logger.info(f"[{req_id}] Sending HTTP request to Gemini (Attempt {attempt}/{max_retries}). Model: {settings.GEMINI_MODEL}")
                    response = await client.post(url, json=payload)
                    latency = time.time() - start_time
                    status = response.status_code
                    
                    logger.info(f"[{req_id}] Gemini response status: {status} | Latency: {latency:.4f}s")
                    
                    # If success
                    if status == 200:
                        try:
                            res_json = response.json()
                            candidate_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                            parsed_rec = json.loads(candidate_text)
                            
                            # Simple validation check for required keys
                            required_keys = set(response_schema["required"])
                            if not required_keys.issubset(parsed_rec.keys()):
                                raise KeyError("Gemini JSON response is missing required keys.")
                            
                            # Inject success status
                            parsed_rec["status"] = "success"
                            parsed_rec["message"] = None
                            
                            # Cache the result
                            self._cache[cache_key] = (time.time() + self._cache_ttl, parsed_rec)
                            return parsed_rec
                        except Exception as e:
                            logger.error(f"[{req_id}] Validation/Parsing error on Gemini response content: {str(e)}")
                            # Fallback if parsing fails
                            return self._get_fallback_response(f"Failed to parse AI response: {str(e)}")
                            
                    # If transient retry status code
                    elif status in retry_status_codes:
                        if attempt == max_retries:
                            logger.error(f"[{req_id}] Max retries reached. Server returned transient status: {status}")
                            break
                        backoff = 2 ** attempt
                        logger.warning(f"[{req_id}] Transient status code {status}. Backoff retrying in {backoff}s...")
                        await asyncio.sleep(backoff)
                        
                    # If immediate fail status code (e.g. 400, 401)
                    else:
                        logger.error(f"[{req_id}] Failing immediately on status code: {status}")
                        break
                        
                except (httpx.TimeoutException, httpx.NetworkError) as te:
                    latency = time.time() - start_time
                    logger.error(f"[{req_id}] Timeout/Network Exception on attempt {attempt}: {str(te)} | Latency: {latency:.4f}s")
                    if attempt == max_retries:
                        break
                    backoff = 2 ** attempt
                    logger.warning(f"[{req_id}] Retrying in {backoff}s after Timeout/Network exception...")
                    await asyncio.sleep(backoff)
                except Exception as ex:
                    logger.error(f"[{req_id}] Unexpected error during request dispatch: {str(ex)}")
                    break
        
        # 5. Fallback Response if retries exhausted or severe error
        return self._get_fallback_response("AI recommendations are temporarily unavailable due to request failures.")

    def _get_fallback_response(self, message: str) -> dict:
        return {
            "status": "unavailable",
            "message": message,
            "resume_summary": None,
            "strengths": [],
            "weaknesses": [],
            "missing_skills": [],
            "ats_improvements": [],
            "recruiter_improvements": [],
            "suggested_bullet_points": [],
            "resume_improvements": [],
            "ats_recommendations": []
        }
