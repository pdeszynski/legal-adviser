"""JWT validation for AI Engine authentication.

This module implements JWT token validation that is compatible with the
NestJS backend's JWT implementation.

Backend JWT Configuration (for reference):
- Algorithm: HS256
- Secret: JWT_SECRET environment variable
- Expiration: 60 minutes for access tokens
- Payload: { sub, username, email, roles, type }
"""

import logging
from dataclasses import dataclass
from typing import Any

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..config import get_settings

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Custom Exceptions
# -----------------------------------------------------------------------------


class JWTError(Exception):
    """Base exception for JWT errors."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(message)


class JWTValidationError(JWTError):
    """Raised when JWT token validation fails."""

    pass


class JWTExpiredError(JWTError):
    """Raised when JWT token has expired."""

    pass


# -----------------------------------------------------------------------------
# User Context Model
# -----------------------------------------------------------------------------


@dataclass(frozen=True)
class UserContext:
    """User information extracted from validated JWT token.

    This matches the ValidatedUser interface from the backend's jwt.strategy.ts.
    """

    id: str  # User UUID (from 'sub' claim)
    username: str
    email: str
    roles: list[str]

    @property
    def role_level(self) -> int:
        """Get the highest role level for RBAC.

        Role hierarchy from backend:
        SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)
        """
        role_levels = {
            "SUPER_ADMIN": 5,
            "ADMIN": 4,
            "LAWYER": 3,
            "PARALEGAL": 2,
            "CLIENT": 1,
            "GUEST": 0,
            "USER": 1,
        }

        if not self.roles:
            return 0

        return max(role_levels.get(role.upper(), 0) for role in self.roles)

    @property
    def is_admin(self) -> bool:
        """Check if user has admin privileges."""
        return self.role_level >= 4

    @property
    def is_lawyer(self) -> bool:
        """Check if user has lawyer privileges."""
        return self.role_level >= 3


# -----------------------------------------------------------------------------
# JWT Validation
# -----------------------------------------------------------------------------


def _decode_jwt(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token.

    This function validates JWT tokens signed by the NestJS backend.
    It uses the same JWT_SECRET and algorithm (HS256).

    Args:
        token: The JWT token string

    Returns:
        Decoded token payload as dictionary

    Raises:
        JWTValidationError: If token is invalid or malformed
        JWTExpiredError: If token has expired
    """
    try:
        import jwt
    except ImportError:
        raise ImportError(
            "PyJWT is required for JWT validation. "
            "Install it with: uv add pyjwt"
        )

    settings = get_settings()
    secret = settings.JWT_SECRET

    try:
        # Decode and verify the token
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={
                "require": ["sub", "email"],  # Required claims
                "verify_exp": True,  # Verify expiration
            },
        )
        return payload

    except jwt.ExpiredSignatureError as e:
        logger.debug("JWT token expired: %s", str(e))
        raise JWTExpiredError(
            "Token has expired",
            details={"error_code": "TOKEN_EXPIRED"},
        ) from e

    except jwt.InvalidTokenError as e:
        logger.debug("Invalid JWT token: %s", str(e))
        raise JWTValidationError(
            "Invalid token",
            details={"error_code": "INVALID_TOKEN", "reason": str(e)},
        ) from e

    except Exception as e:
        logger.exception("Unexpected error during JWT validation")
        raise JWTValidationError(
            "Token validation failed",
            details={"error_code": "VALIDATION_ERROR", "reason": str(e)},
        ) from e


