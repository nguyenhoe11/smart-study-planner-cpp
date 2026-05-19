#pragma once

#include "DbConnection.h"

class FlashcardService {
public:
    static void listFlashcards(DbConnection& db);
    static void searchFlashcards(DbConnection& db);

    static void addFlashcard(DbConnection& db);

    static void editFlashcard(DbConnection& db);

    static void deleteFlashcard(DbConnection& db);
};
