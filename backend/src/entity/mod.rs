pub mod attendance;
pub mod attendee;
pub mod attendee_motivations;
pub mod categories_join;
pub mod event;
pub mod event_categories;
pub mod host;
pub mod location;
pub mod motivation;
pub mod prelude;
pub mod skills;
pub mod types;
pub mod user;
pub mod user_motivations;

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

// --- 1. Define the shared AccountType enum ---
#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "account_type")]
pub enum AccountType {
    #[sea_orm(string_value = "Attendee")]
    Attendee,
    #[sea_orm(string_value = "Host")]
    Host,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    serde::Serialize,
    serde::Deserialize,
)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "event_type")] // Tell SeaORM its DB type
pub enum EventType {
    #[sea_orm(string_value = "Physical")]
    Physical,
    #[sea_orm(string_value = "Virtual")]
    Virtual,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    serde::Serialize,
    serde::Deserialize,
)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "event_category")]
pub enum EventCategory {
    #[sea_orm(string_value = "Conference")]
    Conference,
    #[sea_orm(string_value = "Meetup")]
    Meetup,
    #[sea_orm(string_value = "Workshop")]
    Workshop,
    #[sea_orm(string_value = "Webinar")]
    Webinar,
    #[sea_orm(string_value = "Religious")]
    Religious,
    #[sea_orm(string_value = "Social")]
    Social,
    #[sea_orm(string_value = "Business")]
    Business,
}
#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    serde::Serialize,
    serde::Deserialize,
)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "skill")]
pub enum Skill {
    #[sea_orm(string_value = "Event Planning")]
    EventPlanning,
    #[sea_orm(string_value = "Marketing")]
    Marketing,
    #[sea_orm(string_value = "Sales")]
    Sales,
    #[sea_orm(string_value = "Management")]
    Management,
    #[sea_orm(string_value = "Technical")]
    Technical,
    #[sea_orm(string_value = "Videography")]
    Videography,
    #[sea_orm(string_value = "Photography")]
    Photography,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    serde::Serialize,
    serde::Deserialize,
)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "event_status")]
pub enum EventStatus {
    #[sea_orm(string_value = "Scheduled")]
    Scheduled,
    #[sea_orm(string_value = "Ongoing")]
    Ongoing,
    #[sea_orm(string_value = "Completed")]
    Completed,
    #[sea_orm(string_value = "Cancelled")]
    Cancelled,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    serde::Serialize,
    serde::Deserialize,
)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "attendance_status")]
pub enum AttendanceStatus {
    #[sea_orm(string_value = "Registered")]
    Registered,
    #[sea_orm(string_value = "CheckedIn")]
    CheckedIn,
    #[sea_orm(string_value = "NoShow")]
    NoShow,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    serde::Serialize,
    serde::Deserialize,
)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "event_visibility")]
pub enum EventVisibility {
    #[sea_orm(string_value = "Public")]
    Public,
    #[sea_orm(string_value = "Private")]
    Private,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    serde::Serialize,
    serde::Deserialize,
)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "motivation")]
pub enum Motivation {
    #[sea_orm(string_value = "Networking")]
    Networking,
    #[sea_orm(string_value = "Learning")]
    Learning,
    #[sea_orm(string_value = "Business")]
    Business,
    #[sea_orm(string_value = "Socializing")]
    Socializing,
}
