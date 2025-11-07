use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "categories_join")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub attendee_id: i32,
    #[sea_orm(primary_key, auto_increment = false)]
    pub category_id: i32,
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
        belongs_to = "super::event_categories::Entity",
        from = "Column::CategoryId",
        to = "super::event_categories::Column::Id",
        on_delete = "Cascade"
    )]
    EventCategory,
}

impl ActiveModelBehavior for ActiveModel {}
