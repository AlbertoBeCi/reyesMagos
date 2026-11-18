from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field as PydanticField, field_validator
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Family(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=120)
    slug: str = Field(index=True, unique=True, max_length=80)
    admin_secret: str = Field(max_length=120)


class Member(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    family_id: int = Field(foreign_key="family.id", index=True)
    name: str = Field(max_length=80)
    avatar_emoji: str = Field(default="🎁", max_length=16)
    pin_hash: Optional[str] = Field(default=None, max_length=255)


class WishItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    family_id: int = Field(foreign_key="family.id", index=True)
    owner_id: int = Field(foreign_key="member.id", index=True)
    title: str = Field(max_length=200)
    url: Optional[str] = Field(default=None, max_length=500)
    price_approx: Optional[str] = Field(default=None, max_length=40)
    notes: Optional[str] = Field(default=None, max_length=500)
    purchased_by_id: Optional[int] = Field(default=None, foreign_key="member.id")
    created_at: datetime = Field(default_factory=utc_now)


# --- Schemas ---


class MemberSetupInput(BaseModel):
    name: str = PydanticField(min_length=1, max_length=80)
    avatar_emoji: str = PydanticField(default="🎁", min_length=1, max_length=16)


class FamilySetupRequest(BaseModel):
    name: str = PydanticField(min_length=1, max_length=120)
    slug: str = PydanticField(min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")
    admin_secret: str = PydanticField(min_length=4, max_length=120)
    members: list[MemberSetupInput] = PydanticField(min_length=1)


class FamilyInfo(BaseModel):
    id: int
    name: str
    slug: str


class MemberPublic(BaseModel):
    id: int
    name: str
    avatar_emoji: str
    has_pin: bool


class FamilySetupResponse(BaseModel):
    family: FamilyInfo
    members: list[MemberPublic]


class AuthRequest(BaseModel):
    member_id: int
    pin: str

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 4:
            raise ValueError("El PIN debe tener exactamente 4 dígitos numéricos.")
        return v


class AuthMemberInfo(BaseModel):
    id: int
    name: str
    avatar_emoji: str
    family_slug: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    member: AuthMemberInfo


class WishCreate(BaseModel):
    title: str = PydanticField(min_length=1, max_length=200)
    url: Optional[str] = PydanticField(default=None, max_length=500)
    price_approx: Optional[str] = PydanticField(default=None, max_length=40)
    notes: Optional[str] = PydanticField(default=None, max_length=500)


class WishUpdate(BaseModel):
    title: Optional[str] = PydanticField(default=None, min_length=1, max_length=200)
    url: Optional[str] = PydanticField(default=None, max_length=500)
    price_approx: Optional[str] = PydanticField(default=None, max_length=40)
    notes: Optional[str] = PydanticField(default=None, max_length=500)


class WishOut(BaseModel):
    id: int
    owner_id: int
    title: str
    url: Optional[str] = None
    price_approx: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    is_purchased: bool
    purchased_by_id: Optional[int] = None
    purchased_by_name: Optional[str] = None


class BoardColumnOut(BaseModel):
    member_id: int
    name: str
    avatar_emoji: str
    is_me: bool
    wishes: list[WishOut]


class BoardResponse(BaseModel):
    family: FamilyInfo
    current_member_id: int
    columns: list[BoardColumnOut]
