# GEMINI.md — Reglas del Proyecto: Reyes Magos Kanban Board

## Filosofía y Metodología
Este proyecto sigue **Spec-Driven Development (SDD)**. Toda implementación debe ajustarse estrictamente a lo definido en `specs.md`.

## Reglas Críticas de Negocio y Seguridad
1. **Regla Crítica de Privacidad (Backend-enforced):**
   - En `GET /api/families/{slug}/board`, cuando `wish.owner_id == current_member_id`, el backend **DEBE** forzar `is_purchased = False`, `purchased_by_id = None` y `purchased_by_name = None` antes de serializar el JSON.
   - Nunca delegar esta ocultación únicamente al frontend.
2. **Autenticación sin fricción:**
   - Acceso por miembro con PIN de 4 dígitos.
   - Si `pin_hash is None` (primer acceso), el PIN introducido se hashea con `bcrypt` y se guarda.
   - En accesos posteriores se valida el PIN contra `pin_hash` y se emite un JWT Bearer con validez de 45 días.
3. **Aislamiento de acciones:**
   - Solo el propietario de un deseo (`owner_id == current_member_id`) puede editarlo (`PATCH /api/wishes/{wish_id}`) o eliminarlo (`DELETE /api/wishes/{wish_id}`).
   - El propietario **NUNCA** puede marcar como comprado/reservado su propio deseo (`403 Forbidden`).
   - Si un deseo ya está reservado por otro familiar, intentar reservarlo devuelve `409 Conflict`.

## Stack Técnico
- **Backend (`/backend`):** Python 3.12+, FastAPI, SQLModel, `psycopg[binary]`, `pyjwt`, `passlib[bcrypt]`, `bcrypt==4.0.1`, Uvicorn.
- **Frontend (`/frontend`):** React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), `lucide-react`.
- **Base de datos:** SQLite en desarrollo (`sqlite:///./reyes_dev.db`), PostgreSQL (Neon) en producción (`postgresql+psycopg://` con `pool_pre_ping=True`).

## Estilo y Calidad de Código
- **Frontend:** Estética Neo-Brutalista limpia y minimalista (`bg-stone-100`, bordes `border-2 border-zinc-900`, sombras duras `shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]`, acento `bg-lime-400`).
- **Backend:** Código modular, tipado estricto con SQLModel/Pydantic, manejo explícito de errores HTTP (`401`, `403`, `404`, `409`, `422`).
