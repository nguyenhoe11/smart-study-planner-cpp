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
- Study document library for importing readable web-page content, editing notes, saving source links, and reopening documents later.

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
2. In `Documents`, paste a website URL and click `Fetch content`.
3. Edit the imported content, add tags, and click `Save document`.
4. Reopen the saved document from the document list and use the source links to return to the original page.
5. Search flashcards from the library toolbar.
6. Filter flashcards by subject, topic, difficulty, and due status.
7. Add a flashcard from the editor panel.
8. Click `Edit` on a flashcard and save changes from the same panel, including changing its topic.
9. Click `Reveal answer` in the review queue, then choose `Correct` or `Wrong`.
10. Check that dashboard statistics, topic progress, recent reviews, and weak topics refresh after each change.

## Notes

- The app uses the existing `SmartStudyPlanner` SQL Server database.
- The current default server is `HOANE\SQLEXPRESS`.
- The document feature auto-creates `StudyDocuments` and `StudyDocumentLinks` when the backend starts.
- If Python from Microsoft Store fails, install Python from `python.org` and enable "Add python.exe to PATH".
