from sqlmodel import Session, select

from app.database import create_db_and_tables, engine
from app.models import Family, Member, WishItem


def seed() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        existing = session.exec(select(Family).where(Family.slug == "familia-2026")).first()
        if existing is not None:
            print("La familia 'familia-2026' ya existe. Seed omitido.")
            return

        family = Family(
            name="Familia Reyes 2026",
            slug="familia-2026",
            admin_secret="reyes2026",
        )
        session.add(family)
        session.flush()

        members_data = [
            ("Mamá", "👑"),
            ("Papá", "🧔"),
            ("Lucía", "🎨"),
            ("Mateo", "🚀"),
            ("Abuela", "🧶"),
        ]
        members: list[Member] = []
        for name, emoji in members_data:
            member = Member(
                family_id=family.id,
                name=name,
                avatar_emoji=emoji,
                pin_hash=None,
            )
            session.add(member)
            members.append(member)

        session.flush()

        sample_wishes = [
            WishItem(
                family_id=family.id,
                owner_id=members[0].id,
                title="Bufanda de lana merino",
                price_approx="35 €",
                notes="Color beige o verde bosque",
            ),
            WishItem(
                family_id=family.id,
                owner_id=members[1].id,
                title="Cafetera italiana 6 tazas",
                price_approx="40 €",
                notes="Apta para inducción",
            ),
            WishItem(
                family_id=family.id,
                owner_id=members[2].id,
                title="Set de acuarelas profesionales",
                price_approx="28 €",
                notes="12 o 24 colores en estuche metálico",
            ),
            WishItem(
                family_id=family.id,
                owner_id=members[3].id,
                title="LEGO Creator Cohete Espacial",
                price_approx="50 €",
                notes="Cualquier set espacial",
            ),
            WishItem(
                family_id=family.id,
                owner_id=members[4].id,
                title="Zapatillas de casa cómodas",
                price_approx="25 €",
                notes="Talla 38, suela antideslizante",
            ),
        ]
        for wish in sample_wishes:
            session.add(wish)

        session.commit()
        print("Seed completado: familia 'familia-2026' creada con 5 miembros y deseos iniciales.")


if __name__ == "__main__":
    seed()
