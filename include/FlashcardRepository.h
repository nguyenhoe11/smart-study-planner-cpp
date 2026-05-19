#pragma once

#include "DbConnection.h"
#include "models/Flashcard.h"

#include <string>
#include <vector>

class FlashcardRepository {
public:
    static std::vector<Flashcard> getAll(DbConnection& db);
    static std::vector<Flashcard> search(DbConnection& db, const std::wstring& keyword);
    static bool exists(DbConnection& db, int flashcardId);
    static void create(DbConnection& db, int topicId, const std::wstring& question, const std::wstring& answer, int difficulty);
    static void update(DbConnection& db, int flashcardId, const std::wstring& question, const std::wstring& answer, int difficulty);
    static void remove(DbConnection& db, int flashcardId);
};
