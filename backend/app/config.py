from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    secret_key: str = Field(validation_alias="SECRET_KEY")
    hash_rounds: int = Field(default=12, validation_alias="HASH_ROUNDS")
    redis_url: str = Field(validation_alias="REDIS_URL")
    smtp_host: str = Field(validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=587, validation_alias="SMTP_PORT")
    smtp_username: str = Field(validation_alias="SMTP_USERNAME")
    smtp_password: str = Field(validation_alias="SMTP_PASSWORD")
    smtp_from_email: str = Field(validation_alias="SMTP_FROM_EMAIL")
    database_url: str = Field(validation_alias="DATABASE_URL")
    debug: bool = Field(default=False, validation_alias="DEBUG")
    otp_prefix: str = Field(default="otp:", validation_alias="OTP_PREFIX")
    otp_expiry_seconds: int = Field(default=300, validation_alias="OTP_EXPIRY_SECONDS")
    verification_token_expiry_seconds: int = Field(
        default=600, validation_alias="VERIFICATION_TOKEN_EXPIRY_SECONDS"
    )
    jwt_expiry_seconds: int = Field(default=86400, validation_alias="JWT_EXPIRY_SECONDS")
    blacklist_token_prefix: str = Field(
        default="blacklist:", validation_alias="BLACKLIST_TOKEN_PREFIX"
    )

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = AppSettings()
