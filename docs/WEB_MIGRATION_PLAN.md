# Web Migration Plan

## Current Architecture

```text
main.cpp
-> Menu
-> Service
-> Repository
-> DbConnection
-> SQL Server
```

This is ready for a web migration because SQL logic is concentrated in repositories instead of being scattered across menu code.

## Phase 1: Finish CLI Baseline

- Keep CLI stable.
- Test list, search, add, edit, delete, review, weak topics, and statistics.
- Commit a clean working version before starting web work.

## Phase 2: Create Backend API

Build API endpoints matching `docs/API_CONTRACT.md`.

Recommended first backend choice:

- Python/FastAPI if the goal is quick web progress.
- ASP.NET Core if the goal is a Microsoft/C#/SQL Server stack.

Status: FastAPI backend is now implemented in `web/backend` with endpoints for flashcards, topics, reviews, weak topics, and study statistics.

## Phase 3: Build Basic Web UI

First pages:

- Dashboard with statistics.
- Flashcard list and search.
- Add/edit flashcard form.
- Review page.
- Weak topics page.

Status: Plain HTML/CSS/JavaScript frontend is now implemented in `web/frontend` with dashboard, flashcard library, add/edit form, review queue, topic reference, and weak-topic table.

## Phase 4: Polish for Portfolio

- Add screenshots.
- Add an ERD diagram.
- Add a short demo video or GIF.
- Add deployment notes.
- Write CV bullets based on the final features.

Status: dashboard screenshot is saved at `docs/assets/web_dashboard.png` and linked from `README.md`. Remaining polish candidates are ERD diagram, demo GIF/video, and deployment notes.

## Keep In Mind

- Do not change database schema until the web UI needs it.
- Keep repository queries simple and traceable.
- Prefer readable code over clever abstractions.
