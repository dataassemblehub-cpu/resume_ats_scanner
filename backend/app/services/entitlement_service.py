from typing import Any

class EntitlementService:
    @staticmethod
    def get_entitlements(user: Any) -> dict:
        """
        Calculates feature flags for a user based on their subscription tier and quotas.
        Supports raw dictionaries (from Supabase queries) and SQLAlchemy model instances.
        """
        if not user:
            return {
                "can_generate_ai": False,
                "can_export_report": False,
                "can_copy_suggestions": False
            }

        if isinstance(user, dict):
            plan = user.get("subscription_plan", "free")
            ai_count = user.get("ai_generation_count", 0)
        else:
            plan = getattr(user, "subscription_plan", "free")
            ai_count = getattr(user, "ai_generation_count", 0)

        if plan == "premium":
            return {
                "can_generate_ai": True,
                "can_export_report": True,
                "can_copy_suggestions": True
            }
        else:
            # Free tier: allowed exactly 1 AI recommendation lifetime
            return {
                "can_generate_ai": ai_count == 0,
                "can_export_report": False,
                "can_copy_suggestions": False
            }

    @staticmethod
    def can_generate_ai(user: Any) -> bool:
        return EntitlementService.get_entitlements(user)["can_generate_ai"]

    @staticmethod
    def can_export_report(user: Any) -> bool:
        return EntitlementService.get_entitlements(user)["can_export_report"]

    @staticmethod
    def can_copy_suggestions(user: Any) -> bool:
        return EntitlementService.get_entitlements(user)["can_copy_suggestions"]
