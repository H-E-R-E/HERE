import email.mime.text
import logging
import pathlib
import random
from typing import Optional
import aiosmtplib
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger("app.email")


# --- 1. Helper utilities ---
def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP code."""
    return str(random.randint(100000, 999999))


# --- 2. HTML template renderer ---
def render_template(template_name: str, replacements: dict) -> str:
    """Render an HTML email template from the templates directory."""
    # Build absolute path to template
    template_path = (
        pathlib.Path(__file__).parent.parent / "templates" / template_name
    )

    if not template_path.exists():
        # Fallback if templates haven't been copied yet
        fallback_templates = {
            "welcome.html": "<html><body><h1>Welcome!</h1><p>Hi [Name], your OTP code is: <strong>[OTP_CODE]</strong></p></body></html>",
            "welcome-verified.html": "<html><body><h1>Welcome!</h1><p>Hi [Name], your account has been successfully verified.</p></body></html>",
            "otp.html": "<html><body><h1>Verification Code</h1><p>Your verification code is: <strong>[OTP_CODE]</strong></p></body></html>",
        }
        html = fallback_templates.get(template_name, "<html><body></body></html>")
    else:
        with open(template_path, "r", encoding="utf-8") as f:
            html = f.read()

    # Replace placeholders
    for key, value in replacements.items():
        html = html.replace(f"[{key}]", str(value))
        html = html.replace(key, str(value))  # direct matching

    return html


# --- 3. Async SMTP and Logging Mailer ---
async def send_async_email(
    to_email: str, subject: str, html_body: str
) -> None:
    """Send an HTML email asynchronously using SMTP, with a console log fallback."""
    # Determine if dummy/local config is active
    is_mock = (
        settings.smtp_host == "localhost"
        or settings.smtp_username == "test_user"
        or settings.smtp_username == "user@gmail.com"
        or settings.smtp_password == "app-specific-password"
        or not settings.smtp_host
    )

    if is_mock:
        logger.info(
            f"\n"
            f"========================================================================\n"
            f"                       [DEV MAIL NOTIFICATION]\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"Body:\n"
            f"{html_body}\n"
            f"========================================================================"
        )
        return

    # Build standard MIME email message
    msg = email.mime.text.MIMEText(html_body, "html")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email

    try:
        # Connect and send via async SMTP using aiosmtplib.
        # Passing username and password directly allows aiosmtplib to handle
        # connection, TLS/STARTTLS, and authentication automatically and robustly.
        async with aiosmtplib.SMTP(
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username or None,
            password=settings.smtp_password or None,
            use_tls=(settings.smtp_port == 465),
        ) as smtp:
            await smtp.send_message(msg)
        logger.info(f"Email with subject '{subject}' sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {e}")
        # Log to console as emergency fallback
        logger.warning(
            f"[FALLBACK MAIL LOG]\nTo: {to_email}\nSubject: {subject}\nBody: {html_body}"
        )


async def send_welcome_email(to_email: str, name: str, otp: str) -> None:
    """Send a welcome email with OTP code."""
    html = render_template(
        "welcome.html", {"[Name]": name, "[OTP_CODE]": otp, "OTP_CODE": otp}
    )
    await send_async_email(to_email, "Welcome to Here - Verify Your Account", html)


async def send_verified_welcome_email(to_email: str, name: str) -> None:
    """Send welcome email to pre-verified third-party signups."""
    html = render_template("welcome-verified.html", {"[Name]": name})
    await send_async_email(
        to_email, "Welcome to H.E.R.E - Let's Get Started!", html
    )


async def send_otp_email(to_email: str, otp: str) -> None:
    """Send an OTP code verification email."""
    html = render_template("otp.html", {"[OTP_CODE]": otp, "OTP_CODE": otp})
    await send_async_email(to_email, "Your Here Verification Code", html)


# --- 4. Redis Async Integrations ---
async def store_otp_in_redis(
    redis_client: aioredis.Redis, email: str, otp: str, expiry_seconds: int
) -> None:
    """Store verification OTP code in Redis with TTL expiration."""
    key = f"{settings.otp_prefix}{email}"
    await redis_client.setex(key, expiry_seconds, otp)
    logger.info(
        f"OTP stored in Redis for {email} with {expiry_seconds}s expiry"
    )


async def verify_otp_from_redis(
    redis_client: aioredis.Redis, email: str, otp: str
) -> bool:
    """Verify OTP code from Redis. Deletes it if verification succeeds."""
    key = f"{settings.otp_prefix}{email}"
    stored_otp = await redis_client.get(key)
    if stored_otp is not None:
        stored_otp = stored_otp if isinstance(stored_otp, str) else stored_otp.decode("utf-8")

    if stored_otp == otp:
        await redis_client.delete(key)
        logger.info(f"OTP verified and deleted for {email}")
        return True

    logger.info(f"OTP verification failed for {email}")
    return False


async def blacklist_token(
    redis_client: aioredis.Redis, token: str, expiry_seconds: int
) -> None:
    """Blacklist a JWT token in Redis with a TTL matching remaining token lifespan."""
    key = f"{settings.blacklist_token_prefix}{token}"
    await redis_client.setex(key, expiry_seconds, "1")
    logger.info(f"Token blacklisted with {expiry_seconds}s expiry")


async def is_token_blacklisted(
    redis_client: aioredis.Redis, token: str
) -> bool:
    """Check if token is blacklisted in Redis."""
    key = f"{settings.blacklist_token_prefix}{token}"
    exists = await redis_client.exists(key)
    return bool(exists)
