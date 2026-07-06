# HERE

HERE is an event management and attendance tracking platform designed to streamline in-person event operations with geofenced check-ins, host tools, and real-time attendee engagement.

## Overview

This repository contains a full-stack application for creating, discovering, and managing events:

- A React Native and Expo mobile app for attendees and hosts
- A FastAPI backend for authentication, event management, chat, and notifications
- PostgreSQL for persistent data
- Redis for OTP/session-style support and caching
- Docker support for local development

## What the app does

- Lets hosts create and manage physical events with location-based metadata
- Supports attendee RSVP, check-in, and attendance validation using geofencing
- Provides authentication with email OTP verification and JWT-based access
- Includes event chat and notification flows
- Supports a mobile-first experience for onboarding, event browsing, and profile management

## Core features

- User authentication and account verification
- Host and attendee roles with scoped access
- Physical event creation, update, listing, and cancellation
- Geofence-based check-in validation and attendance tracking
- Event chat with real-time WebSocket support
- Notifications for users
- Mobile UI built with Expo Router

## Tech stack

### Frontend
- React Native
- Expo
- Expo Router
- TypeScript
- React Query
- Zustand
- React Navigation

### Backend
- Python
- FastAPI
- SQLAlchemy with async support
- Pydantic and Pydantic Settings
- PostgreSQL
- Redis
- JWT and OTP-based auth

## Project structure

- frontend/: Expo application and mobile UI
- backend/: FastAPI service, SQLAlchemy models, routers, services, and tests
- backend/app/: API entrypoint, config, database setup, routers, services, schemas, and utilities
- backend/tests/: backend tests

## Prerequisites

Before running the project locally, make sure you have:

- Python 3.10+ 
- Node.js 18+
- npm or yarn
- Docker and Docker Compose (optional, but recommended)
- PostgreSQL and Redis running locally, or use Docker Compose

## Environment variables

The backend reads configuration from a .env file in the backend directory.

Example:

```env
SECRET_KEY=change-me
HASH_ROUNDS=12
REDIS_URL=redis://localhost:6379/0
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-user
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=no-reply@example.com
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/here
DEBUG=true
OTP_PREFIX=otp:
OTP_EXPIRY_SECONDS=300
VERIFICATION_TOKEN_EXPIRY_SECONDS=600
JWT_EXPIRY_SECONDS=86400
BLACKLIST_TOKEN_PREFIX=blacklist:
```

## Running the backend

From the backend directory:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at:

- http://localhost:8000
- Swagger docs: http://localhost:8000/docs

## Running the frontend

From the frontend directory:

```bash
npm install
npm start
```

Then launch the Expo app on your device or emulator.

## Running with Docker Compose

From the backend directory:

```bash
docker compose up --build
```

This starts:

- the FastAPI app on port 8000
- PostgreSQL on port 5433
- Redis on port 6379

## Running tests

Backend tests:

```bash
cd backend
pytest
```

## API notes

The backend exposes routes for:

- authentication and account verification
- event creation and management
- RSVP and attendance flows
- chat and notifications

## Notes

The current backend implementation is structured around modular routers and services, with the main application entry point in backend/app/main.py and the mobile client rooted in frontend/.
