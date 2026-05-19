#include "FlashcardService.h"
#include "FlashcardRepository.h"
#include "TopicRepository.h"
#include "TopicService.h"
#include "Utils.h"
#include "models/Flashcard.h"

#include <iostream>
#include <vector>

namespace {
void printFlashcards(const std::vector<Flashcard>& flashcards) {
    std::wcout << L"\nFlashcards\n";

    for (const auto& flashcard : flashcards) {
        std::wcout << L"#" << flashcard.id
                   << L" [" << flashcard.subjectName << L" / " << flashcard.topicName << L"] "
                   << flashcard.question
                   << L" (difficulty " << flashcard.difficulty
                   << L", next review " << flashcard.nextReviewAt << L")\n";
    }

    if (flashcards.empty()) {
        std::wcout << L"No flashcards found.\n";
    }
}

int normalizeDifficulty(int difficulty) {
    if (difficulty < 1) {
        return 1;
    }
    if (difficulty > 5) {
        return 5;
    }
    return difficulty;
}
}

void FlashcardService::listFlashcards(DbConnection& db) {
    printFlashcards(FlashcardRepository::getAll(db));
}

void FlashcardService::searchFlashcards(DbConnection& db) {
    std::wstring keyword = readLine(L"\nSearch keyword: ");
    if (keyword.empty()) {
        std::wcout << L"Keyword cannot be empty.\n";
        return;
    }

    printFlashcards(FlashcardRepository::search(db, keyword));
}

void FlashcardService::addFlashcard(DbConnection& db) {
    TopicService::listTopics(db);

    int topicId = readInt(L"\nTopic ID: ", 0);
    if (!TopicRepository::exists(db, topicId)) {
        std::wcout << L"Topic not found.\n";
        return;
    }

    std::wstring question = readLine(L"Question: ");
    std::wstring answer = readLine(L"Answer: ");
    int difficulty = normalizeDifficulty(readInt(L"Difficulty (1 easy - 5 hard): ", 3));

    if (question.empty() || answer.empty()) {
        std::wcout << L"Question or answer cannot be empty. Flashcard not created.\n";
        return;
    }

    FlashcardRepository::create(db, topicId, question, answer, difficulty);
    std::wcout << L"Flashcard created.\n";
}

void FlashcardService::editFlashcard(DbConnection& db) {
    listFlashcards(db);

    int flashcardId = readInt(L"\nFlashcard ID to edit: ", 0);
    if (flashcardId <= 0) {
        std::wcout << L"Invalid flashcard ID.\n";
        return;
    }
    if (!FlashcardRepository::exists(db, flashcardId)) {
        std::wcout << L"Flashcard not found.\n";
        return;
    }

    std::wstring question = readLine(L"New question: ");
    std::wstring answer = readLine(L"New answer: ");
    int difficulty = normalizeDifficulty(readInt(L"New difficulty (1 easy - 5 hard): ", 3));

    if (question.empty() || answer.empty()) {
        std::wcout << L"Question or answer cannot be empty.\n";
        return;
    }

    FlashcardRepository::update(db, flashcardId, question, answer, difficulty);
    std::wcout << L"Flashcard updated.\n";
}

void FlashcardService::deleteFlashcard(DbConnection& db) {
    listFlashcards(db);

    int flashcardId = readInt(L"\nFlashcard ID to delete: ", 0);
    if (flashcardId <= 0) {
        std::wcout << L"Invalid flashcard ID.\n";
        return;
    }
    if (!FlashcardRepository::exists(db, flashcardId)) {
        std::wcout << L"Flashcard not found.\n";
        return;
    }

    std::wstring confirm = readLine(L"Are you sure? (y/n): ");
    if (confirm.empty() || (confirm[0] != L'y' && confirm[0] != L'Y')) {
        std::wcout << L"Delete cancelled.\n";
        return;
    }

    FlashcardRepository::remove(db, flashcardId);
    std::wcout << L"Flashcard deleted.\n";
}
