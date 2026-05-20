# Smart Study Planner Web App

This folder contains the FastAPI + plain HTML/CSS/JavaScript web version of the C++ SQL Server flashcard planner.

## What Is Included

- FastAPI backend.
- SQL Server repository functions matching the existing C++ CLI features.
- Plain HTML/CSS/JavaScript frontend with dashboard, editor, review queue, topics, and weak-topic views.
- API endpoints for flashcards, topics, reviews, weak topics, and statistics.
- Transaction-safe delete and review-save flows.
- Library filters by subject, topic, difficulty, and due status.
- Topic-level performance statistics and recent review activity.

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

## Test Flow

1. Confirm the API status pill says `API connected`.
2. Search flashcards from the library toolbar.
3. Filter flashcards by subject, topic, difficulty, and due status.
4. Add a flashcard from the editor panel.
5. Click `Edit` on a flashcard and save changes from the same panel, including changing its topic.
6. Click `Reveal answer` in the review queue, then choose `Correct` or `Wrong`.
7. Check that dashboard statistics, topic progress, recent reviews, and weak topics refresh after each change.

## Notes

- The app uses the existing `SmartStudyPlanner` SQL Server database.
- The current default server is `HOANE\SQLEXPRESS`.
- If Python from Microsoft Store fails, install Python from `python.org` and enable "Add python.exe to PATH".
