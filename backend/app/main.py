import logging
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.config import settings
from app.database import engine, Base
from app.routers import auth, user, event, chat, notification

# Set up logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("app.main")

# Initialize FastAPI App
app = FastAPI(
    title="H.E.R.E API Backend",
    description="Python FastAPI implementation port of H.E.R.E backend.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    """Verify database engines and dynamically create required tables on start."""
    logger.info("Initializing database schemas...")
    try:
        async with engine.begin() as conn:
            # Import models explicitly so that SQLAlchemy tracks the metadata correctly
            import app.models  # noqa: F401
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schemas initialized successfully.")
    except Exception as e:
        logger.error(f"Critical error initializing database schemas on startup: {e}")


# Register Modular API Routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(event.router)
app.include_router(chat.router)
app.include_router(notification.router)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc: HTTPException):
    """Intercept HTTP 404 Exceptions and serve the beautifully styled error.html."""
    if exc.status_code == 404:
        template_path = os.path.join(
            os.path.dirname(__file__), "templates", "error.html"
        )
        if os.path.exists(template_path):
            try:
                with open(template_path, "r", encoding="utf-8") as f:
                    html_content = f.read()
                return HTMLResponse(content=html_content, status_code=404)
            except Exception as err:
                logger.error(f"Failed to read custom 404 HTML template: {err}")

        # Fallback raw visual error page
        fallback_html = """
        <!DOCTYPE html>
        <html>
        <head><title>404 - Not Found</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>404 Page Not Found</h1>
            <p>Oops! The page you are looking for does not exist.</p>
            <a href="/docs">📚 Go to API Documentation</a>
        </body>
        </html>
        """
        return HTMLResponse(content=fallback_html, status_code=404)

    # Standard Pydantic JSON error fallback for other HTTP exceptions
    from fastapi.exception_handlers import http_exception_handler
    return await http_exception_handler(request, exc)


@app.get("/", tags=["General"])
async def root():
    """Default service greeting redirecting to interactive swagger API docs."""
    return {
        "message": "Welcome to H.E.R.E API Backend. Use /docs to view Swagger interactive schemas.",
        "status": "Running",
    }
