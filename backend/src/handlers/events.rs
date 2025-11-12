use crate::entity::prelude::*;
use crate::schemas::event::{EventCategoriesResponse, EventCategoryResponse};
use crate::services::events::get_event_categories;
use crate::utils::auth_extractor::VerifiedUser;
use actix_web::{get, web::{Data, Json}, Result};
use sea_orm::DatabaseConnection;