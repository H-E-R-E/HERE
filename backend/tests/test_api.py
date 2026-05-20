import datetime
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import AsyncMock, patch

from app.main import app
from app.database import Base, get_db
from app.redis import get_redis
from app.models import AccountType, AttendanceStatus, EventCategory, EventVisibility, BaseUser, Attendee, Host, Event, Attendance
from app.schemas import AttendanceProfile
from app.utils.auth import hash_password, create_jwt

# In-memory SQLite for testing async DB engine
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="function", autouse=True)
async def setup_db():
    """Create all tables before each test and drop them afterwards."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncSession:
    """Fixture to provide a clean database session."""
    async with TestingSessionLocal() as session:
        yield session


@pytest.fixture
def mock_redis():
    """Mock Redis client to isolate external Redis calls."""
    client = AsyncMock()
    # Mock default behavior for OTP verification
    client.get.return_value = b"123456"
    client.exists.return_value = 0
    return client


@pytest.fixture
async def client(db_session, mock_redis) -> AsyncClient:
    """HTTP Client that overrides FastAPI dependencies for testing."""
    # Override database dependency
    async def override_get_db():
        yield db_session

    # Override redis dependency
    async def override_get_redis():
        yield mock_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis

    # Use ASGITransport to test the FastAPI app directly
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# --- 1. Basic Health Endpoint ---
@pytest.mark.anyio
async def test_health_check(client: AsyncClient):
    response = await client.get("/users/health")
    assert response.status_code == 200
    assert response.json() == "OK"


# --- 2. User Authentication and Signups ---
@pytest.mark.anyio
async def test_user_signup_and_conflicts(client: AsyncClient, db_session: AsyncSession):
    # Test valid signup
    payload = {
        "username": "tester",
        "email": "tester@example.com",
        "password": "securepassword123",
        "first_name": "Test",
        "last_name": "User",
        "signup_type": "Local",
    }
    response = await client.post("/users/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "tester"
    assert data["email"] == "tester@example.com"
    assert "id" in data

    # Verify polymorphics records are created in DB
    user_id = data["id"]
    db_user = await db_session.get(BaseUser, user_id)
    assert db_user is not None
    assert db_user.account_type == AccountType.Attendee

    att_stmt = select(Attendee.__table__.c.user_id).filter(Attendee.__table__.c.user_id == user_id)
    att_res = await db_session.execute(att_stmt)
    attendee_id = att_res.scalars().first()
    assert attendee_id is not None

    host_stmt = select(Host.__table__.c.user_id).filter(Host.__table__.c.user_id == user_id)
    host_res = await db_session.execute(host_stmt)
    host_id = host_res.scalars().first()
    assert host_id is not None

    # Test conflict on duplicate username
    payload2 = {
        "username": "tester",
        "email": "another@example.com",
        "password": "password456",
        "signup_type": "Local",
    }
    response = await client.post("/users/signup", json=payload2)
    assert response.status_code == 409
    assert "username" in response.json()["detail"].lower()


@pytest.mark.anyio
async def test_user_login(client: AsyncClient, db_session: AsyncSession):
    # Setup test user directly in DB
    hashed = hash_password("testpwd123")
    user = Host(
        username="logintester",
        email="logintester@example.com",
        password=hashed,
        account_type=AccountType.Host,
        verified=True,
        organization_name="Test Org",
    )
    db_session.add(user)
    await db_session.commit()

    # Attempt login
    login_payload = {
        "identifier": "logintester@example.com",
        "password": "testpwd123",
    }
    response = await client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["token_type"] == "Bearer"
    assert data["account_type"] == "Host"


@pytest.mark.anyio
async def test_otp_verification_flow(client: AsyncClient, db_session: AsyncSession, mock_redis):
    # Setup user
    hashed = hash_password("somepassword")
    user = Attendee(
        username="otptester",
        email="otp@example.com",
        password=hashed,
        account_type=AccountType.Attendee,
        verified=False,
    )
    db_session.add(user)
    await db_session.commit()

    # Mock Redis return value for OTP check
    mock_redis.get.return_value = b"999999"

    # POST verify OTP
    otp_payload = {"email": "otp@example.com", "otp": "999999"}
    response = await client.post("/auth/verify-otp", json=otp_payload)
    assert response.status_code == 200
    otp_token = response.json()["token"]
    assert otp_token is not None

    # Use issued OTP-scoped token to verify account
    headers = {"Authorization": f"Bearer {otp_token}"}
    response = await client.post("/auth/verify-account", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Check database verified status
    await db_session.refresh(user)
    assert user.verified is True


# --- 3. Events, Geofences, and RSVP Registration ---
@pytest.mark.anyio
async def test_create_and_rsvp_geofenced_event(client: AsyncClient, db_session: AsyncSession):
    # 1. Create a host user and generate a Host JWT
    hashed = hash_password("hostpassword")
    host_user = Host(
        username="eventhost",
        email="host@example.com",
        password=hashed,
        account_type=AccountType.Host,
        verified=True,
        organization_name="Awesome Inc.",
    )
    db_session.add(host_user)
    await db_session.commit()

    host_token = create_jwt(host_user.id, "host", 3600)
    host_headers = {"Authorization": f"Bearer {host_token}"}

    # 2. Create physical geofenced event
    event_payload = {
        "name": "Local Meetup",
        "description": "Fun local event",
        "category": "Meetup",
        "visibility": "Public",
        "start_time": (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).isoformat(),
        "end_time": (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).isoformat(),
        "latitude": 37.7749,
        "longitude": -122.4194,
        "geofence_radius": 150.0,
        "attendance_profile": "standard",
    }
    response = await client.post("/api/events/physical", json=event_payload, headers=host_headers)
    assert response.status_code == 201
    event_data = response.json()
    assert event_data["name"] == "Local Meetup"
    assert event_data["latitude"] == 37.7749
    event_id = event_data["id"]

    # 3. Create an attendee and generate an Attendee JWT
    attendee_user = Attendee(
        username="eventattendee",
        email="attendee@example.com",
        password=hashed,
        account_type=AccountType.Attendee,
        verified=True,
    )
    db_session.add(attendee_user)
    await db_session.commit()

    attendee_token = create_jwt(attendee_user.id, "access", 3600)
    attendee_headers = {"Authorization": f"Bearer {attendee_token}"}

    # 4. Attendee RSVPs for the event
    response = await client.post(f"/api/events/physical/{event_id}/rsvp", headers=attendee_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "Registered"

    # Manually warp time of the event to check-in start so timing is satisfied
    db_event = await db_session.get(Event, event_id)
    db_event.start_time = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    await db_session.commit()

    # 5. Attendee attempts checking in from too far away
    checkin_payload_far = {
        "verify_location": True,
        "latitude": 37.9,  # Far away from 37.7749
        "longitude": -122.4,
    }
    response = await client.post(
        f"/api/events/physical/{event_id}/attendance",
        json=checkin_payload_far,
        headers=attendee_headers,
    )
    assert response.status_code == 400
    assert "too far" in response.json()["detail"].lower()

    # 6. Attendee checks in from within geofence range
    checkin_payload_close = {
        "verify_location": True,
        "latitude": 37.7749,
        "longitude": -122.4194,
    }
    response = await client.post(
        f"/api/events/physical/{event_id}/attendance",
        json=checkin_payload_close,
        headers=attendee_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CheckedIn"
    assert response.json()["location_verified"] is True


@pytest.mark.anyio
async def test_get_user_me(client: AsyncClient, db_session: AsyncSession):
    # Create Attendee user
    hashed = hash_password("mepassword")
    user = Attendee(
        username="me_user",
        email="me@example.com",
        password=hashed,
        account_type=AccountType.Attendee,
        verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    token = create_jwt(user.id, "access", 3600)
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "me_user"
    assert data["email"] == "me@example.com"
    assert data["account_type"] == AccountType.Attendee.value


@pytest.mark.anyio
async def test_update_user_profile(client: AsyncClient, db_session: AsyncSession):
    # Create Attendee user
    hashed = hash_password("updatepassword")
    user = Attendee(
        username="update_user",
        email="update@example.com",
        password=hashed,
        account_type=AccountType.Attendee,
        verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    token = create_jwt(user.id, "access", 3600)
    headers = {"Authorization": f"Bearer {token}"}

    update_payload = {
        "first_name": "Updated",
        "last_name": "Name",
    }
    response = await client.put("/users/profile", json=update_payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify changes
    response = await client.get("/users/me", headers=headers)
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "Name"


@pytest.mark.anyio
async def test_delete_user_account(client: AsyncClient, db_session: AsyncSession, mock_redis: AsyncMock):
    # Create Attendee user
    hashed = hash_password("deletepassword")
    user = Attendee(
        username="delete_user",
        email="delete@example.com",
        password=hashed,
        account_type=AccountType.Attendee,
        verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    token = create_jwt(user.id, "access", 3600)
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.delete("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Ensure token is blacklisted in mock_redis
    mock_redis.setex.assert_called_once()
    
    # Check DB to ensure user is inactive
    db_user = await db_session.get(BaseUser, user.id)
    assert db_user.is_active is False

