# Smart Study Planner

A C++ and SQL Server flashcard planner for practicing database design, SQL queries, and basic scheduling algorithms.

## Current Scope

- SQL Server schema for subjects, topics, flashcards, and review logs.
- C++20 CLI starter app.
- ODBC connection to SQL Server Express.
- Seed data for database and C++ algorithm flashcards.

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
cmake -S . -B build
cmake --build build --config Debug
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

## Next Features

- Add CLI menu for adding flashcards.
- Implement review result updates.
- Use a priority queue to choose today's review list.
- Add statistics queries for weak topics and weekly progress.
