# Web API Contract Draft

This document maps the current CLI features to future web API endpoints. The goal is to keep the database and repository layer reusable when the project moves from CLI to a web app.

## Resources

### Flashcards

| Method | Endpoint | Purpose | Current C++ Layer |
| --- | --- | --- | --- |
| GET | `/api/flashcards` | List all flashcards | `FlashcardRepository::getAll` |
| GET | `/api/flashcards/search?keyword=sql` | Search by question, answer, topic, or subject | `FlashcardRepository::search` |
| POST | `/api/flashcards` | Create a flashcard | `FlashcardRepository::create` |
| PUT | `/api/flashcards/{id}` | Update a flashcard | `FlashcardRepository::update` |
| DELETE | `/api/flashcards/{id}` | Delete a flashcard and its review logs | `FlashcardRepository::remove` |

Example flashcard response:

```json
{
  "id": 1,
  "subjectName": "Database",
  "topicName": "SQL Joins",
  "question": "INNER JOIN khac LEFT JOIN o diem nao?",
  "answer": "INNER JOIN chi lay dong match ca hai bang...",
  "difficulty": 3,
  "nextReviewAt": "2026-05-19 10:00:00"
}
```

### Topics

| Method | Endpoint | Purpose | Current C++ Layer |
| --- | --- | --- | --- |
| GET | `/api/topics` | List topics | `TopicRepository::getAll` |
| GET | `/api/topics/{id}/exists` | Validate topic before creating flashcards | `TopicRepository::exists` |

### Reviews

| Method | Endpoint | Purpose | Current C++ Layer |
| --- | --- | --- | --- |
| GET | `/api/reviews/due` | Get due flashcards | `ReviewRepository::getDueFlashcards` |
| POST | `/api/reviews` | Save correct/wrong result | `ReviewRepository::saveReview` |
| GET | `/api/reviews/weak-topics` | Show weak topics | `ReviewRepository::getWeakTopics` |

Example review request:

```json
{
  "flashcardId": 1,
  "wasCorrect": true
}
```

### Statistics

| Method | Endpoint | Purpose | Current C++ Layer |
| --- | --- | --- | --- |
| GET | `/api/statistics/study` | Show total flashcards, reviews, accuracy, and due count | `StatisticsRepository::getStudyStatistics` |

Example statistics response:

```json
{
  "totalFlashcards": 10,
  "totalReviews": 25,
  "correctCount": 18,
  "wrongCount": 7,
  "accuracy": "72.00",
  "dueTodayCount": 3
}
```

## Suggested Web Stack

- Backend: ASP.NET Core, Node.js/Express, or Python/FastAPI.
- Database: SQL Server Express during development, SQL Server/Azure SQL for deployment.
- Frontend: React or plain HTML/CSS/JavaScript for a first version.

The current repository classes already isolate most SQL queries, so a future backend can reuse the same query structure even if it is implemented in another language.

