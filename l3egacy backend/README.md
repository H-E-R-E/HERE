# Here_Backend

A Rust-based backend application built with Actix Web, SeaORM, and support for both PostgreSQL (with PostGIS) and SQLite databases.

## Tech Stack

- **Web Framework**: Actix Web 4
- **ORM**: SeaORM 2.0.0-rc with migrations
- **Databases**: 
  - PostgreSQL with PostGIS (production)
  - SQLite (development)
- **Caching**: Redis with deadpool
- **Validation**: Validator with derive macros
- **API Documentation**: Utoipa (OpenAPI/Swagger)
- **Authentication**: bcrypt for password hashing

## Features

### Database Support
- **Dual Database Backend**: Seamlessly switch between PostgreSQL and SQLite using feature flags
- **PostGIS Integration**: Native geometry types for PostgreSQL with SRID 4326 (WGS 84)
- **Custom Types**: `PgPoint` type that works across both databases
  - PostgreSQL: Uses native PostGIS `geometry(Point, 4326)`
  - SQLite: Uses TEXT with WKT (Well-Known Text) format
- **Migrations**: Managed with SeaORM migrations

### Data Model

#### Entities
- **User**: User accounts with email, password, and profile information
- **Host**: Event hosts linked to users
- **Event**: Events with categories, locations, and attendees
- **Location**: Geographic locations with coordinates (PostGIS/WKT)
- **Attendee**: Event attendees with motivations
- **Attendance**: Join table for user-event attendance
- **Skills**: User skills
- **Categories**: Event categories
- **Motivations**: User and attendee motivations
- **Links**: Related links

#### Relationships
- Many-to-Many: Users ↔ Motivations (via `user_motivations`)
- Many-to-Many: Attendees ↔ Motivations (via `attendee_motivations`)
- Many-to-Many: Events ↔ Categories (via `categories_join`)
- One-to-Many: User → Host → Events
- One-to-Many: Event → Attendees

### Geospatial Features
Custom `PgPoint` implementation with:
- Coordinate storage (x: longitude, y: latitude)
- WKT parsing: `POINT(x y)`
- Full SeaORM trait support (ValueType, Nullable, TryGetable)
- Automatic backend switching via feature flags
- EWKB support for PostgreSQL

## Getting Started

### Prerequisites
- Rust 1.70+ (edition 2024)
- PostgreSQL with PostGIS extension (for production)
- SQLite (for development)
- Redis server

### Building

**Development (SQLite)**:
```bash
cargo build --no-default-features --features sqlx-sqlite
```

**Production (PostgreSQL)**:
```bash
cargo build
# or explicitly:
cargo build --features sqlx-postgres
```

### Running Migrations

```bash
cd migration
cargo run
```

### Environment Configuration

Create a `.env` file with:
```env
DATABASE_URL=postgres://user:password@localhost/dbname
# or for SQLite:
# DATABASE_URL=sqlite://./database.db

REDIS_URL=redis://localhost:6379
```

## Project Structure

```
src/
├── core/           # Core configurations
├── entity/         # SeaORM entities
│   ├── types.rs    # Custom types (PgPoint with feature flags)
│   └── ...         # Entity definitions
├── handlers/       # Request handlers
├── routes/         # Route definitions
├── schemas/        # Request/response schemas
├── services/       # Business logic
└── utils/          # Utilities

migration/          # Database migrations
```

## Feature Flags

The application uses Cargo features to enable database-specific functionality:

- `sqlx-postgres` (default): PostgreSQL with PostGIS support
- `sqlx-sqlite`: SQLite with text-based geometry storage

The `PgPoint` type automatically adapts based on the enabled feature, providing a unified API regardless of the underlying database.

## Development

### Running Tests
```bash
cargo test
```

### Checking Code
```bash
cargo check
```

### API Documentation
The application includes Swagger UI documentation via Utoipa, accessible when running the server.

## License

See LICENSE file for details.