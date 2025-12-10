"""
API v1 Router - Aggregates all v1 endpoints
"""
from fastapi import APIRouter
from app.api.v1.endpoints import health, conversation_endpoints, supplier_portal, websocket_endpoints


# Create main v1 router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router)
api_router.include_router(conversation_endpoints.router)


# Add this line to your router
api_router.include_router(supplier_portal.router)
api_router.include_router(websocket_endpoints.router)