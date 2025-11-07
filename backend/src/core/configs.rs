use config::{Config, ConfigError, Environment, File, FileFormat};
use deadpool_redis::Pool as RedisPool;
use sea_orm::DatabaseConnection;
use serde::Deserialize;
use std::collections::HashMap;
use tracing::info;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub secret_key: String,
    pub hash_rounds: u32,
    pub redis_url: String,
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_username: String,
    pub smtp_password: String,
    pub smtp_from_email: String,
    pub database_url: String,
    pub debug: bool,
}

impl AppConfig {
    /// Create AppConfig from environment variables (for local development and Docker)
    pub fn from_env() -> Result<Self, ConfigError> {
        // 1. Load .env file (if it exists) into the environment
        dotenv::dotenv().ok();
        info!("Attempting to load configuration...");

        // 2. Build the config
        let builder = Config::builder()
            // 3. Add `Secrets.toml` as a low-priority source.
            //    This is for `cargo shuttle run` (local dev).
            //    We make it `required(false)` so the app doesn't
            //    crash if it's not present (e.g., in Docker).
            .add_source(File::new("Secrets.toml", FileFormat::Toml).required(false))
            // 4. Add environment variables as the highest-priority source.
            //    This reads from the real environment, which includes
            //    vars from:
            //    - `dotenv()` (from step 1)
            //    - Docker (`--env-file` or `-e`)
            //    - Shuttle production (which injects secrets as env vars)
            .add_source(Environment::default());

        // 5. Build and deserialize
        builder.build()?.try_deserialize()
    }

    /// Create AppConfig from Shuttle secrets (for Shuttle deployment)
    ///
    /// This method accepts a HashMap of secrets from Shuttle and uses them
    /// to populate the configuration fields. This is more flexible than
    /// relying on environment variables alone.
    ///
    /// # Example
    /// ```rust
    /// #[shuttle_runtime::main]
    /// async fn main(
    ///     #[shuttle_runtime::Secrets] secrets: shuttle_runtime::SecretStore,
    /// ) -> ShuttleActixWeb<...> {
    ///     let config = AppConfig::from_secrets(secrets.into_iter().collect())
    ///         .expect("Failed to load configuration");
    ///     // ...
    /// }
    /// ```
    pub fn from_secrets(secrets: HashMap<String, String>) -> Result<Self, ConfigError> {
        info!("Loading configuration from Shuttle secrets...");

        // Helper to get required secret
        let get_secret = |key: &str| -> Result<String, ConfigError> {
            secrets
                .get(key)
                .cloned()
                .ok_or_else(|| ConfigError::Message(format!("Missing required secret: {}", key)))
        };

        // Helper to parse numeric values
        let parse_secret = |key: &str, default: u32| -> u32 {
            secrets
                .get(key)
                .and_then(|v| v.parse().ok())
                .unwrap_or(default)
        };

        // Helper to parse boolean values
        let parse_bool = |key: &str, default: bool| -> bool {
            secrets
                .get(key)
                .and_then(|v| v.parse().ok())
                .unwrap_or(default)
        };

        Ok(Self {
            secret_key: get_secret("SECRET_KEY")?,
            hash_rounds: parse_secret("HASH_ROUNDS", 12),
            redis_url: get_secret("REDIS_URL")?,
            smtp_host: get_secret("SMTP_HOST")?,
            smtp_port: secrets
                .get("SMTP_PORT")
                .and_then(|v| v.parse().ok())
                .unwrap_or(587),
            smtp_username: get_secret("SMTP_USERNAME")?,
            smtp_password: get_secret("SMTP_PASSWORD")?,
            smtp_from_email: get_secret("SMTP_FROM_EMAIL")?,
            database_url: get_secret("DATABASE_URL")?,
            debug: parse_bool("DEBUG", false),
        })
    }

    /// Create AppConfig with fallback: try Shuttle secrets first, then environment
    ///
    /// This is useful for flexible deployment scenarios where you might use
    /// either Shuttle secrets or environment variables.
    pub fn from_secrets_or_env(
        secrets: Option<HashMap<String, String>>,
    ) -> Result<Self, ConfigError> {
        match secrets {
            Some(secrets) if !secrets.is_empty() => {
                info!("Using Shuttle secrets for configuration");
                Self::from_secrets(secrets)
            }
            _ => {
                info!("Using environment variables for configuration");
                Self::from_env()
            }
        }
    }
}

#[derive(Clone, Debug)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub redis_pool: RedisPool,
    pub config: AppConfig,
}
