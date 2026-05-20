import enum
from sqlalchemy.orm import declarative_base

# The base class is already defined in app.database but we can re-export or define Enums here.
# Actually, Base is defined in app.database.
# Let's put just the Enums here to avoid circular imports.

class AccountType(str, enum.Enum):
    Attendee = "Attendee"
    Host = "Host"


class SignupType(str, enum.Enum):
    Local = "Local"
    Google = "Google"
    Facebook = "Facebook"
    Apple = "Apple"


class EventType(str, enum.Enum):
    Physical = "Physical"
    Virtual = "Virtual"


class EventCategory(str, enum.Enum):
    Conference = "Conference"
    Meetup = "Meetup"
    Workshop = "Workshop"
    Webinar = "Webinar"
    Religious = "Religious"
    Social = "Social"
    Business = "Business"


class Skill(str, enum.Enum):
    EventPlanning = "Event Planning"
    Marketing = "Marketing"
    Sales = "Sales"
    Management = "Management"
    Technical = "Technical"
    Videography = "Videography"
    Photography = "Photography"


class EventStatus(str, enum.Enum):
    Scheduled = "Scheduled"
    Ongoing = "Ongoing"
    Completed = "Completed"
    Cancelled = "Cancelled"


class AttendanceStatus(str, enum.Enum):
    Registered = "Registered"
    CheckedIn = "CheckedIn"
    NoShow = "NoShow"


class EventVisibility(str, enum.Enum):
    Public = "Public"
    Private = "Private"


class Motivation(str, enum.Enum):
    Networking = "Networking"
    Learning = "Learning"
    Business = "Business"
    Socializing = "Socializing"


class TokenScope(str, enum.Enum):
    Attendee = "access"
    Otp = "otp"
    Host = "host"
