#include "FlashcardRepository.h"
#include "Utils.h"

namespace {
std::vector<Flashcard> mapFlashcards(const std::vector<std::vector<std::wstring>>& rows) {
    std::vector<Flashcard> flashcards;

    for (const auto& row : rows) {
        Flashcard flashcard;

        flashcard.id = std::stoi(row[0]);
        flashcard.subjectName = row[1];
        flashcard.topicName = row[2];
        flashcard.question = row[3];
        flashcard.answer = row[4];
        flashcard.difficulty = std::stoi(row[5]);
        flashcard.nextReviewAt = row[6];

        flashcards.push_back(flashcard);
    }

    return flashcards;
}
}

std::vector<Flashcard> FlashcardRepository::getAll(DbConnection& db) {
    return mapFlashcards(db.query(
        L"SELECT "
        L"f.FlashcardId, "
        L"s.Name AS SubjectName, "
        L"t.Name AS TopicName, "
        L"f.Question, "
        L"f.Answer, "
        L"f.Difficulty, "
        L"CONVERT(NVARCHAR(19), f.NextReviewAt, 120) "
        L"FROM dbo.Flashcards f "
        L"JOIN dbo.Topics t ON f.TopicId = t.TopicId "
        L"JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId "
        L"ORDER BY f.FlashcardId;"
    ));
}

std::vector<Flashcard> FlashcardRepository::search(DbConnection& db, const std::wstring& keyword) {
    std::wstring pattern = L"N'%" + escapeSql(keyword) + L"%'";

    return mapFlashcards(db.query(
        L"SELECT "
        L"f.FlashcardId, "
        L"s.Name AS SubjectName, "
        L"t.Name AS TopicName, "
        L"f.Question, "
        L"f.Answer, "
        L"f.Difficulty, "
        L"CONVERT(NVARCHAR(19), f.NextReviewAt, 120) "
        L"FROM dbo.Flashcards f "
        L"JOIN dbo.Topics t ON f.TopicId = t.TopicId "
        L"JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId "
        L"WHERE f.Question LIKE " + pattern + L" "
        L"OR f.Answer LIKE " + pattern + L" "
        L"OR t.Name LIKE " + pattern + L" "
        L"OR s.Name LIKE " + pattern + L" "
        L"ORDER BY f.FlashcardId;"
    ));
}

bool FlashcardRepository::exists(DbConnection& db, int flashcardId) {
    auto rows = db.query(
        L"SELECT COUNT(*) FROM dbo.Flashcards WHERE FlashcardId = " +
        std::to_wstring(flashcardId) + L";"
    );

    return !rows.empty() && !rows[0].empty() && std::stoi(rows[0][0]) > 0;
}

void FlashcardRepository::create(DbConnection& db, int topicId, const std::wstring& question, const std::wstring& answer, int difficulty) {
    std::wstring sql =
        L"INSERT INTO dbo.Flashcards (TopicId, Question, Answer, Difficulty) VALUES (" +
        std::to_wstring(topicId) + L", N'" +
        escapeSql(question) + L"', N'" +
        escapeSql(answer) + L"', " +
        std::to_wstring(difficulty) + L");";

    db.execute(sql);
}

void FlashcardRepository::update(DbConnection& db, int flashcardId, const std::wstring& question, const std::wstring& answer, int difficulty) {
    std::wstring sql =
        L"UPDATE dbo.Flashcards SET "
        L"Question = N'" + escapeSql(question) + L"', "
        L"Answer = N'" + escapeSql(answer) + L"', "
        L"Difficulty = " + std::to_wstring(difficulty) + L" "
        L"WHERE FlashcardId = " + std::to_wstring(flashcardId) + L";";

    db.execute(sql);
}

void FlashcardRepository::remove(DbConnection& db, int flashcardId) {
    db.execute(L"DELETE FROM dbo.ReviewLogs WHERE FlashcardId = " + std::to_wstring(flashcardId) + L";");
    db.execute(L"DELETE FROM dbo.Flashcards WHERE FlashcardId = " + std::to_wstring(flashcardId) + L";");
}
