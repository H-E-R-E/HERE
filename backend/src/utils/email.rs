use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use rand::Rng;
use std::error::Error;
use tracing::{error, info};

use crate::core::configs::AppConfig;

/// Generate a 6-digit OTP code
pub fn generate_otp() -> String {
    let mut rng = rand::thread_rng();
    let otp: u32 = rng.gen_range(100000..999999);
    otp.to_string()
}

/// Send welcome email with OTP
///
/// # Arguments
/// * `config` - Application configuration containing SMTP settings
/// * `to_email` - Recipient email address
/// * `name` - Recipient's name
/// * `otp` - The OTP code to include in the email
///
/// # Returns
/// Result indicating success or failure
pub async fn send_welcome_email(
    config: &AppConfig,
    to_email: &str,
    name: &str,
    otp: &str,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    // Read the welcome.html template
    let template = include_str!("../templates/welcome.html");
    
    // Replace placeholders - only name and OTP code
    let html_body = template
        .replace("[Name]", name)
        .replace("[OTP_CODE]", otp);

    // Build the email
    let email = Message::builder()
        .from(
            config
                .smtp_from_email
                .parse()
                .map_err(|e| format!("Invalid from email: {}", e))?,
        )
        .to(to_email
            .parse()
            .map_err(|e| format!("Invalid to email: {}", e))?)
        .subject("Welcome to Here - Verify Your Account")
        .header(ContentType::TEXT_HTML)
        .body(html_body)?;

    // Create SMTP credentials
    let creds = Credentials::new(
        config.smtp_username.clone(),
        config.smtp_password.clone(),
    );

    // Build the SMTP transport
    let mailer = SmtpTransport::relay(&config.smtp_host)?
        .port(config.smtp_port)
        .credentials(creds)
        .build();

    // Send the email
    match mailer.send(&email) {
        Ok(_) => {
            info!("Welcome email sent successfully to {}", to_email);
            Ok(())
        }
        Err(e) => {
            error!("Failed to send welcome email to {}: {}", to_email, e);
            Err(Box::new(e))
        }
    }
}

/// Send welcome email for verified users (OAuth signups)
///
/// # Arguments
/// * `config` - Application configuration containing SMTP settings
/// * `to_email` - Recipient email address
/// * `name` - Recipient's name
///
/// # Returns
/// Result indicating success or failure
pub async fn send_verified_welcome_email(
    config: &AppConfig,
    to_email: &str,
    name: &str,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    // Read the welcome-verified.html template
    let template = include_str!("../templates/welcome-verified.html");
    
    // Replace placeholders - only name
    let html_body = template.replace("[Name]", name);

    // Build the email
    let email = Message::builder()
        .from(
            config
                .smtp_from_email
                .parse()
                .map_err(|e| format!("Invalid from email: {}", e))?,
        )
        .to(to_email
            .parse()
            .map_err(|e| format!("Invalid to email: {}", e))?)
        .subject("Welcome to H.E.R.E - Let's Get Started!")
        .header(ContentType::TEXT_HTML)
        .body(html_body)?;

    // Create SMTP credentials
    let creds = Credentials::new(
        config.smtp_username.clone(),
        config.smtp_password.clone(),
    );

    // Build the SMTP transport
    let mailer = SmtpTransport::relay(&config.smtp_host)?
        .port(config.smtp_port)
        .credentials(creds)
        .build();

    // Send the email
    match mailer.send(&email) {
        Ok(_) => {
            info!("Verified welcome email sent successfully to {}", to_email);
            Ok(())
        }
        Err(e) => {
            error!("Failed to send verified welcome email to {}: {}", to_email, e);
            Err(Box::new(e))
        }
    }
}

/// Send OTP verification email
///
/// # Arguments
/// * `config` - Application configuration containing SMTP settings
/// * `to_email` - Recipient email address
/// * `otp` - The OTP code to send
///
/// # Returns
/// Result indicating success or failure
pub async fn send_otp_email(
    config: &AppConfig,
    to_email: &str,
    otp: &str,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    // Read the otp.html template
    let template = include_str!("../templates/otp.html");
    
    // Replace placeholders - only OTP code
    let html_body = template.replace("[OTP_CODE]", otp);

    // Build the email
    let email = Message::builder()
        .from(
            config
                .smtp_from_email
                .parse()
                .map_err(|e| format!("Invalid from email: {}", e))?,
        )
        .to(to_email
            .parse()
            .map_err(|e| format!("Invalid to email: {}", e))?)
        .subject("Your Here Verification Code")
        .header(ContentType::TEXT_HTML)
        .body(html_body)?;

    // Create SMTP credentials
    let creds = Credentials::new(
        config.smtp_username.clone(),
        config.smtp_password.clone(),
    );

    // Build the SMTP transport
    let mailer = SmtpTransport::relay(&config.smtp_host)?
        .port(config.smtp_port)
        .credentials(creds)
        .build();

    // Send the email
    match mailer.send(&email) {
        Ok(_) => {
            info!("OTP email sent successfully to {}", to_email);
            Ok(())
        }
        Err(e) => {
            error!("Failed to send OTP email to {}: {}", to_email, e);
            Err(Box::new(e))
        }
    }
}

