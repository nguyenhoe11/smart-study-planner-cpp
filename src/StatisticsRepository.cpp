#include "StatisticsRepository.h"

namespace {
int readIntResult(DbConnection& db, const std::wstring& sql) {
    auto rows = db.query(sql);
    if (rows.empty() || rows[0].empty()) {
        return 0;
    }
    return std::stoi(rows[0][0]);
}
}

StudyStatistics StatisticsRepository::getStudyStatistics(DbConnection& db) {
    StudyStatistics stats;

    stats.totalFlashcards = readIntResult(db, L"SELECT COUNT(*) FROM dbo.Flashcards;");
    stats.totalReviews = readIntResult(db, L"SELECT COUNT(*) FROM dbo.ReviewLogs;");
    stats.correctCount = readIntResult(db, L"SELECT COUNT(*) FROM dbo.ReviewLogs WHERE WasCorrect = 1;");
    stats.wrongCount = readIntResult(db, L"SELECT COUNT(*) FROM dbo.ReviewLogs WHERE WasCorrect = 0;");
    stats.dueTodayCount = readIntResult(db, L"SELECT COUNT(*) FROM dbo.Flashcards WHERE NextReviewAt <= SYSUTCDATETIME();");

    if (stats.totalReviews == 0) {
        stats.accuracy = L"0.00";
    } else {
        auto rows = db.query(
            L"SELECT CAST(100.0 * SUM(CASE WHEN WasCorrect = 1 THEN 1 ELSE 0 END) / COUNT(*) AS DECIMAL(5,2)) "
            L"FROM dbo.ReviewLogs;"
        );
        stats.accuracy = rows.empty() || rows[0].empty() ? L"0.00" : rows[0][0];
    }

    return stats;
}

