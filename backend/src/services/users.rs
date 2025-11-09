use std::error::Error;

use crate::core::configs::AppConfig;
use crate::entity::{attendee, prelude::*, user, host, SignupType};
use crate::schemas::user::{SignShow, SignUp, UpdateProfileRequest};
use crate::utils::email::{generate_otp, send_welcome_email, send_verified_welcome_email, store_otp_in_redis};
use crate::utils::utils::{hash_password, verify_password};
use deadpool_redis::Pool as RedisPool;
use sea_orm::ExprTrait;
use sea_orm::{ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, ActiveModelTrait};
use tracing::{error, info};

async fn create_attendee_and_host_records(
    db: &DatabaseConnection,
    user_id: i32,
) -> Result<(), Box<dyn Error>> {
    let attendee = attendee::ActiveModel {
        user_id: Set(user_id),
        ..Default::default()
    };
    attendee::Entity::insert(attendee).exec(db).await?;

    let host = host::ActiveModel {
        user_id: Set(user_id),
        organization_name: Set(None),
        organization_website: Set(None),
        ..Default::default()
    };
    host::Entity::insert(host).exec(db).await?;

    Ok(())
}

pub async fn create_user(
    db: &DatabaseConnection,
    redis_pool: &RedisPool,
    config: &AppConfig,
    signup: SignUp,
) -> Result<SignShow, Box<dyn Error>> {
    // Determine if user should be auto-verified based on signup type
    let is_verified = matches!(signup.signup_type, SignupType::Google | SignupType::Facebook | SignupType::Apple);
    
    let new_user = UserActiveModel {
        username: Set(signup.username.clone()),
        first_name: Set(signup.first_name.clone()),
        last_name: Set(signup.last_name.clone()),
        email: Set(signup.email.clone()),
        avatar_url: Set(signup.avatar_url.clone()),
        signup_type: Set(signup.signup_type),
        verified: Set(is_verified),
        // Password should be hashed before storing
        password: Set(hash_password(&signup.password)),
        ..Default::default()
    };

    let res = User::insert(new_user).exec(db).await?;

    // Spawn background task to create attendee/host records and send welcome email
    let db_clone = db.clone();
    let redis_pool_clone = redis_pool.clone();
    let config_clone = config.clone();
    let user_id = res.last_insert_id;
    let email = signup.email.clone();
    let first_name = signup.first_name.clone().unwrap_or_else(|| signup.username.clone());
    let signup_type = signup.signup_type;

    tokio::spawn(async move {
        // Create attendee and host records
        if let Err(e) = create_attendee_and_host_records(&db_clone, user_id).await {
            error!("Failed to create attendee and host records for user {}: {}", user_id, e);
            return;
        }
        info!("Successfully created attendee and host records for user {}", user_id);

        // Handle email based on signup type
        match signup_type {
            SignupType::Local => {
                // Generate OTP for local signups
                let otp = generate_otp();
                
                // Store OTP in Redis
                if let Err(e) = store_otp_in_redis(
                    &redis_pool_clone,
                    &config_clone.otp_prefix,
                    &email,
                    &otp,
                    config_clone.otp_expiry_seconds,
                )
                .await
                {
                    error!("Failed to store OTP in Redis for {}: {}", email, e);
                    return;
                }
                info!("OTP stored in Redis for user {}", email);

                // Send welcome email with OTP
                if let Err(e) = send_welcome_email(&config_clone, &email, &first_name, &otp).await {
                    error!("Failed to send welcome email to {}: {}", email, e);
                    return;
                }
                info!("Welcome email with OTP sent successfully to {}", email);
            }
            SignupType::Google | SignupType::Facebook | SignupType::Apple => {
                // Send welcome email without OTP (user is already verified)
                if let Err(e) = send_verified_welcome_email(&config_clone, &email, &first_name).await {
                    error!("Failed to send verified welcome email to {}: {}", email, e);
                    return;
                }
                info!("Verified welcome email sent successfully to {}", email);
            }
        }
    });

    Ok(SignShow {
        id: res.last_insert_id,
        username: signup.username,
        first_name: signup.first_name,
        last_name: signup.last_name,
        email: signup.email,
        avatar_url: signup.avatar_url,
    })
}

pub async fn authenticate_user(
    db: &DatabaseConnection,
    identifier: &str,
    password: &str,
) -> Result<SignShow, Box<dyn Error>> {
    // Try to find user by email or username
    let user = User::find()
        .filter(
            UserColumn::Email
                .eq(identifier)
                .or(UserColumn::Username.eq(identifier)),
        )
        .one(db)
        .await?
        .ok_or("User not found")?;

    // Verify password
    if !verify_password(password, &user.password) {
        return Err("Invalid password".into());
    }

    Ok(SignShow {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        avatar_url: user.avatar_url,
    })
}

