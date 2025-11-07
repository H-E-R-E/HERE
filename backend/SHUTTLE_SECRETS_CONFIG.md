# AppConfig Shuttle Secrets Integration

The `AppConfig` struct now supports three flexible ways to load configuration:

## 1. From Environment Variables (Local/Docker)

```rust
let config = AppConfig::from_env()
    .expect("Failed to load configuration");
```

**Use case**: Local development with `.env` file or Docker deployments with environment variables.

## 2. From Shuttle Secrets (Shuttle Deployment)

```rust
#[shuttle_runtime::main]
async fn main(
    #[shuttle_runtime::Secrets] secrets: shuttle_runtime::SecretStore,
    #[shuttle_shared_db::Postgres] pool: PgPool,
) -> ShuttleActixWeb<impl FnOnce(&mut ServiceConfig) + Send + Clone + 'static> {
    // Convert SecretStore to HashMap
    let secrets_map: HashMap<String, String> = secrets.into_iter().collect();
    
    let config = AppConfig::from_secrets(secrets_map)
        .expect("Failed to load configuration from Shuttle secrets");
    
    // ... rest of your app setup
}
```

**Use case**: Shuttle production deployments where secrets are managed through Shuttle's secret store.

## 3. Automatic Fallback (Flexible)

```rust
#[shuttle_runtime::main]
async fn main(
    #[shuttle_runtime::Secrets] secrets: shuttle_runtime::SecretStore,
    #[shuttle_shared_db::Postgres] pool: PgPool,
) -> ShuttleActixWeb<impl FnOnce(&mut ServiceConfig) + Send + Clone + 'static> {
    let secrets_map: HashMap<String, String> = secrets.into_iter().collect();
    
    // Try Shuttle secrets first, fall back to environment variables
    let config = AppConfig::from_secrets_or_env(Some(secrets_map))
        .expect("Failed to load configuration");
    
    // ... rest of your app setup
}
```

**Use case**: Maximum flexibility - works in both local development and Shuttle deployments.

## Required Secrets

All three methods require these secrets/environment variables:

- `SECRET_KEY` - JWT signing secret
- `REDIS_URL` - Redis connection string
- `SMTP_HOST` - SMTP server hostname
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM_EMAIL` - Email sender address
- `DATABASE_URL` - Database connection string (optional with Shuttle shared DB)

## Optional Secrets (with defaults)

- `HASH_ROUNDS` - bcrypt rounds (default: 12)
- `SMTP_PORT` - SMTP port (default: 587)
- `DEBUG` - Debug mode (default: false)

## Setting Shuttle Secrets

```bash
# Set secrets via CLI
shuttle secrets set SECRET_KEY="your-secret-key-here"
shuttle secrets set REDIS_URL="redis://localhost:6379"
shuttle secrets set SMTP_HOST="smtp.example.com"
shuttle secrets set SMTP_USERNAME="user@example.com"
shuttle secrets set SMTP_PASSWORD="password"
shuttle secrets set SMTP_FROM_EMAIL="noreply@example.com"

# List secrets
shuttle secrets list

# Remove a secret
shuttle secrets remove SECRET_KEY
```

## Benefits

✅ **Flexible**: Works with environment variables, Shuttle secrets, or both  
✅ **Type-safe**: Strongly typed configuration with validation  
✅ **Reusable**: Same code works in multiple deployment scenarios  
✅ **Clear errors**: Helpful error messages for missing secrets  
✅ **Defaults**: Sensible defaults for optional configuration
