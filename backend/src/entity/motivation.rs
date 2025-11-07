use super::Motivation;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "motivations")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique)]
    pub motivation: Motivation,
}

impl ActiveModelBehavior for ActiveModel {}

impl Related<super::attendee::Entity> for Entity {
    fn to() -> RelationDef {
        super::attendee_motivations::Relation::Attendee.def()
    }

    fn via() -> Option<RelationDef> {
        Some(
            super::attendee_motivations::Relation::Motivation
                .def()
                .rev(),
        )
    }
}
