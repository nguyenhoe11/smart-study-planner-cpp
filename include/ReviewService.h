#pragma once
#include <iostream>
#include "DbConnection.h"

class ReviewService {
public:
    static void reviewDueFlashcards(DbConnection& db);
    static void showWeakTopics(DbConnection& db);

};