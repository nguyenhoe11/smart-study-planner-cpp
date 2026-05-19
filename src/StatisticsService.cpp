#include "StatisticsService.h"
#include "StatisticsRepository.h"

#include <iostream>

void StatisticsService::showStudyStatistics(DbConnection& db) {
    auto stats = StatisticsRepository::getStudyStatistics(db);

    std::wcout << L"\nStudy Statistics\n";
    std::wcout << L"Total flashcards: " << stats.totalFlashcards << L"\n";
    std::wcout << L"Total reviews: " << stats.totalReviews << L"\n";
    std::wcout << L"Correct count: " << stats.correctCount << L"\n";
    std::wcout << L"Wrong count: " << stats.wrongCount << L"\n";
    std::wcout << L"Accuracy: " << stats.accuracy << L"%\n";
    std::wcout << L"Due today: " << stats.dueTodayCount << L"\n";
}

