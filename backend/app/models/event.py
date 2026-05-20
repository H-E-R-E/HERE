import datetime
import json
from typing import Optional
from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, PgPoint, PgPointAdaptor
from app.models.base import EventCategory, EventType, EventStatus, EventVisibility, AttendanceStatus
from app.models.associations import categories_join


class EventCategoryRecord(Base):
    __tablename__ = "event_categories"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    name: Mapped[EventCategory] = mapped_column(
        SQLEnum(EventCategory), unique=True, nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationships
    attendees: Mapped[list["Attendee"]] = relationship(
        "Attendee",
        secondary=categories_join,
        back_populates="preferred_categories",
    )


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    coordinates: Mapped[PgPoint] = mapped_column(PgPointAdaptor, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False)
    location: Mapped[str] = mapped_column(
        String(255), nullable=False
    )  # e.g., "lat,lon" WKT/string representation
    event_type: Mapped[EventType] = mapped_column(
        SQLEnum(EventType), nullable=False
    )
    category: Mapped[EventCategory] = mapped_column(
        SQLEnum(EventCategory), nullable=False
    )
    status: Mapped[EventStatus] = mapped_column(
        SQLEnum(EventStatus), default=EventStatus.Scheduled, nullable=False
    )
    visibility: Mapped[EventVisibility] = mapped_column(
        SQLEnum(EventVisibility), default=EventVisibility.Public, nullable=False
    )
    host_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hosts.user_id", ondelete="CASCADE"), nullable=False
    )
    start_time: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False
    )
    end_time: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationships
    host: Mapped["Host"] = relationship("Host", back_populates="events")
    attendance_records: Mapped[list["Attendance"]] = relationship(
        "Attendance", back_populates="event", cascade="all, delete-orphan"
    )

    # Helper property to parse/serialize JSON metadata from event.description
    @property
    def parsed_metadata(self) -> dict:
        if "__METADATA__:" in self.description:
            try:
                parts = self.description.split("__METADATA__:")
                return json.loads(parts[1])
            except Exception:
                return {}
        return {}

    @parsed_metadata.setter
    def parsed_metadata(self, data: dict):
        clean_desc = self.description.split("__METADATA__:")[0].strip()
        self.description = f"{clean_desc}\n__METADATA__:{json.dumps(data)}"

    @property
    def clean_description(self) -> Optional[str]:
        desc = self.description.split("__METADATA__:")[0].strip()
        return desc if desc else None


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    attendee_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("attendees.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[AttendanceStatus] = mapped_column(
        SQLEnum(AttendanceStatus),
        default=AttendanceStatus.Registered,
        nullable=False,
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationships
    event: Mapped["Event"] = relationship(
        "Event", back_populates="attendance_records"
    )
    attendee: Mapped["Attendee"] = relationship(
        "Attendee", back_populates="attendance_records"
    )
