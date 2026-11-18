import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.database import create_db_and_tables, get_session
from app.models import (
    AuthMemberInfo,
    AuthRequest,
    AuthResponse,
    BoardColumnOut,
    BoardResponse,
    Family,
    FamilyInfo,
    FamilySetupRequest,
    FamilySetupResponse,
    Member,
    MemberPublic,
    WishCreate,
    WishItem,
    WishOut,
    WishUpdate,
)
from app.security import (
    create_access_token,
    get_current_member,
    hash_pin,
    verify_pin,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Reyes Magos Kanban Board API",
    version="0.1.0",
    lifespan=lifespan,
)

raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
cors_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_family_by_slug(slug: str, session: Session) -> Family:
    family = session.exec(select(Family).where(Family.slug == slug)).first()
    if family is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Familia no encontrada.",
        )
    return family


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/families/setup", response_model=FamilySetupResponse, status_code=status.HTTP_201_CREATED)
def setup_family(
    payload: FamilySetupRequest,
    session: Session = Depends(get_session),
) -> FamilySetupResponse:
    existing = session.exec(select(Family).where(Family.slug == payload.slug)).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una familia con ese slug.",
        )

    family = Family(
        name=payload.name.strip(),
        slug=payload.slug.strip(),
        admin_secret=payload.admin_secret,
    )
    session.add(family)
    session.flush()

    created_members: list[Member] = []
    for item in payload.members:
        member = Member(
            family_id=family.id,
            name=item.name.strip(),
            avatar_emoji=item.avatar_emoji.strip() or "🎁",
        )
        session.add(member)
        created_members.append(member)

    session.commit()
    for m in created_members:
        session.refresh(m)

    return FamilySetupResponse(
        family=FamilyInfo(id=family.id, name=family.name, slug=family.slug),
        members=[
            MemberPublic(
                id=m.id,
                name=m.name,
                avatar_emoji=m.avatar_emoji,
                has_pin=m.pin_hash is not None,
            )
            for m in created_members
        ],
    )


@app.get("/api/families/{slug}/members", response_model=list[MemberPublic])
def list_family_members(
    slug: str,
    session: Session = Depends(get_session),
) -> list[MemberPublic]:
    family = _get_family_by_slug(slug, session)
    members = session.exec(
        select(Member).where(Member.family_id == family.id).order_by(Member.id)
    ).all()
    return [
        MemberPublic(
            id=m.id,
            name=m.name,
            avatar_emoji=m.avatar_emoji,
            has_pin=m.pin_hash is not None,
        )
        for m in members
    ]


@app.post("/api/families/{slug}/auth", response_model=AuthResponse)
def auth_member(
    slug: str,
    payload: AuthRequest,
    session: Session = Depends(get_session),
) -> AuthResponse:
    family = _get_family_by_slug(slug, session)
    member = session.get(Member, payload.member_id)
    if member is None or member.family_id != family.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Miembro no encontrado en esta familia.",
        )

    if member.pin_hash is None:
        member.pin_hash = hash_pin(payload.pin)
        session.add(member)
        session.commit()
        session.refresh(member)
    elif not verify_pin(payload.pin, member.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="PIN incorrecto.",
        )

    token = create_access_token(member.id, family.id, family.slug)
    return AuthResponse(
        access_token=token,
        member=AuthMemberInfo(
            id=member.id,
            name=member.name,
            avatar_emoji=member.avatar_emoji,
            family_slug=family.slug,
        ),
    )


@app.get("/api/families/{slug}/board", response_model=BoardResponse)
def get_board(
    slug: str,
    current_member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
) -> BoardResponse:
    family = _get_family_by_slug(slug, session)
    if current_member.family_id != family.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No perteneces a esta familia.",
        )

    members = session.exec(
        select(Member).where(Member.family_id == family.id).order_by(Member.id)
    ).all()
    member_map = {m.id: m for m in members}

    wishes = session.exec(
        select(WishItem)
        .where(WishItem.family_id == family.id)
        .order_by(WishItem.created_at.desc(), WishItem.id.desc())
    ).all()

    wishes_by_owner: dict[int, list[WishOut]] = {m.id: [] for m in members}

    for wish in wishes:
        # Regla Crítica de Privacidad: nunca exponer estado de compra al propietario
        if wish.owner_id == current_member.id:
            is_purchased = False
            purchased_by_id = None
            purchased_by_name = None
        else:
            is_purchased = wish.purchased_by_id is not None
            purchased_by_id = wish.purchased_by_id
            buyer = member_map.get(wish.purchased_by_id) if wish.purchased_by_id else None
            purchased_by_name = buyer.name if buyer else None

        wish_out = WishOut(
            id=wish.id,
            owner_id=wish.owner_id,
            title=wish.title,
            url=wish.url,
            price_approx=wish.price_approx,
            notes=wish.notes,
            created_at=wish.created_at,
            is_purchased=is_purchased,
            purchased_by_id=purchased_by_id,
            purchased_by_name=purchased_by_name,
        )
        if wish.owner_id in wishes_by_owner:
            wishes_by_owner[wish.owner_id].append(wish_out)

    columns = [
        BoardColumnOut(
            member_id=m.id,
            name=m.name,
            avatar_emoji=m.avatar_emoji,
            is_me=(m.id == current_member.id),
            wishes=wishes_by_owner.get(m.id, []),
        )
        for m in members
    ]

    return BoardResponse(
        family=FamilyInfo(id=family.id, name=family.name, slug=family.slug),
        current_member_id=current_member.id,
        columns=columns,
    )


