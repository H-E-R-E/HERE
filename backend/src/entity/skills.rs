use super::Skill;
use chrono::Utc;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "skills")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub user_id: i32,
    pub name: Skill,
    #[sea_orm(default_expr = "Utc::now()")]
    pub created_at: DateTimeUtc,
    #[sea_orm(default_expr = "Utc::now()")]
    pub updated_at: DateTimeUtc,

    #[sea_orm(belongs_to, from = "user_id", to = "id")]
    pub user: HasOne<super::user::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
