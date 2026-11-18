# specs.md — Especificación Completa: Reyes Magos Kanban Board

## 1. Objetivo
Tablero Kanban familiar estilo Trello donde cada columna representa a un miembro de la familia. Todos los miembros ven todas las listas de deseos a la vez y pueden reservar o comprar regalos de otros familiares, pero el propietario de cada columna **NUNCA** ve qué regalos suyos están comprados ni por quién.

---

## 2. Arquitectura y Stack
- **Backend:** `/backend` — FastAPI + SQLModel + Uvicorn + PyJWT + Passlib/Bcrypt + Psycopg 3.
- **Frontend:** `/frontend` — React 19 + Vite + Tailwind CSS v4 (`@tailwindcss/vite`) + `lucide-react`.
- **Base de Datos:** SQLite local (`reyes_dev.db`) / PostgreSQL (Neon) en producción.

---

## 3. Modelo de Datos (`backend/app/models.py`)

### Tablas
1. **`Family`**
   - `id`: `int | None` (PK)
   - `name`: `str`
   - `slug`: `str` (único, indexado)
   - `admin_secret`: `str`

2. **`Member`**
   - `id`: `int | None` (PK)
   - `family_id`: `int` (FK -> `family.id`, indexado)
   - `name`: `str`
   - `avatar_emoji`: `str`
   - `pin_hash`: `str | None` (nulo hasta el primer acceso)

3. **`WishItem`**
   - `id`: `int | None` (PK)
   - `family_id`: `int` (FK -> `family.id`, indexado)
   - `owner_id`: `int` (FK -> `member.id`, indexado)
   - `title`: `str`
   - `url`: `str | None`
   - `price_approx`: `str | None`
   - `notes`: `str | None`
   - `purchased_by_id`: `int | None` (FK -> `member.id`, nullable)
   - `created_at`: `datetime` (UTC)

---

## 4. API Endpoints (`backend/app/main.py`)

### Salud
- `GET /health` -> `{"status": "ok"}`

### Setup y Autenticación
- `POST /api/families/setup`
  - Crea una familia y su lista inicial de miembros.
  - Body: `{ name, slug, admin_secret, members: [{ name, avatar_emoji }] }`
  - Devuelve `409` si el `slug` ya existe.
- `GET /api/families/{slug}/members`
  - Lista pública de miembros de la familia con `{ id, name, avatar_emoji, has_pin }`.
- `POST /api/families/{slug}/auth`
  - Body: `{ member_id, pin }` (PIN de 4 dígitos numéricos).
  - Si `member.pin_hash is None`: guarda el hash bcrypt del PIN y devuelve JWT.
  - Si `member.pin_hash` existe: verifica el PIN. Si falla, devuelve `401`. Si es correcto, devuelve `{ access_token, token_type: "bearer", member: { id, name, avatar_emoji, family_slug } }`.
  - JWT válido por **45 días**.

### Tablero Kanban
- `GET /api/families/{slug}/board` (Requiere JWT Bearer)
  - Verifica que el usuario autenticado pertenece a la familia `{slug}`.
  - Devuelve `{ family: { id, name, slug }, current_member_id, columns: [...] }`.
  - Cada columna: `{ member_id, name, avatar_emoji, is_me, wishes: [...] }`.
  - **Regla Crítica de Privacidad:** Si `wish.owner_id == current_member_id`, el backend **fuerza** `is_purchased = False`, `purchased_by_id = None` y `purchased_by_name = None` antes de serializar.

### Deseos (`WishItem`)
- `POST /api/wishes` (Requiere JWT Bearer)
  - Body: `{ title, url?, price_approx?, notes? }`
  - Añade el deseo a la columna del usuario actual (`owner_id = current_member.id`).
- `PATCH /api/wishes/{wish_id}` (Requiere JWT Bearer)
  - Solo el propietario puede editar (`403` si no es propietario).
- `DELETE /api/wishes/{wish_id}` (Requiere JWT Bearer)
  - Solo el propietario puede eliminar (`403` si no es propietario).
- `POST /api/wishes/{wish_id}/toggle-purchase` (Requiere JWT Bearer)
  - `403 Forbidden` si `wish.owner_id == current_member.id`.
  - Si `wish.purchased_by_id is None`: asigna `current_member.id` (reserva).
  - Si `wish.purchased_by_id == current_member.id`: asigna `None` (cancela reserva).
  - Si `wish.purchased_by_id` es otro miembro: devuelve `409 Conflict`.

---

## 5. Frontend (`/frontend`)
- **Estética:** Neo-Brutalismo (`bg-stone-100`, tarjetas blancas `border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]`, acento `bg-lime-400`).
- **Flujo:**
  1. `PinLogin`: Selector "¿Quién eres?" con avatares + teclado/input de PIN de 4 dígitos indicando "Crear PIN" o "PIN activo".
  2. `App`: Barra superior con título de familia, botones de salto rápido a cada columna (ideal en móvil), botón de refresco, logout, mensaje amable durante cold starts ("Preparando los camellos...") y tablero horizontal con la columna propia siempre en primer lugar.
  3. `BoardColumn`: Columna `w-[85vw] sm:w-80 shrink-0 snap-center`. Si `is_me` es true, muestra badge "Sin spoilers" y formulario inferior para añadir deseo.
  4. `WishCard`: Título (tachado si reservado en columnas ajenas), nota, precio (`~XX €`), enlace externo y botón de acción ("Lo pido yo" / "Lo compras tú" / "Cogido (Nombre)").
