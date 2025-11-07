use super::{EventCategory, EventStatus, EventType, EventVisibility};
use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, serde::Serialize, serde::Deserialize)]
#[sea_orm(table_name = "events")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub title: String,
    pub description: String,
    pub location: String,
    pub event_type: EventType,
    pub category: EventCategory,
    pub status: EventStatus,
    pub visibility: EventVisibility,
    #[sea_orm(foreign_key = "ForeignKey::hosts")]
    pub host_id: i32,
    #[sea_orm(belongs_to, from = "host_id", to = "user_id")]
    pub host: HasOne<super::host::Entity>,
    pub start_time: DateTimeUtc,
    pub end_time: DateTimeUtc,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

impl ActiveModelBehavior for ActiveModel {}
