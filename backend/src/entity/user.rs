use super::AccountType;
use chrono::Utc;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[sea_orm::model] // This macro now reads the relation attributes
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique)]
    pub username: String,
    #[sea_orm(unique)]
    pub email: String,
    pub password: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    // The "discriminator" column
    #[sea_orm(default_value = "Attendee")]
    pub account_type: AccountType,

    pub avatar_url: Option<String>,

    #[sea_orm(has_many)]
    pub skills: HasMany<super::skills::Entity>,

    #[sea_orm(default_value = "true")]
    pub is_active: bool,

    #[sea_orm(default_expr = "Utc::now()")]
    pub created_at: DateTimeUtc,

    #[sea_orm(default_expr = "Utc::now()")]
    pub updated_at: DateTimeUtc,

    #[sea_orm(has_one)]
    pub attendee: HasOne<super::attendee::Entity>,

    #[sea_orm(has_one)]
    pub host: HasOne<super::host::Entity>,
}

// NO MORE `enum Relation` or `impl Related` blocks.
// The `#[sea_orm::model]` macro generates them.

impl ActiveModelBehavior for ActiveModel {}
