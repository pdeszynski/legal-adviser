"""JWT Authentication module for AI Engine.

This module provides JWT validation functionality to authenticate users
directly in the AI Engine using the same JWT signing key as the backend.

The JWT tokens are issued by the NestJS backend and validated here.
"""

from .jwt import (
    JWTError,
    JWTExpiredError,
    JWTValidationError,
    UserContext,
    get_current_user,
    get_current_user_optional,
    get_token_from_header,
    is_valid_uuid_v4,
    jwt_dependency,
    set_user_session_id,
    validate_jwt_token,
)

__all__ = [
    "JWTError",
    "JWTExpiredError",
    "JWTValidationError",
    "UserContext",
    "get_current_user",
    "get_current_user_optional",
    "get_token_from_header",
    "is_valid_uuid_v4",
    "jwt_dependency",
    "set_user_session_id",
    "validate_jwt_token",
]
