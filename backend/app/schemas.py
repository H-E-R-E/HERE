import datetime
import enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models import (
    AttendanceStatus,
    EventCategory,
    EventStatus,
    EventType,
    EventVisibility,
    Motivation,
    SignupType,
    Skill,
    AccountType,
)


# --- 1. Enums and Config Presets ---
class AttendanceProfile(str, enum.Enum):
    Quick = "quick"
    Standard = "standard"
    Extended = "extended"
    Unlimited = "unlimited"

    def duration_minutes(self) -> Optional[int]:
        if self == AttendanceProfile.Quick:
            return 15
        elif self == AttendanceProfile.Standard:
            return 30
        elif self == AttendanceProfile.Extended:
            return 60
        return None


class RecurrenceFrequency(str, enum.Enum):
    Daily = "daily"
    Weekly = "weekly"
    Monthly = "monthly"
    Quarterly = "quarterly"


class DayOfWeek(str, enum.Enum):
    Mon = "mon"
    Tue = "tue"
    Wed = "wed"
    Thu = "thu"
    Fri = "fri"
    Sat = "sat"
    Sun = "sun"


# --- 2. Recurrence and Location Entities ---
class RecurrenceRule(BaseModel):
    frequency: RecurrenceFrequency
    interval: Optional[int] = Field(default=None, ge=1)
    days_of_week: Optional[list[DayOfWeek]] = None
    end_date: Optional[datetime.datetime] = None
    count: Optional[int] = Field(default=None, ge=1)


# --- 3. BaseUser & Profile Schemas ---
class SignUp(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    signup_type: SignupType = SignupType.Local
    avatar_url: Optional[str] = Field(default=None, max_length=255)


class SignShow(BaseModel):
    id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    avatar_url: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    avatar_url: Optional[str] = Field(default=None, max_length=255)
    preferred_event_type: Optional[EventType] = None
    organization_name: Optional[str] = Field(default=None, max_length=255)
    organization_website: Optional[str] = Field(default=None, max_length=255)


class UpdateProfileResponse(BaseModel):
    success: bool
    message: str


# --- 4. Auth & Session Schemas ---
class LoginRequest(BaseModel):
    identifier: str = Field(
        min_length=3,
        description="Username or Email address of user",
    )
    password: str = Field(min_length=6)


class LoginResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    expires_in: int
    account_type: str


class UserMeResponse(BaseModel):
    id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    account_type: str
    verified: bool
    skills: list[Skill]
    preferred_categories: list[EventCategory]
    motivations: list[Motivation]
    organization_name: Optional[str] = None
    organization_website: Optional[str] = None
    preferred_event_type: Optional[EventType] = None


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class VerifyOtpResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    message: str


class VerifyAccountResponse(BaseModel):
    success: bool
    message: str
    token: str
    token_type: str = "Bearer"

class LogoutResponse(BaseModel):
    success: bool
    message: str


class ResendOtpRequest(BaseModel):
    email: EmailStr


class ResendOtpResponse(BaseModel):
    success: bool
    message: str


class ActivateAccountResponse(BaseModel):
    success: bool
    message: str


class DeleteAccountResponse(BaseModel):
    success: bool
    message: str


class SwitchUserScopeRequest(BaseModel):
    target_scope: Optional[str] = None


class SwitchUserScopeResponse(BaseModel):
    new_access_token: str
    new_scope: str
    message: str


# --- 5. Event Schemas ---
class CreatePhysicalEventRequest(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: EventCategory
    visibility: EventVisibility
    start_time: datetime.datetime
    end_time: datetime.datetime
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    geofence_radius: Optional[float] = Field(default=100.0, ge=10.0, le=10000.0)
    attendance_profile: AttendanceProfile
    recurrence: Optional[RecurrenceRule] = None


class UpdatePhysicalEventRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: Optional[EventCategory] = None
    visibility: Optional[EventVisibility] = None
    start_time: Optional[datetime.datetime] = None
    end_time: Optional[datetime.datetime] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    geofence_radius: Optional[float] = Field(
        default=None, ge=10.0, le=10000.0
    )
    attendance_profile: Optional[AttendanceProfile] = None
    recurrence: Optional[RecurrenceRule] = None


class RsvpEventRequest(BaseModel):
    note: Optional[str] = None


class MarkAttendanceRequest(BaseModel):
    verify_location: bool
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)


class PhysicalEventResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category: EventCategory
    status: EventStatus
    visibility: EventVisibility
    host_id: int
    host_name: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    latitude: float
    longitude: float
    geofence_radius: Optional[float] = None
    attendance_profile: AttendanceProfile
    attendance_window_minutes: Optional[int] = None
    rsvp_count: int
    checked_in_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime


class PhysicalEventsListResponse(BaseModel):
    events: list[PhysicalEventResponse]
    total: int


class RsvpResponse(BaseModel):
    event_id: int
    attendee_id: int
    status: AttendanceStatus
    message: str


class RsvpStatusResponse(BaseModel):
    event_id: int
    attendee_id: int
    rsvp_exists: bool
    status: Optional[AttendanceStatus] = None



class AttendanceResponse(BaseModel):
    id: int
    event_id: int
    attendee_id: int
    status: AttendanceStatus
    checked_in_at: Optional[datetime.datetime] = None
    location_verified: bool
    is_late: bool
    message: str


class EventAttendeeDetails(BaseModel):
    attendee_id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    status: AttendanceStatus
    rsvp_time: datetime.datetime
    check_in_time: Optional[datetime.datetime] = None
    is_late: bool


class EventAttendanceSummary(BaseModel):
    event_id: int
    total_rsvp: int
    total_checked_in: int
    total_no_show: int
    total_late: int
    attendees: list[EventAttendeeDetails]


class CancelEventRequest(BaseModel):
    reason: Optional[str] = None


class CancelEventResponse(BaseModel):
    event_id: int
    status: EventStatus
    message: str


# --- 6. Chat Schemas ---
class SendChatMessageRequest(BaseModel):
    content: str = Field(min_length=1)

class ChatMessageResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    username: str
    content: str
    created_at: datetime.datetime


# --- 7. Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime.datetime
    event_id: Optional[int] = None

class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int
