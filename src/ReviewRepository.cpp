#include "ReviewRepository.h"

std::vector<DueReview> ReviewRepository::getDueFlashcards(DbConnection& db) {
    auto rows = db.query(
        L"SELECT TOP 10 "
        L"f.FlashcardId, "
        L"s.Name AS SubjectName, "
        L"t.Name AS TopicName, "
        L"f.Question, "
        L"f.Answer "
        L"FROM dbo.Flashcards f "
        L"JOIN dbo.Topics t ON f.TopicId = t.TopicId "
        L"JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId "
        L"WHERE f.NextReviewAt <= SYSUTCDATETIME() "
        L"ORDER BY f.Difficulty DESC, f.NextReviewAt ASC;"
    );

    std::vector<DueReview> reviews;
    for (const auto& row : rows) {
        DueReview review;
        review.flashcardId = std::stoi(row[0]);
        review.subjectName = row[1];
        review.topicName = row[2];
        review.question = row[3];
        review.answer = row[4];
        reviews.push_back(review);
    }

    return reviews;
}

void ReviewRepository::saveReview(DbConnection& db, int flashcardId, bool wasCorrect) {
    std::wstring correctValue = wasCorrect ? L"1" : L"0";

    db.execute(
        L"INSERT INTO dbo.ReviewLogs (FlashcardId, WasCorrect) VALUES (" +
        std::to_wstring(flashcardId) + L", " + correctValue + L");"
    );

    db.execute(
        L"UPDATE dbo.Flashcards "
        L"SET ReviewIntervalDays = CASE "
        L"WHEN " + correctValue + L" = 1 THEN "
        L"CASE WHEN ReviewIntervalDays * 2 > 30 THEN 30 ELSE ReviewIntervalDays * 2 END "
        L"ELSE 1 END, "
        L"NextReviewAt = DATEADD(day, CASE "
        L"WHEN " + correctValue + L" = 1 THEN "
        L"CASE WHEN ReviewIntervalDays * 2 > 30 THEN 30 ELSE ReviewIntervalDays * 2 END "
        L"ELSE 1 END, SYSUTCDATETIME()) "
        L"WHERE FlashcardId = " + std::to_wstring(flashcardId) + L";"
    );
}

std::vector<WeakTopic> ReviewRepository::getWeakTopics(DbConnection& db) {
    auto rows = db.query(
        L"SELECT TOP 10 "
        L"s.Name AS SubjectName, "
        L"t.Name AS TopicName, "
        L"COUNT(rl.ReviewLogId) AS ReviewCount, "
        L"SUM(CASE WHEN rl.WasCorrect = 0 THEN 1 ELSE 0 END) AS WrongCount, "
        L"CAST(100.0 * SUM(CASE WHEN rl.WasCorrect = 0 THEN 1 ELSE 0 END) / COUNT(rl.ReviewLogId) AS DECIMAL(5,2)) AS WrongRate "
        L"FROM dbo.ReviewLogs rl "
        L"JOIN dbo.Flashcards f ON rl.FlashcardId = f.FlashcardId "
        L"JOIN dbo.Topics t ON f.TopicId = t.TopicId "
        L"JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId "
        L"GROUP BY s.Name, t.Name "
        L"HAVING COUNT(rl.ReviewLogId) > 0 "
        L"ORDER BY WrongRate DESC, ReviewCount DESC;"
    );

    std::vector<WeakTopic> topics;
    for (const auto& row : rows) {
        WeakTopic topic;
        topic.subjectName = row[0];
        topic.topicName = row[1];
        topic.reviewCount = std::stoi(row[2]);
        topic.wrongCount = std::stoi(row[3]);
        topic.wrongRate = row[4];
        topics.push_back(topic);
    }

    return topics;
}

