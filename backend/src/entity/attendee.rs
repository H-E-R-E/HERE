use super::EventType;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "attendees")]
pub struct Model {
    // Primary Key AND Foreign Key
    #[sea_orm(primary_key, auto_increment = false)]
    pub user_id: i32,
    pub preferred_event_type: EventType,

    // --- NEW SYNTAX: Relation ---
    #[sea_orm(belongs_to, from = "user_id", to = "id", on_delete = "Cascade")]
    pub user: HasOne<super::user::Entity>,
    /// SECTION --- NEW SYNTAX: Relation ---
    #[sea_orm(has_many)]
    pub attendance: HasMany<super::attendance::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

impl Related<super::event_categories::Entity> for Entity {
    fn to() -> RelationDef {
        super::categories_join::Relation::EventCategory.def()
    }

    fn via() -> Option<RelationDef> {
        Some(super::categories_join::Relation::Attendee.def().rev())
    }
}

impl Related<super::motivation::Entity> for Entity {
    fn to() -> RelationDef {
        super::attendee_motivations::Relation::Motivation.def()
    }

    fn via() -> Option<RelationDef> {
        Some(super::attendee_motivations::Relation::Attendee.def().rev())
    }
}
