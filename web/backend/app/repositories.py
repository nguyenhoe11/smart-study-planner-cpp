from app.db import execute, execute_transaction, fetch_all, fetch_one


def list_flashcards():
    return fetch_all(
        """
        SELECT
            f.FlashcardId AS id,
            s.SubjectId AS subjectId,
            s.Name AS subjectName,
            t.TopicId AS topicId,
            t.Name AS topicName,
            f.Question AS question,
            f.Answer AS answer,
            f.Difficulty AS difficulty,
            f.ReviewIntervalDays AS reviewIntervalDays,
            CASE WHEN f.NextReviewAt <= SYSUTCDATETIME() THEN 1 ELSE 0 END AS isDue,
            CONVERT(NVARCHAR(19), f.NextReviewAt, 120) AS nextReviewAt,
            CONVERT(NVARCHAR(19), f.CreatedAt, 120) AS createdAt
        FROM dbo.Flashcards f
        JOIN dbo.Topics t ON f.TopicId = t.TopicId
        JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId
        ORDER BY f.FlashcardId;
        """
    )


def search_flashcards(keyword: str):
    pattern = f"%{keyword}%"
    return fetch_all(
        """
        SELECT
            f.FlashcardId AS id,
            s.SubjectId AS subjectId,
            s.Name AS subjectName,
            t.TopicId AS topicId,
            t.Name AS topicName,
            f.Question AS question,
            f.Answer AS answer,
            f.Difficulty AS difficulty,
            f.ReviewIntervalDays AS reviewIntervalDays,
            CASE WHEN f.NextReviewAt <= SYSUTCDATETIME() THEN 1 ELSE 0 END AS isDue,
            CONVERT(NVARCHAR(19), f.NextReviewAt, 120) AS nextReviewAt,
            CONVERT(NVARCHAR(19), f.CreatedAt, 120) AS createdAt
        FROM dbo.Flashcards f
        JOIN dbo.Topics t ON f.TopicId = t.TopicId
        JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId
        WHERE f.Question LIKE ?
           OR f.Answer LIKE ?
           OR t.Name LIKE ?
           OR s.Name LIKE ?
        ORDER BY f.FlashcardId;
        """,
        (pattern, pattern, pattern, pattern),
    )


def flashcard_exists(flashcard_id: int) -> bool:
    row = fetch_one(
        "SELECT COUNT(*) AS count FROM dbo.Flashcards WHERE FlashcardId = ?;",
        (flashcard_id,),
    )
    return bool(row and row["count"] > 0)


def create_flashcard(topic_id: int, question: str, answer: str, difficulty: int):
    execute(
        """
        INSERT INTO dbo.Flashcards (TopicId, Question, Answer, Difficulty)
        VALUES (?, ?, ?, ?);
        """,
        (topic_id, question, answer, difficulty),
    )


def update_flashcard(flashcard_id: int, topic_id: int, question: str, answer: str, difficulty: int):
    execute(
        """
        UPDATE dbo.Flashcards
        SET TopicId = ?, Question = ?, Answer = ?, Difficulty = ?
        WHERE FlashcardId = ?;
        """,
        (topic_id, question, answer, difficulty, flashcard_id),
    )


def delete_flashcard(flashcard_id: int):
    execute_transaction(
        [
            ("DELETE FROM dbo.ReviewLogs WHERE FlashcardId = ?;", (flashcard_id,)),
            ("DELETE FROM dbo.Flashcards WHERE FlashcardId = ?;", (flashcard_id,)),
        ]
    )


def list_topics():
    return fetch_all(
        """
        SELECT
            t.TopicId AS id,
            s.SubjectId AS subjectId,
            s.Name AS subjectName,
            t.Name AS name,
            t.Priority AS priority
        FROM dbo.Topics t
        JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId
        ORDER BY s.Name, t.Name;
        """
    )


def list_subjects():
    return fetch_all(
        """
        SELECT
            SubjectId AS id,
            Name AS name
        FROM dbo.Subjects
        ORDER BY Name;
        """
    )


def topic_exists(topic_id: int) -> bool:
    row = fetch_one(
        "SELECT COUNT(*) AS count FROM dbo.Topics WHERE TopicId = ?;",
        (topic_id,),
    )
    return bool(row and row["count"] > 0)


def due_reviews():
    return fetch_all(
        """
        SELECT TOP 10
            f.FlashcardId AS flashcardId,
            s.Name AS subjectName,
            t.Name AS topicName,
            f.Question AS question,
            f.Answer AS answer,
            f.Difficulty AS difficulty,
            f.ReviewIntervalDays AS reviewIntervalDays,
            CONVERT(NVARCHAR(19), f.NextReviewAt, 120) AS nextReviewAt
        FROM dbo.Flashcards f
        JOIN dbo.Topics t ON f.TopicId = t.TopicId
        JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId
        WHERE f.NextReviewAt <= SYSUTCDATETIME()
        ORDER BY f.Difficulty DESC, f.NextReviewAt ASC;
        """
    )


