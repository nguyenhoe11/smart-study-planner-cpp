# Smart Study Planner Web Prototype

This folder prepares the CLI project for a future web version.

## What Is Included

- FastAPI backend scaffold.
- SQL Server repository functions matching the existing C++ CLI features.
- Plain HTML/CSS/JavaScript frontend.
- API endpoints for flashcards, topics, reviews, weak topics, and statistics.

## Install

From `C:\Users\Admin\Documents\project\web\backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Run

```powershell
uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000
```

## Notes

- The app uses the existing `SmartStudyPlanner` SQL Server database.
- The current default server is `HOANE\SQLEXPRESS`.
- If Python from Microsoft Store fails, install Python from `python.org` and enable "Add python.exe to PATH".

