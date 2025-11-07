use super::EventCategory;
use chrono::Utc;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "event_categories")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique)]
    pub name: EventCategory,

    pub description: Option<String>,

    #[sea_orm(default_expr = "Utc::now()")]
    pub created_at: DateTimeUtc,

    #[sea_orm(default_expr = "Utc::now()")]
    pub updated_at: DateTimeUtc,
}

impl ActiveModelBehavior for ActiveModel {}

impl Related<super::attendee::Entity> for Entity {
    fn to() -> RelationDef {
        super::categories_join::Relation::Attendee.def()
    }

    fn via() -> Option<RelationDef> {
        Some(super::categories_join::Relation::EventCategory.def().rev())
    }
}
