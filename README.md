# EduPlatform

Full-stack TypeScript platform for kid-friendly online classrooms. Monorepo with `backend` (NestJS + MongoDB) and `frontend` (Vite + React + MUI). Docker-first, with seed data, tests, and CI.

## Quick start (Docker)

1. Copy envs

```
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Build & run

```
docker-compose up --build
```

- Backend: http://localhost:3000 (Swagger at `/api/docs`)
- Frontend: http://localhost:5173
- MongoDB: mongodb://mongo:27017/eduplatform
- Mongo Express: http://localhost:8081

3. Seed sample data (after backend is up)

```
docker-compose exec backend node dist/scripts/seed.js
```

## Local dev (without Docker)

- Backend
  - `cd backend && npm i`
  - `npm run start:dev`
- Frontend
  - `cd frontend && npm i`
  - `npm run dev`

## Structure

- `backend/` — NestJS app, Mongoose models, modules, Swagger, tests
- `frontend/` — Vite React app, MUI theme, React Query, routes
- `seed/` — `sample_data.json`
- `scripts/` — seed and utilities
- `.github/workflows/` — CI

## License

MIT
