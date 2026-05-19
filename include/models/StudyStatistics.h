#pragma once

#include <string>

struct StudyStatistics {
    int totalFlashcards;
    int totalReviews;
    int correctCount;
    int wrongCount;
    std::wstring accuracy;
    int dueTodayCount;
};

