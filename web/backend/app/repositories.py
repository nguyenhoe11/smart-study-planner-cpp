from app.db import execute, fetch_all, fetch_one


def list_flashcards():
    return fetch_all(
        """
        SELECT
            f.FlashcardId AS id,
            s.Name AS subjectName,
            t.Name AS topicName,
            f.Question AS question,
            f.Answer AS answer,
            f.Difficulty AS difficulty,
            CONVERT(NVARCHAR(19), f.NextReviewAt, 120) AS nextReviewAt
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
            s.Name AS subjectName,
            t.Name AS topicName,
            f.Question AS question,
            f.Answer AS answer,
            f.Difficulty AS difficulty,
            CONVERT(NVARCHAR(19), f.NextReviewAt, 120) AS nextReviewAt
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


def update_flashcard(flashcard_id: int, question: str, answer: str, difficulty: int):
    execute(
        """
        UPDATE dbo.Flashcards
        SET Question = ?, Answer = ?, Difficulty = ?
        WHERE FlashcardId = ?;
        """,
        (question, answer, difficulty, flashcard_id),
    )


def delete_flashcard(flashcard_id: int):
    execute("DELETE FROM dbo.ReviewLogs WHERE FlashcardId = ?;", (flashcard_id,))
    execute("DELETE FROM dbo.Flashcards WHERE FlashcardId = ?;", (flashcard_id,))


def list_topics():
    return fetch_all(
        """
        SELECT
            t.TopicId AS id,
            s.Name AS subjectName,
            t.Name AS name,
            t.Priority AS priority
        FROM dbo.Topics t
        JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId
        ORDER BY s.Name, t.Name;
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
            f.Answer AS answer
        FROM dbo.Flashcards f
        JOIN dbo.Topics t ON f.TopicId = t.TopicId
        JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId
        WHERE f.NextReviewAt <= SYSUTCDATETIME()
        ORDER BY f.Difficulty DESC, f.NextReviewAt ASC;
        """
    )


def save_review(flashcard_id: int, was_correct: bool):
    correct_value = 1 if was_correct else 0
    execute(
        "INSERT INTO dbo.ReviewLogs (FlashcardId, WasCorrect) VALUES (?, ?);",
        (flashcard_id, correct_value),
    )
    execute(
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

