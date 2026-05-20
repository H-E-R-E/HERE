import datetime
from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import Skill, Motivation
from app.models.associations import user_motivations, attendee_motivations


class SkillRecord(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[Skill] = mapped_column(SQLEnum(Skill), nullable=False)
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
    user: Mapped["BaseUser"] = relationship("BaseUser", back_populates="skills")


class MotivationRecord(Base):
    __tablename__ = "motivations"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    motivation: Mapped[Motivation] = mapped_column(
        SQLEnum(Motivation), unique=True, nullable=False
    )

    # Relationships
    users: Mapped[list["BaseUser"]] = relationship(
        "BaseUser", secondary=user_motivations, back_populates="user_motivations"
    )
    attendees: Mapped[list["Attendee"]] = relationship(
        "Attendee", secondary=attendee_motivations, back_populates="motivations"
    )
