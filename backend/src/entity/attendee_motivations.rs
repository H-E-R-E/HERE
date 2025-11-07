use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "attendee_motivations")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub attendee_id: i32,
    #[sea_orm(primary_key, auto_increment = false)]
    pub motivation_id: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::attendee::Entity",
        from = "Column::AttendeeId",
        to = "super::attendee::Column::UserId",
        on_delete = "Cascade"
    )]
    Attendee,
    #[sea_orm(
        belongs_to = "super::motivation::Entity",
        from = "Column::MotivationId",
        to = "super::motivation::Column::Id",
        on_delete = "Cascade"
    )]
    Motivation,
}

impl ActiveModelBehavior for ActiveModel {}
