from app.db import execute, execute_transaction, fetch_all, fetch_one, get_connection


def ensure_document_tables():
    execute_transaction(
        [
            (
                """
                IF OBJECT_ID(N'dbo.StudyDocuments', N'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.StudyDocuments (
                        DocumentId INT IDENTITY(1,1) PRIMARY KEY,
                        Title NVARCHAR(250) NOT NULL,
                        SourceUrl NVARCHAR(1000) NULL,
                        Tags NVARCHAR(250) NULL,
                        Content NVARCHAR(MAX) NOT NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
                    );
                END;
                """,
                (),
            ),
            (
                """
                IF OBJECT_ID(N'dbo.StudyDocumentLinks', N'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.StudyDocumentLinks (
                        DocumentLinkId INT IDENTITY(1,1) PRIMARY KEY,
                        DocumentId INT NOT NULL,
                        Label NVARCHAR(250) NOT NULL,
                        Url NVARCHAR(1000) NOT NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                        CONSTRAINT FK_StudyDocumentLinks_Documents
                            FOREIGN KEY (DocumentId) REFERENCES dbo.StudyDocuments(DocumentId)
                    );
                END;
                """,
                (),
            ),
            (
                """
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = N'IX_StudyDocuments_UpdatedAt'
                      AND object_id = OBJECT_ID(N'dbo.StudyDocuments')
                )
                BEGIN
                    CREATE INDEX IX_StudyDocuments_UpdatedAt
                    ON dbo.StudyDocuments(UpdatedAt DESC, DocumentId DESC);
                END;
                """,
                (),
            ),
        ]
    )


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


def list_documents():
    return fetch_all(
        """
        SELECT
            d.DocumentId AS id,
            d.Title AS title,
            d.SourceUrl AS sourceUrl,
            d.Tags AS tags,
            LEN(d.Content) AS characterCount,
            (
                SELECT COUNT(*)
                FROM dbo.StudyDocumentLinks l
                WHERE l.DocumentId = d.DocumentId
            ) AS linkCount,
            CONVERT(NVARCHAR(19), d.CreatedAt, 120) AS createdAt,
            CONVERT(NVARCHAR(19), d.UpdatedAt, 120) AS updatedAt
        FROM dbo.StudyDocuments d
        ORDER BY d.UpdatedAt DESC, d.DocumentId DESC;
        """
    )


def search_documents(keyword: str):
    pattern = f"%{keyword}%"
    return fetch_all(
        """
        SELECT
            d.DocumentId AS id,
            d.Title AS title,
            d.SourceUrl AS sourceUrl,
            d.Tags AS tags,
            LEN(d.Content) AS characterCount,
            (
                SELECT COUNT(*)
                FROM dbo.StudyDocumentLinks l
                WHERE l.DocumentId = d.DocumentId
            ) AS linkCount,
            CONVERT(NVARCHAR(19), d.CreatedAt, 120) AS createdAt,
            CONVERT(NVARCHAR(19), d.UpdatedAt, 120) AS updatedAt
        FROM dbo.StudyDocuments d
        WHERE d.Title LIKE ?
           OR d.Content LIKE ?
           OR d.Tags LIKE ?
           OR d.SourceUrl LIKE ?
        ORDER BY d.UpdatedAt DESC, d.DocumentId DESC;
        """,
        (pattern, pattern, pattern, pattern),
    )


def document_exists(document_id: int) -> bool:
    row = fetch_one(
        "SELECT COUNT(*) AS count FROM dbo.StudyDocuments WHERE DocumentId = ?;",
        (document_id,),
    )
    return bool(row and row["count"] > 0)


def get_document(document_id: int):
    document = fetch_one(
        """
        SELECT
            DocumentId AS id,
            Title AS title,
            SourceUrl AS sourceUrl,
            Tags AS tags,
            Content AS content,
            LEN(Content) AS characterCount,
            CONVERT(NVARCHAR(19), CreatedAt, 120) AS createdAt,
            CONVERT(NVARCHAR(19), UpdatedAt, 120) AS updatedAt
        FROM dbo.StudyDocuments
        WHERE DocumentId = ?;
        """,
        (document_id,),
    )
    if not document:
        return None

    document["links"] = list_document_links(document_id)
    return document


def list_document_links(document_id: int):
    return fetch_all(
        """
        SELECT
            DocumentLinkId AS id,
            Label AS label,
            Url AS url
        FROM dbo.StudyDocumentLinks
        WHERE DocumentId = ?
        ORDER BY DocumentLinkId;
        """,
        (document_id,),
    )


def create_document(title: str, source_url: str | None, tags: str | None, content: str, links: list[dict]):
    with get_connection() as connection:
        cursor = connection.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO dbo.StudyDocuments (Title, SourceUrl, Tags, Content)
                OUTPUT INSERTED.DocumentId
                VALUES (?, ?, ?, ?);
                """,
                (title, source_url, tags, content),
            )
            document_id = int(cursor.fetchone()[0])
            _insert_document_links(cursor, document_id, links)
            connection.commit()
            return document_id
        except Exception:
            connection.rollback()
            raise


def update_document(document_id: int, title: str, source_url: str | None, tags: str | None, content: str, links: list[dict]):
    with get_connection() as connection:
        cursor = connection.cursor()
        try:
            cursor.execute(
                """
                UPDATE dbo.StudyDocuments
                SET
                    Title = ?,
                    SourceUrl = ?,
                    Tags = ?,
                    Content = ?,
                    UpdatedAt = SYSUTCDATETIME()
                WHERE DocumentId = ?;
                """,
                (title, source_url, tags, content, document_id),
            )
            cursor.execute("DELETE FROM dbo.StudyDocumentLinks WHERE DocumentId = ?;", (document_id,))
            _insert_document_links(cursor, document_id, links)
            connection.commit()
        except Exception:
            connection.rollback()
            raise


def delete_document(document_id: int):
    execute_transaction(
        [
            ("DELETE FROM dbo.StudyDocumentLinks WHERE DocumentId = ?;", (document_id,)),
            ("DELETE FROM dbo.StudyDocuments WHERE DocumentId = ?;", (document_id,)),
        ]
    )


def _insert_document_links(cursor, document_id: int, links: list[dict]):
    seen: set[str] = set()
    for link in links[:30]:
        label = str(link.get("label", "")).strip()
        url = str(link.get("url", "")).strip()
        if not label or not url or url in seen:
            continue
        seen.add(url)
        cursor.execute(
            """
            INSERT INTO dbo.StudyDocumentLinks (DocumentId, Label, Url)
            VALUES (?, ?, ?);
            """,
            (document_id, label[:250], url[:1000]),
        )