def validate_jwt_token(token: str) -> UserContext:
    """Validate a JWT token and extract user context.

    This is the main JWT validation function. It:
    1. Decodes the token using the shared JWT_SECRET
    2. Validates required claims (sub, email)
    3. Checks token expiration
    4. Validates token type (must be 'access' or omitted)

    Args:
        token: The JWT token string (typically from Authorization header)

    Returns:
        UserContext with user information extracted from token claims

    Raises:
        JWTValidationError: If token is invalid
        JWTExpiredError: If token has expired
        HTTPException: With 401 status for all validation failures
    """
    try:
        payload = _decode_jwt(token)
    except JWTError:
        # Re-raise JWT errors as HTTP 401
        raise
    except ImportError as e:
        # PyJWT not installed - configuration error
        logger.error("PyJWT not installed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "CONFIG_ERROR",
                "message": "JWT validation not configured",
            },
        ) from e

    # Validate token type (reject refresh tokens)
    token_type = payload.get("type")
    if token_type == "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INVALID_TOKEN_TYPE",
                "message": "Refresh tokens cannot be used for API access",
            },
        )

    # Reject 2FA temporary tokens
    if token_type == "2fa-temp":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INCOMPLETE_AUTH",
                "message": "Two-factor authentication not completed",
            },
        )

    # Extract user information
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INVALID_TOKEN",
                "message": "Token missing user ID",
            },
        )

    email = payload.get("email", "")
    username = payload.get("username", email)
    roles = payload.get("roles", [])

    # Normalize roles to list
    if isinstance(roles, str):
        roles = [roles]
    elif not isinstance(roles, list):
        roles = list(roles) if roles else []

    return UserContext(
        id=user_id,
        username=username,
        email=email,
        roles=roles,
    )


# -----------------------------------------------------------------------------
# FastAPI Dependencies
# -----------------------------------------------------------------------------


# Security scheme for OpenAPI documentation
security = HTTPBearer(auto_error=False)


async def _jwt_dependency_from_credentials(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> UserContext:
    """Internal dependency that extracts and validates JWT from credentials.

    Args:
        credentials: HTTP Bearer credentials from Authorization header

    Returns:
        UserContext with authenticated user information

    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "MISSING_TOKEN",
                "message": "Authorization header required",
                "scheme": "Bearer",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    return validate_jwt_token(token)


def jwt_dependency(
    authorization: str | None = Header(None, description="JWT token in format: Bearer <token>"),
) -> UserContext:
    """FastAPI dependency for JWT authentication.

    This dependency extracts the JWT token from the Authorization header
    and validates it, returning the user context.

    Usage in FastAPI endpoints:
        ```python
        @app.post("/api/v1/protected")
        async def protected_endpoint(user: UserContext = Depends(jwt_dependency)):
            return {"message": f"Hello {user.username}"}
        ```

    For optional authentication (allow unauthenticated requests):
        ```python
        from fastapi import Depends

        async def optional_jwt(
            authorization: str | None = Header(None)
        ) -> UserContext | None:
            if authorization is None:
                return None
            try:
                return jwt_dependency(authorization)
            except HTTPException:
                return None

        @app.post("/api/v1/optional")
        async def optional_endpoint(user: UserContext | None = Depends(optional_jwt)):
            if user:
                return {"message": f"Hello {user.username}"}
            return {"message": "Hello guest"}
        ```

    Args:
        authorization: Raw Authorization header value

    Returns:
        UserContext with authenticated user information

    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "MISSING_TOKEN",
                "message": "Authorization header required",
                "scheme": "Bearer",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INVALID_AUTH_FORMAT",
                "message": "Authorization header must be in format: Bearer <token>",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    return validate_jwt_token(token)


# Alias for using with Depends()
get_current_user = jwt_dependency


async def get_current_user_optional(
    authorization: str | None = Header(None, description="JWT token in format: Bearer <token>"),
) -> UserContext | None:
    """Optional JWT authentication dependency.

    This dependency attempts to validate the JWT token if provided,
    but returns None if no token is present or if validation fails.
    Use this for endpoints that work with or without authentication.

    Usage in FastAPI endpoints:
        ```python
        @app.post("/api/v1/qa/stream")
        async def stream_qa(
            request: AskQuestionRequest,
            user: UserContext | None = Depends(get_current_user_optional),
        ):
            user_id = user.id if user else None
            ...
        ```

    Args:
        authorization: Raw Authorization header value

    Returns:
        UserContext if token is valid, None otherwise
    """
    if authorization is None:
        return None

    try:
        return await _jwt_dependency_from_credentials(
            HTTPAuthorizationCredentials(scheme="Bearer", credentials=authorization.split()[1])
        )
    except (HTTPException, JWTError, IndexError):
        return None


def get_token_from_header(authorization: str | None) -> str | None:
    """Extract JWT token from Authorization header.

    Args:
        authorization: Raw Authorization header value

    Returns:
        JWT token string without "Bearer " prefix, or None if not present
    """
    if authorization is None:
        return None

    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]

    return None
