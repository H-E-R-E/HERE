use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "hosts")]
pub struct Model {
    // Primary Key AND Foreign Key
    #[sea_orm(primary_key, auto_increment = false)]
    pub user_id: i32,

    // --- Host-specific fields ---
    pub organization_name: Option<String>,
    #[sea_orm(default_value = 0)]
    pub events_hosted_count: i32,

    // --- NEW SYNTAX: Relation ---
    #[sea_orm(belongs_to, from = "user_id", to = "id", on_delete = "Cascade")]
    pub user: HasOne<super::user::Entity>,
    #[sea_orm(has_many)]
    pub events: HasMany<super::event::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
