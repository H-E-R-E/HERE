use super::types::PgPoint;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "locations")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: i32,
    pub name: String,
    pub coordinates: PgPoint,
    pub description: Option<String>,
}

impl ActiveModelBehavior for ActiveModel {}
