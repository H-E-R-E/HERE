import datetime
from typing import Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import AccountType, SignupType, EventType
from app.models.associations import user_motivations, attendee_motivations, categories_join


class BaseUser(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    username: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    account_type: Mapped[AccountType] = mapped_column(
        SQLEnum(AccountType), nullable=False
    )
    signup_type: Mapped[SignupType] = mapped_column(
        SQLEnum(SignupType), default=SignupType.Local, nullable=False
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
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

    __mapper_args__ = {
        "polymorphic_on": account_type,
        "polymorphic_identity": "BaseUser",
    }

    # Relationships
    skills: Mapped[list["SkillRecord"]] = relationship(
        "SkillRecord", back_populates="user", cascade="all, delete-orphan"
    )
    user_motivations: Mapped[list["MotivationRecord"]] = relationship(
        "MotivationRecord", secondary=user_motivations, back_populates="users"
    )


class Attendee(BaseUser):
    __tablename__ = "attendees"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    preferred_event_type: Mapped[EventType] = mapped_column(
        SQLEnum(EventType), default=EventType.Physical, nullable=False
    )

    __mapper_args__ = {
        "polymorphic_identity": AccountType.Attendee,
    }

    # Relationships
    attendance_records: Mapped[list["Attendance"]] = relationship(
        "Attendance", back_populates="attendee", cascade="all, delete-orphan"
    )
    motivations: Mapped[list["MotivationRecord"]] = relationship(
        "MotivationRecord",
        secondary=attendee_motivations,
        back_populates="attendees",
    )
    preferred_categories: Mapped[list["EventCategoryRecord"]] = relationship(
        "EventCategoryRecord",
        secondary=categories_join,
        back_populates="attendees",
    )


class Host(BaseUser):
    __tablename__ = "hosts"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    organization_name: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    organization_website: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    events_hosted_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    __mapper_args__ = {
        "polymorphic_identity": AccountType.Host,
    }

    # Relationships
    events: Mapped[list["Event"]] = relationship(
        "Event", back_populates="host", cascade="all, delete-orphan"
    )
