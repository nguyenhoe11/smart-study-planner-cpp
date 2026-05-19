#pragma once

#include "DbConnection.h"

#include <string>
#include <vector>

struct DueReview {
    int flashcardId;
    std::wstring subjectName;
    std::wstring topicName;
    std::wstring question;
    std::wstring answer;
};

struct WeakTopic {
    std::wstring subjectName;
    std::wstring topicName;
    int reviewCount;
    int wrongCount;
    std::wstring wrongRate;
};

class ReviewRepository {
public:
    static std::vector<DueReview> getDueFlashcards(DbConnection& db);
    static void saveReview(DbConnection& db, int flashcardId, bool wasCorrect);
    static std::vector<WeakTopic> getWeakTopics(DbConnection& db);
};

