use std::error::Error;

use crate::entity::prelude::*;
use crate::schemas::user::{SignShow, SignUp};
use crate::utils::utils::{hash_password, verify_password};
use sea_orm::ExprTrait;
use sea_orm::{ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

pub async fn create_user(
    db: &DatabaseConnection,
    signup: SignUp,
) -> Result<SignShow, Box<dyn Error>> {
    let new_user = UserActiveModel {
        username: Set(signup.username.clone()),
        first_name: Set(signup.first_name.clone()),
        last_name: Set(signup.last_name.clone()),
        email: Set(signup.email.clone()),
        avatar_url: Set(signup.avatar_url.clone()),
        // Password should be hashed before storing
        password: Set(hash_password(&signup.password)),
        ..Default::default()
    };

    let res = User::insert(new_user).exec(db).await?;
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
