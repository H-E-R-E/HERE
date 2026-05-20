from sqlalchemy import Column, ForeignKey, Integer, Table
from app.database import Base

user_motivations = Table(
    "user_motivations",
    Base.metadata,
    Column(
        "user_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "motivation_id",
        Integer,
        ForeignKey("motivations.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

attendee_motivations = Table(
    "attendee_motivations",
    Base.metadata,
    Column(
        "attendee_id",
        Integer,
        ForeignKey("attendees.user_id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "motivation_id",
        Integer,
        ForeignKey("motivations.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

categories_join = Table(
    "categories_join",
    Base.metadata,
    Column(
        "attendee_id",
        Integer,
        ForeignKey("attendees.user_id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "category_id",
        Integer,
        ForeignKey("event_categories.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