pub async fn get_user_by_id(
    db: &DatabaseConnection,
    user_id: i32,
) -> Result<SignShow, Box<dyn Error>> {
    let user = User::find_by_id(user_id)
        .one(db)
        .await?
        .ok_or("User not found")?;

    Ok(SignShow {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        avatar_url: user.avatar_url,
    })
}

pub async fn get_user_model_by_id(
    db: &DatabaseConnection,
    user_id: i32,
) -> Result<crate::entity::user::Model, Box<dyn Error>> {
    let user = User::find_by_id(user_id)
        .one(db)
        .await?
        .ok_or("User not found")?;

    Ok(user)
}

pub async fn get_user_by_email(
    db: &DatabaseConnection,
    email: &str,
) -> Result<crate::entity::user::Model, Box<dyn Error>> {
    let user = User::find()
        .filter(UserColumn::Email.eq(email))
        .one(db)
        .await?
        .ok_or("User not found")?;

    Ok(user)
}

pub async fn update_user_profile(
    db: &DatabaseConnection,
    user_id: i32,
    update_data: UpdateProfileRequest,
) -> Result<(), Box<dyn Error>> {
    // Update user basic info
    if update_data.first_name.is_some() || update_data.last_name.is_some() || update_data.avatar_url.is_some() {
        let user = User::find_by_id(user_id)
            .one(db)
            .await?
            .ok_or("User not found")?;

        let mut user_active: user::ActiveModel = user.into();
        
        if let Some(first_name) = update_data.first_name {
            user_active.first_name = Set(Some(first_name));
        }
        if let Some(last_name) = update_data.last_name {
            user_active.last_name = Set(Some(last_name));
        }
        if let Some(avatar_url) = update_data.avatar_url {
            user_active.avatar_url = Set(Some(avatar_url));
        }

        user_active.update(db).await?;
        info!("User {} basic info updated", user_id);
    }

    // Update attendee preferred event type if provided
    if let Some(preferred_event_type) = update_data.preferred_event_type {
        let attendee = attendee::Entity::find()
            .filter(attendee::Column::UserId.eq(user_id))
            .one(db)
            .await?;

        if let Some(attendee_model) = attendee {
            let mut attendee_active: attendee::ActiveModel = attendee_model.into();
            attendee_active.preferred_event_type = Set(preferred_event_type);
            attendee_active.update(db).await?;
            info!("User {} attendee preferences updated", user_id);
        }
    }

    // Update host organization info if provided
    if update_data.organization_name.is_some() || update_data.organization_website.is_some() {
        let host = host::Entity::find()
            .filter(host::Column::UserId.eq(user_id))
            .one(db)
            .await?;

        if let Some(host_model) = host {
            let mut host_active: host::ActiveModel = host_model.into();
            
            if let Some(org_name) = update_data.organization_name {
                host_active.organization_name = Set(Some(org_name));
            }
            if let Some(org_website) = update_data.organization_website {
                host_active.organization_website = Set(Some(org_website));
            }

            host_active.update(db).await?;
            info!("User {} host organization updated", user_id);
        }
    }

    Ok(())
}

pub async fn get_attendee_with_user(
    db: &DatabaseConnection,
    user_id: i32,
) -> Result<(attendee::Model, user::Model), DbErr> {
    let attendee_with_user = attendee::Entity::find()
        // 1. Correctly filters by the `user_id` foreign key column
        .filter(attendee::Column::UserId.eq(user_id))
        // 2. Correctly joins and selects both models into a tuple
        .find_also_related(user::Entity) 
        .one(db)
        .await?;

    // 3. Correctly handles the result
    if let Some((attendee, Some(user))) = attendee_with_user {
        info!("Fetched attendee: {:?}, user: {:?}", attendee, user);
        Ok((attendee, user))
    } else {
        Err(DbErr::RecordNotFound("No such attendee".into()))
    }
}

pub async fn get_host_with_user(
    db: &DatabaseConnection,
    user_id: i32,
) -> Result<(host::Model, user::Model), DbErr> {
    let host_with_user = host::Entity::find()
        // 1. Correctly filters by the `user_id` foreign key column
        .filter(host::Column::UserId.eq(user_id))
        // 2. Correctly joins and selects both models into a tuple
        .find_also_related(user::Entity) 
        .one(db)
        .await?;

    // 3. Correctly handles the result
    if let Some((host, Some(user))) = host_with_user {
        info!("Fetched host: {:?}, user: {:?}", host, user);
        Ok((host, user))
    } else {
        Err(DbErr::RecordNotFound("No such host".into()))
    }
}