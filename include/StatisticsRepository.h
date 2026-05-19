#pragma once

#include "DbConnection.h"

#include <string>

struct StudyStatistics {
    int totalFlashcards;
    int totalReviews;
    int correctCount;
    int wrongCount;
    std::wstring accuracy;
    int dueTodayCount;
};

class StatisticsRepository {
public:
    static StudyStatistics getStudyStatistics(DbConnection& db);
};

