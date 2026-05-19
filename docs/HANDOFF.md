# Project Handoff

This file is the quick restart note for future Codex sessions.

## Current Status

- C++ CLI is working with SQL Server Express database `SmartStudyPlanner`.
- Architecture is now:
  `main.cpp -> Menu -> Service -> Repository -> DbConnection -> SQL Server`.
- CLI features prepared:
  - List flashcards
  - Search flashcards
  - Add flashcard with topic validation
  - Edit flashcard
  - Delete flashcard and related review logs
  - Review due flashcards
  - Show weak topics
  - Show study statistics
- Web preparation is started:
  - FastAPI backend scaffold exists in `web/backend`.
  - Static frontend prototype exists in `web/frontend`.
  - API contract is documented in `docs/API_CONTRACT.md`.
  - Web migration plan is documented in `docs/WEB_MIGRATION_PLAN.md`.
- Learning guide document exists at `docs/Smart_Study_Planner_Project_Guide.docx`.
- VS Code/codebase-only guide exists at `docs/VSCode_Codebase_Guide.docx`.

## Local Setup Notes

- SQL Server instance: `HOANE\SQLEXPRESS`
- Database: `SmartStudyPlanner`
- Python installed at:
  `C:\Users\Admin\AppData\Local\Programs\Python\Python312\python.exe`
- Backend virtual environment:
  `web/backend/.venv`
- Local backend env file:
  `web/backend/.env`

Ignored local folders/files:

- `.vscode/`
- `build/`
- `web/backend/.venv/`
- `web/backend/.env`
- Python `__pycache__/`

## Build CLI

From `C:\Users\Admin\Documents\project`:

```powershell
cmake --build build
.\build\smart_study_planner.exe
```

If `cmake --build build` cannot find MSVC tools, open the project in VS Code with the existing local `.vscode/settings.json`, or run from Visual Studio Developer PowerShell.

## Run Web Prototype

From `C:\Users\Admin\Documents\project\web\backend`:

```powershell
.\.venv\Scripts\activate
uvicorn app.main:app --reload
```

Then open:

```text
http://127.0.0.1:8000
```

## Next Recommended Work

1. Connect the frontend screens to all backend endpoints.
2. Add create/edit/delete forms for flashcards in the web UI.
3. Add review workflow page.
4. Add dashboard cards for study statistics and weak topics.
5. Improve styling for a portfolio-ready web app.
6. Add screenshots and demo instructions to `README.md`.
