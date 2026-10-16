"""Pure ASGI middleware (not BaseHTTPMiddleware) so streaming/SSE responses work."""

import re
import time
import uuid

import structlog
from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

REQUEST_ID_HEADER = "X-Request-ID"
_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9-]{8,64}$")

logger = structlog.get_logger(__name__)


class RequestIdMiddleware:
    """Binds a request id to structlog contextvars, echoes it, logs `http.request`.

    Headers and bodies are never logged; the path is logged without its query string.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        incoming = Headers(scope=scope).get(REQUEST_ID_HEADER)
        request_id = (
            incoming if incoming and _VALID_REQUEST_ID.fullmatch(incoming) else str(uuid.uuid4())
        )
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        status = 500
        start = time.perf_counter()

        async def send_with_id(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                MutableHeaders(scope=message)[REQUEST_ID_HEADER] = request_id
            await send(message)

        try:
            await self.app(scope, receive, send_with_id)
        finally:
            await logger.ainfo(
                "http.request",
                method=scope["method"],
                path=scope["path"],
                status=status,
                duration_ms=(time.perf_counter() - start) * 1000,
            )
            structlog.contextvars.clear_contextvars()
