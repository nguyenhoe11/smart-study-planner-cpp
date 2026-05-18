# Smart Study Planner

A C++ and SQL Server flashcard planner for practicing database design, SQL queries, and basic scheduling algorithms.

## Current Scope

- SQL Server schema for subjects, topics, flashcards, and review logs.
- C++20 CLI app with a menu-driven workflow.
- ODBC connection to SQL Server Express.
- Seed data for database and C++ algorithm flashcards.
- Flashcard listing, creation, review logging, and weak-topic statistics.

## Requirements

- Visual Studio 2026 with Desktop development with C++.
- CMake.
- SQL Server Express instance named `SQLEXPRESS`.
- ODBC Driver 18 for SQL Server.
- Git.

## Database Setup

Open SQL Server Management Studio and connect to:

```text
HOANE\SQLEXPRESS
```

Run these scripts in order:

```text
sql/schema.sql
sql/seed.sql
```

## Build

Open a Visual Studio Developer PowerShell or Developer Command Prompt, then run:

```powershell
cmake -S . -B build -G "NMake Makefiles"
cmake --build build
```

## Run

```powershell
.\build\smart_study_planner.exe
```

Optional:

```powershell
.\build\smart_study_planner.exe --server HOANE\SQLEXPRESS --database SmartStudyPlanner
```

If Windows Authentication is not available, run with a SQL Server login:

```powershell
.\build\smart_study_planner.exe --user app_user --password your_password
```

## CLI Features

```text
1. List flashcards
2. Add flashcard
3. Review due flashcards
4. Show weak topics
5. Exit
```

The review flow updates `ReviewLogs`, doubles the review interval for correct answers up to 30 days, and resets the interval to 1 day for wrong answers.

## Next Features

- Add edit/delete flashcard actions.
- Add a clearer spaced-repetition scoring algorithm.
- Add weekly progress reports.
- Add unit-style tests for SQL helper behavior.
