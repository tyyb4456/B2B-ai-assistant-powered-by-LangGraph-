"""
WebSocket Endpoints for Real-time Notifications

Provides WebSocket connections for:
- Real-time supplier response notifications
- Workflow status updates
- Live conversation updates
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
from datetime import datetime
from loguru import logger
import json

router = APIRouter(prefix="/ws", tags=["websockets"])

# Active WebSocket connections
# Structure: {thread_id: {websocket1, websocket2, ...}}
active_connections: Dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    """Manages WebSocket connections for conversations"""
    
    @staticmethod
    async def connect(websocket: WebSocket, thread_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        
        if thread_id not in active_connections:
            active_connections[thread_id] = set()
        
        active_connections[thread_id].add(websocket)
        logger.info(f"✅ WebSocket connected for thread: {thread_id} (total: {len(active_connections[thread_id])})")
    
    @staticmethod
    def disconnect(websocket: WebSocket, thread_id: str):
        """Remove a WebSocket connection"""
        if thread_id in active_connections:
            active_connections[thread_id].discard(websocket)
            
            # Clean up empty sets
            if not active_connections[thread_id]:
                del active_connections[thread_id]
            
            logger.info(f"❌ WebSocket disconnected for thread: {thread_id}")
    
    @staticmethod
    async def send_message(thread_id: str, message: dict):
        """Send message to all connected clients for a thread"""
        if thread_id not in active_connections:
            logger.debug(f"No active connections for thread: {thread_id}")
            return
        
        disconnected = []
        
        for websocket in active_connections[thread_id]:
            try:
                await websocket.send_json(message)
                logger.debug(f"📤 Sent message to WebSocket client: {message.get('type')}")
            except Exception as e:
                logger.error(f"Failed to send WebSocket message: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected clients
        for ws in disconnected:
            active_connections[thread_id].discard(ws)


manager = ConnectionManager()


@router.websocket("/conversations/{thread_id}")
async def conversation_websocket(websocket: WebSocket, thread_id: str):
    """
    WebSocket endpoint for real-time conversation updates
    
    Client Usage:
```javascript
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws/conversations/{thread_id}');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message:', data);
    };
```
    
    Message Types:
    - connected: Initial connection confirmation
    - supplier_response_received: Supplier submitted response
    - workflow_status_changed: Workflow status update
    - pong: Heartbeat response
    """
    await manager.connect(websocket, thread_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "thread_id": thread_id,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "WebSocket connection established successfully"
        })
        
        # Keep connection alive and listen for client messages
        while True:
            try:
                # Receive text from client
                data = await websocket.receive_text()
                logger.debug(f"📥 Received from client: {data}")
                
                # Handle ping/pong for connection health
                if data == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
            except Exception as e:
                logger.error(f"Error receiving message: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"Client disconnected gracefully: {thread_id}")
    except Exception as e:
        logger.error(f"WebSocket error for thread {thread_id}: {e}", exc_info=True)
    finally:
        manager.disconnect(websocket, thread_id)


# ==============================================
# NOTIFICATION FUNCTIONS (called from services)
# ==============================================

async def notify_supplier_response(
    thread_id: str,
    request_id: str,
    supplier_response: str,
    response_type: str = None
):
    """
    Notify all connected clients that supplier has responded
    
    Called from: supplier_request_service.py after response is saved
    
    Args:
        thread_id: Conversation thread ID
        request_id: Supplier request ID
        supplier_response: Full supplier response text
        response_type: Type of response (accept, counteroffer, reject, etc.)
    """
    message = {
        "type": "supplier_response_received",
        "thread_id": thread_id,
        "request_id": request_id,
        "supplier_response_preview": supplier_response[:200] + ("..." if len(supplier_response) > 200 else ""),
        "response_type": response_type,
        "timestamp": datetime.utcnow().isoformat(),
        "action_required": "resume_workflow"
    }
    
    await manager.send_message(thread_id, message)
    logger.success(f"🔔 Notified clients of supplier response for thread: {thread_id}")


async def notify_workflow_status(
    thread_id: str,
    status: str,
    is_paused: bool,
    next_step: str = None
):
    """
    Notify clients of workflow status change
    
    Args:
        thread_id: Conversation thread ID
        status: Current workflow status
        is_paused: Whether workflow is paused
        next_step: Next step in workflow
    """
    message = {
        "type": "workflow_status_changed",
        "thread_id": thread_id,
        "status": status,
        "is_paused": is_paused,
        "next_step": next_step,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await manager.send_message(thread_id, message)
    logger.info(f"🔔 Notified clients of status change: {status} (paused: {is_paused})")


async def notify_message_added(
    thread_id: str,
    role: str,
    content: str,
    node: str = None
):
    """
    Notify clients that a new message was added to conversation
    
    Args:
        thread_id: Conversation thread ID
        role: Message role (user/assistant)
        content: Message content
        node: Workflow node that generated the message
    """
    message = {
        "type": "message_added",
        "thread_id": thread_id,
        "role": role,
        "content": content[:500] + ("..." if len(content) > 500 else ""),
        "node": node,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await manager.send_message(thread_id, message)
    logger.debug(f"🔔 Notified clients of new message in thread: {thread_id}")


# ==============================================
# UTILITY ENDPOINTS
# ==============================================

@router.get("/connections/active")
async def get_active_connections():
    """
    Get count of active WebSocket connections
    
    Useful for monitoring and debugging
    """
    return {
        "total_threads": len(active_connections),
        "connections_by_thread": {
            thread_id: len(connections)
            for thread_id, connections in active_connections.items()
        },
        "total_connections": sum(len(conns) for conns in active_connections.values())
    }