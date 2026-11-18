# Reyes Magos Kanban Board

Tablero Kanban familiar estilo Trello para organizar las cartas de Reyes Magos sin spoilers. Cada miembro tiene su columna, puede añadir sus deseos y reservar regalos de los demás, pero el backend oculta siempre el estado de compra en la columna del propio usuario.

---

## Arranque en Local

### 1. Backend (`/backend`)
```bash
cd backend
uv sync
uv run python seed_dev.py
uv run uvicorn app.main:app --reload --port 8000
```
- API disponible en `http://localhost:8000`
- Documentación interactiva: `http://localhost:8000/docs`
- Familia de prueba creada por `seed_dev.py`: `slug="familia-2026"` con 5 miembros (`Mamá`, `Papá`, `Lucía`, `Mateo`, `Abuela`).

### 2. Frontend (`/frontend`)
```bash
cd frontend
npm install
npm run dev
```
- Aplicación disponible en `http://localhost:5173`

---

## Variables de Entorno para Despliegue

### Backend (Render / Koyeb + Neon PostgreSQL)
Configura estas variables en tu servicio backend (ver [backend/.env.example](backend/.env.example)):
- `DATABASE_URL`: Cadena de conexión de Neon PostgreSQL (ej. `postgresql+psycopg://usuario:password@host/dbname?sslmode=require`). También se aceptan prefijos `postgres://` o `postgresql://` (se convierten automáticamente a `postgresql+psycopg://`).
- `JWT_SECRET`: Secreto largo y aleatorio para firmar los tokens JWT (45 días de validez).
- `CORS_ORIGINS`: URL de tu frontend en Netlify (ej. `https://tu-tablero.netlify.app`).

### Frontend (Netlify)
Configura estas variables en Netlify (ver [frontend/.env.example](frontend/.env.example)):
- `VITE_API_URL`: URL pública de tu backend en Render/Koyeb (ej. `https://tu-api.onrender.com`).
- `VITE_FAMILY_SLUG`: Slug de tu familia (por defecto `familia-2026`).