/// Store OTP in Redis with expiration
///
/// # Arguments
/// * `redis_pool` - Redis connection pool
/// * `prefix` - Redis key prefix (e.g., "otp:")
/// * `email` - User's email address (used as part of the key)
/// * `otp` - The OTP code to store
/// * `expiry_seconds` - TTL in seconds
///
/// # Returns
/// Result indicating success or failure
pub async fn store_otp_in_redis(
    redis_pool: &deadpool_redis::Pool,
    prefix: &str,
    email: &str,
    otp: &str,
    expiry_seconds: u64,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    use deadpool_redis::redis::AsyncCommands;

    let mut conn = redis_pool.get().await?;
    let key = format!("{}{}", prefix, email);
    
    // Set the OTP with expiration
    let _: () = conn.set_ex(&key, otp, expiry_seconds as u64).await?;
    
    info!("OTP stored in Redis for {} with {}s expiry", email, expiry_seconds);
    Ok(())
}

/// Verify OTP from Redis
///
/// # Arguments
/// * `redis_pool` - Redis connection pool
/// * `prefix` - Redis key prefix (e.g., "otp:")
/// * `email` - User's email address
/// * `otp` - The OTP code to verify
///
/// # Returns
/// Result with bool indicating if OTP is valid
pub async fn verify_otp_from_redis(
    redis_pool: &deadpool_redis::Pool,
    prefix: &str,
    email: &str,
    otp: &str,
) -> Result<bool, Box<dyn Error + Send + Sync>> {
    use deadpool_redis::redis::AsyncCommands;

    let mut conn = redis_pool.get().await?;
    let key = format!("{}{}", prefix, email);
    
    // Get the stored OTP
    let stored_otp: Option<String> = conn.get(&key).await?;
    
    match stored_otp {
        Some(stored) if stored == otp => {
            // OTP is valid, delete it so it can't be reused
            let _: () = conn.del(&key).await?;
            info!("OTP verified and deleted for {}", email);
            Ok(true)
        }
        Some(_) => {
            info!("Invalid OTP provided for {}", email);
            Ok(false)
        }
        None => {
            info!("No OTP found or expired for {}", email);
            Ok(false)
        }
    }
}

/// Blacklist a token in Redis with expiration
///
/// # Arguments
/// * `redis_pool` - Redis connection pool
/// * `prefix` - Redis key prefix (e.g., "blacklist:")
/// * `token` - The token to blacklist
/// * `expiry_seconds` - TTL in seconds (should match token expiry)
///
/// # Returns
/// Result indicating success or failure
pub async fn blacklist_token(
    redis_pool: &deadpool_redis::Pool,
    prefix: &str,
    token: &str,
    expiry_seconds: u64,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    use deadpool_redis::redis::AsyncCommands;

    let mut conn = redis_pool.get().await?;
    let key = format!("{}{}", prefix, token);
    
    // Store a marker value with expiration
    let _: () = conn.set_ex(&key, "1", expiry_seconds).await?;
    
    info!("Token blacklisted with {}s expiry", expiry_seconds);
    Ok(())
}

/// Check if a token is blacklisted
///
/// # Arguments
/// * `redis_pool` - Redis connection pool
/// * `prefix` - Redis key prefix (e.g., "blacklist:")
/// * `token` - The token to check
///
/// # Returns
/// Result with bool indicating if token is blacklisted
pub async fn is_token_blacklisted(
    redis_pool: &deadpool_redis::Pool,
    prefix: &str,
    token: &str,
) -> Result<bool, Box<dyn Error + Send + Sync>> {
    use deadpool_redis::redis::AsyncCommands;

    let mut conn = redis_pool.get().await?;
    let key = format!("{}{}", prefix, token);
    
    // Check if the key exists
    let exists: bool = conn.exists(&key).await?;
    
    Ok(exists)
}
