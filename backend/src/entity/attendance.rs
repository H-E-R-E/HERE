use super::AttendanceStatus;
use chrono::Utc;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "attendance")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub event_id: i32,
    pub attendee_id: i32,
    pub status: AttendanceStatus,
    #[sea_orm(default_expr = "Utc::now()")]
    pub created_at: DateTimeUtc,
    #[sea_orm(default_expr = "Utc::now()")]
    pub updated_at: DateTimeUtc,

    #[sea_orm(belongs_to, from = "event_id", to = "id")]
    pub event: HasOne<super::event::Entity>,

    #[sea_orm(belongs_to, from = "attendee_id", to = "user_id")]
    pub attendee: HasOne<super::attendee::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