@app.post("/api/wishes", response_model=WishOut, status_code=status.HTTP_201_CREATED)
def create_wish(
    payload: WishCreate,
    current_member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
) -> WishOut:
    wish = WishItem(
        family_id=current_member.family_id,
        owner_id=current_member.id,
        title=payload.title.strip(),
        url=payload.url.strip() if payload.url else None,
        price_approx=payload.price_approx.strip() if payload.price_approx else None,
        notes=payload.notes.strip() if payload.notes else None,
    )
    session.add(wish)
    session.commit()
    session.refresh(wish)

    return WishOut(
        id=wish.id,
        owner_id=wish.owner_id,
        title=wish.title,
        url=wish.url,
        price_approx=wish.price_approx,
        notes=wish.notes,
        created_at=wish.created_at,
        is_purchased=False,
        purchased_by_id=None,
        purchased_by_name=None,
    )


@app.patch("/api/wishes/{wish_id}", response_model=WishOut)
def update_wish(
    wish_id: int,
    payload: WishUpdate,
    current_member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
) -> WishOut:
    wish = session.get(WishItem, wish_id)
    if wish is None or wish.family_id != current_member.family_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deseo no encontrado.")
    if wish.owner_id != current_member.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el propietario puede editar este deseo.",
        )

    if payload.title is not None:
        wish.title = payload.title.strip()
    if payload.url is not None:
        wish.url = payload.url.strip() or None
    if payload.price_approx is not None:
        wish.price_approx = payload.price_approx.strip() or None
    if payload.notes is not None:
        wish.notes = payload.notes.strip() or None

    session.add(wish)
    session.commit()
    session.refresh(wish)

    return WishOut(
        id=wish.id,
        owner_id=wish.owner_id,
        title=wish.title,
        url=wish.url,
        price_approx=wish.price_approx,
        notes=wish.notes,
        created_at=wish.created_at,
        is_purchased=False,
        purchased_by_id=None,
        purchased_by_name=None,
    )


@app.delete("/api/wishes/{wish_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wish(
    wish_id: int,
    current_member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
) -> None:
    wish = session.get(WishItem, wish_id)
    if wish is None or wish.family_id != current_member.family_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deseo no encontrado.")
    if wish.owner_id != current_member.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el propietario puede eliminar este deseo.",
        )

    session.delete(wish)
    session.commit()


@app.post("/api/wishes/{wish_id}/toggle-purchase", response_model=WishOut)
def toggle_purchase(
    wish_id: int,
    current_member: Member = Depends(get_current_member),
    session: Session = Depends(get_session),
) -> WishOut:
    wish = session.get(WishItem, wish_id)
    if wish is None or wish.family_id != current_member.family_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deseo no encontrado.")

    if wish.owner_id == current_member.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes reservar ni ver el estado de tus propios regalos.",
        )

    if wish.purchased_by_id is None:
        wish.purchased_by_id = current_member.id
    elif wish.purchased_by_id == current_member.id:
        wish.purchased_by_id = None
    else:
        buyer = session.get(Member, wish.purchased_by_id)
        buyer_name = buyer.name if buyer else "otro familiar"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Este regalo ya está reservado por {buyer_name}.",
        )

    session.add(wish)
    session.commit()
    session.refresh(wish)

    buyer = session.get(Member, wish.purchased_by_id) if wish.purchased_by_id else None

    return WishOut(
        id=wish.id,
        owner_id=wish.owner_id,
        title=wish.title,
        url=wish.url,
        price_approx=wish.price_approx,
        notes=wish.notes,
        created_at=wish.created_at,
        is_purchased=wish.purchased_by_id is not None,
        purchased_by_id=wish.purchased_by_id,
        purchased_by_name=buyer.name if buyer else None,
    )
