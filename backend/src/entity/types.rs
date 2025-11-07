// PostgreSQL-specific types (PostGIS geometry)
#[cfg(feature = "sqlx-postgres")]
mod postgres_types {
    use sea_orm::sea_query::{ArrayType, ColumnType as SeaColumnType, ValueType, ValueTypeErr};
    use sea_orm::{QueryResult, TryGetError, TryGetable, Value};
    use serde::{Deserialize, Serialize};

    // Wrapper for PostGIS Point type
    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    pub struct PgPoint {
        pub x: f64,
        pub y: f64,
    }

    impl PgPoint {
        pub fn new(x: f64, y: f64) -> Self {
            Self { x, y }
        }
    }

    // Convert from sqlx PgPoint to our wrapper
    impl From<sea_orm::sqlx::postgres::types::PgPoint> for PgPoint {
        fn from(point: sea_orm::sqlx::postgres::types::PgPoint) -> Self {
            Self {
                x: point.x,
                y: point.y,
            }
        }
    }

    // Convert from our wrapper to sqlx PgPoint
    impl From<PgPoint> for sea_orm::sqlx::postgres::types::PgPoint {
        fn from(point: PgPoint) -> Self {
            sea_orm::sqlx::postgres::types::PgPoint {
                x: point.x,
                y: point.y,
            }
        }
    }

    // Implement From<PgPoint> for Value - this is required for SeaORM
    impl From<PgPoint> for Value {
        fn from(point: PgPoint) -> Self {
            // Convert to WKT format: "POINT(x y)"
            let wkt = format!("POINT({} {})", point.x, point.y);
            Value::String(Some(wkt))
        }
    }

    // Implement TryGetable to retrieve from database
    impl TryGetable for PgPoint {
        fn try_get_by<I: sea_orm::ColIdx>(
            res: &QueryResult,
            index: I,
        ) -> Result<Self, TryGetError> {
            // Try getting as a string (WKT format) or parse from other formats
            match res.try_get_by::<Option<String>, I>(index.clone()) {
                Ok(Some(s)) => {
                    // Parse WKT format: "POINT(x y)"
                    let s = s.trim();
                    if s.starts_with("POINT(") && s.ends_with(")") {
                        let coords = &s[6..s.len() - 1];
                        let parts: Vec<&str> = coords.split_whitespace().collect();
                        if parts.len() == 2 {
                            if let (Ok(x), Ok(y)) = (parts[0].parse(), parts[1].parse()) {
                                return Ok(PgPoint { x, y });
                            }
                        }
                    }
                    Err(TryGetError::Null(format!("Invalid POINT format: {}", s)))
                }
                Ok(None) => Err(TryGetError::Null(format!("NULL value for PgPoint"))),
                Err(e) => Err(TryGetError::DbErr(e)),
            }
        }
    }

    // Implement ValueType trait
    impl ValueType for PgPoint {
        fn try_from(v: Value) -> Result<Self, ValueTypeErr> {
            match v {
                Value::String(Some(s)) => {
                    // Parse WKT format: "POINT(x y)"
                    let s = s.trim();
                    if s.starts_with("POINT(") && s.ends_with(")") {
                        let coords = &s[6..s.len() - 1];
                        let parts: Vec<&str> = coords.split_whitespace().collect();
                        if parts.len() == 2 {
                            if let (Ok(x), Ok(y)) = (parts[0].parse(), parts[1].parse()) {
                                return Ok(PgPoint { x, y });
                            }
                        }
                    }
                    Err(ValueTypeErr)
                }
                _ => Err(ValueTypeErr),
            }
        }

        fn type_name() -> String {
            "PgPoint".to_string()
        }

        fn array_type() -> ArrayType {
            ArrayType::String
        }

        fn column_type() -> SeaColumnType {
            SeaColumnType::Custom("geometry(Point, 4326)".to_string().into())
        }
    }

    // Implement Nullable trait
    impl sea_orm::sea_query::Nullable for PgPoint {
        fn null() -> Value {
            Value::String(None)
        }
    }
}

// SQLite-specific types (simple text representation)
#[cfg(all(feature = "sqlx-sqlite", not(feature = "sqlx-postgres")))]
mod sqlite_types {
    use sea_orm::sea_query::{
        ArrayType, ColumnType as SeaColumnType, StringLen, ValueType, ValueTypeErr,
    };
    use sea_orm::{QueryResult, TryGetError, TryGetable, Value};
    use serde::{Deserialize, Serialize};

    // Simple point representation for SQLite
    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    pub struct PgPoint {
        pub x: f64,
        pub y: f64,
    }

    impl PgPoint {
        pub fn new(x: f64, y: f64) -> Self {
            Self { x, y }
        }
    }

    // Implement From<PgPoint> for Value - stores as WKT text in SQLite
    impl From<PgPoint> for Value {
        fn from(point: PgPoint) -> Self {
            let wkt = format!("POINT({} {})", point.x, point.y);
            Value::String(Some(wkt))
        }
    }

    // Implement TryGetable to retrieve from database
    impl TryGetable for PgPoint {
        fn try_get_by<I: sea_orm::ColIdx>(
            res: &QueryResult,
            index: I,
        ) -> Result<Self, TryGetError> {
            match res.try_get_by::<Option<String>, I>(index.clone()) {
                Ok(Some(s)) => {
                    // Parse WKT format: "POINT(x y)"
                    let s = s.trim();
                    if s.starts_with("POINT(") && s.ends_with(")") {
                        let coords = &s[6..s.len() - 1];
                        let parts: Vec<&str> = coords.split_whitespace().collect();
                        if parts.len() == 2 {
                            if let (Ok(x), Ok(y)) = (parts[0].parse(), parts[1].parse()) {
                                return Ok(PgPoint { x, y });
                            }
                        }
                    }
                    Err(TryGetError::Null(format!("Invalid POINT format: {}", s)))
                }
                Ok(None) => Err(TryGetError::Null(format!("NULL value for PgPoint"))),
                Err(e) => Err(TryGetError::DbErr(e)),
            }
        }
    }

    // Implement ValueType trait
    impl ValueType for PgPoint {
        fn try_from(v: Value) -> Result<Self, ValueTypeErr> {
            match v {
                Value::String(Some(s)) => {
                    let s = s.trim();
                    if s.starts_with("POINT(") && s.ends_with(")") {
                        let coords = &s[6..s.len() - 1];
                        let parts: Vec<&str> = coords.split_whitespace().collect();
                        if parts.len() == 2 {
                            if let (Ok(x), Ok(y)) = (parts[0].parse(), parts[1].parse()) {
                                return Ok(PgPoint { x, y });
                            }
                        }
                    }
                    Err(ValueTypeErr)
                }
                _ => Err(ValueTypeErr),
            }
        }

        fn type_name() -> String {
            "PgPoint".to_string()
        }

        fn array_type() -> ArrayType {
            ArrayType::String
        }

        fn column_type() -> SeaColumnType {
            // SQLite stores as TEXT
            SeaColumnType::String(StringLen::None)
        }
    }

    // Implement Nullable trait
    impl sea_orm::sea_query::Nullable for PgPoint {
        fn null() -> Value {
            Value::String(None)
        }
    }
}

// Re-export the appropriate type based on features
#[cfg(feature = "sqlx-postgres")]
pub use postgres_types::PgPoint;

#[cfg(all(feature = "sqlx-sqlite", not(feature = "sqlx-postgres")))]
pub use sqlite_types::PgPoint;