def save_review(flashcard_id: int, was_correct: bool):
    correct_value = 1 if was_correct else 0
    execute_transaction(
        [
            (
                "INSERT INTO dbo.ReviewLogs (FlashcardId, WasCorrect) VALUES (?, ?);",
                (flashcard_id, correct_value),
            ),
            (
                """
                UPDATE dbo.Flashcards
                SET
                    ReviewIntervalDays = CASE
                        WHEN ? = 1 THEN
                            CASE WHEN ReviewIntervalDays * 2 > 30 THEN 30 ELSE ReviewIntervalDays * 2 END
                        ELSE 1
                    END,
                    NextReviewAt = DATEADD(day, CASE
                        WHEN ? = 1 THEN
                            CASE WHEN ReviewIntervalDays * 2 > 30 THEN 30 ELSE ReviewIntervalDays * 2 END
                        ELSE 1
                    END, SYSUTCDATETIME())
                WHERE FlashcardId = ?;
                """,
                (correct_value, correct_value, flashcard_id),
            ),
        ]
    )


def weak_topics():
    return fetch_all(
        """
        SELECT TOP 10
            s.Name AS subjectName,
            t.Name AS topicName,
            COUNT(rl.ReviewLogId) AS reviewCount,
            SUM(CASE WHEN rl.WasCorrect = 0 THEN 1 ELSE 0 END) AS wrongCount,
            CAST(100.0 * SUM(CASE WHEN rl.WasCorrect = 0 THEN 1 ELSE 0 END) / COUNT(rl.ReviewLogId) AS DECIMAL(5,2)) AS wrongRate
        FROM dbo.ReviewLogs rl
        JOIN dbo.Flashcards f ON rl.FlashcardId = f.FlashcardId
        JOIN dbo.Topics t ON f.TopicId = t.TopicId
        JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId
        GROUP BY s.Name, t.Name
        HAVING COUNT(rl.ReviewLogId) > 0
        ORDER BY wrongRate DESC, reviewCount DESC;
        """
    )


def recent_reviews(limit: int = 8):
    safe_limit = max(1, min(limit, 20))
    return fetch_all(
        f"""
        SELECT TOP {safe_limit}
            rl.ReviewLogId AS id,
            f.FlashcardId AS flashcardId,
            s.Name AS subjectName,
            t.Name AS topicName,
            f.Question AS question,
            rl.WasCorrect AS wasCorrect,
            CONVERT(NVARCHAR(19), rl.ReviewedAt, 120) AS reviewedAt
        FROM dbo.ReviewLogs rl
        JOIN dbo.Flashcards f ON rl.FlashcardId = f.FlashcardId
        JOIN dbo.Topics t ON f.TopicId = t.TopicId
        JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId
        ORDER BY rl.ReviewedAt DESC, rl.ReviewLogId DESC;
        """
    )


def study_statistics():
    return fetch_one(
        """
        SELECT
            (SELECT COUNT(*) FROM dbo.Flashcards) AS totalFlashcards,
            (SELECT COUNT(*) FROM dbo.ReviewLogs) AS totalReviews,
            (SELECT COUNT(*) FROM dbo.ReviewLogs WHERE WasCorrect = 1) AS correctCount,
            (SELECT COUNT(*) FROM dbo.ReviewLogs WHERE WasCorrect = 0) AS wrongCount,
            COALESCE((
                SELECT CAST(100.0 * SUM(CASE WHEN WasCorrect = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) AS DECIMAL(5,2))
                FROM dbo.ReviewLogs
            ), 0) AS accuracy,
            (SELECT COUNT(*) FROM dbo.Flashcards WHERE NextReviewAt <= SYSUTCDATETIME()) AS dueTodayCount;
        """
    )


def topic_statistics():
    return fetch_all(
        """
        SELECT
            s.SubjectId AS subjectId,
            s.Name AS subjectName,
            t.TopicId AS topicId,
            t.Name AS topicName,
            t.Priority AS priority,
            COUNT(DISTINCT f.FlashcardId) AS flashcardCount,
            SUM(CASE WHEN f.NextReviewAt <= SYSUTCDATETIME() THEN 1 ELSE 0 END) AS dueCount,
            COUNT(rl.ReviewLogId) AS reviewCount,
            COALESCE(SUM(CASE WHEN rl.WasCorrect = 1 THEN 1 ELSE 0 END), 0) AS correctCount,
            COALESCE(SUM(CASE WHEN rl.WasCorrect = 0 THEN 1 ELSE 0 END), 0) AS wrongCount,
            COALESCE(CAST(100.0 * SUM(CASE WHEN rl.WasCorrect = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(rl.ReviewLogId), 0) AS DECIMAL(5,2)), 0) AS accuracy
        FROM dbo.Topics t
        JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId
        LEFT JOIN dbo.Flashcards f ON f.TopicId = t.TopicId
        LEFT JOIN dbo.ReviewLogs rl ON rl.FlashcardId = f.FlashcardId
        GROUP BY s.SubjectId, s.Name, t.TopicId, t.Name, t.Priority
        ORDER BY dueCount DESC, accuracy ASC, s.Name, t.Name;
        """
    )
