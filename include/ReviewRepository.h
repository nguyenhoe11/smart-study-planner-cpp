#pragma once

#include "DbConnection.h"
#include "models/Review.h"
#include <vector>

class ReviewRepository {
public:
    static std::vector<DueReview> getDueFlashcards(DbConnection& db);
    static void saveReview(DbConnection& db, int flashcardId, bool wasCorrect);
    static std::vector<WeakTopic> getWeakTopics(DbConnection& db);
};
