# Smart Study Planner

A C++20 and SQL Server flashcard planner that helps students organize topics, review flashcards, and track weak areas using a simple spaced-repetition workflow.

## Features

- Manage study flashcards from a C++ CLI.
- Store subjects, topics, flashcards, and review history in SQL Server.
- List all flashcards with subject, topic, difficulty, and next review time.
- Add new flashcards from the terminal.
- Review due flashcards and save correct/wrong results.
- Update the next review date based on review performance.
- Show weak topics based on wrong-answer rate.

## Tech Stack

- C++20
- SQL Server Express
- ODBC Driver 18 for SQL Server
- CMake
- Visual Studio 2026 MSVC toolchain
- Git

## Database Schema

Main tables:

- `Subjects`
- `Topics`
- `Flashcards`
- `ReviewLogs`

Relationship overview:

```text
Subjects 1---N Topics 1---N Flashcards 1---N ReviewLogs
```

## CLI Menu

```text
Smart Study Planner
1. List flashcards
2. Add flashcard
3. Review due flashcards
4. Show weak topics
5. Exit
```

## Review Logic

When a flashcard is reviewed:

- Correct answer: review interval doubles, capped at 30 days.
- Wrong answer: review interval resets to 1 day.
- Every review is saved in `ReviewLogs`.

This keeps difficult cards appearing sooner while easier cards are gradually spaced out.

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

## Project Structure

```text
smart-study-planner-cpp/
  include/
    DbConnection.h
  src/
    DbConnection.cpp
    main.cpp
  sql/
    schema.sql
    seed.sql
  CMakeLists.txt
  README.md
```

## Learning Goals

This project demonstrates:

- SQL Server schema design
- C++ database connectivity with ODBC
- CLI application structure
- SQL joins and aggregate queries
- Basic spaced-repetition scheduling
- Git/GitHub project workflow
