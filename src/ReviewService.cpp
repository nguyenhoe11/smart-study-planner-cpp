#include "ReviewService.h"
#include "ReviewRepository.h"

#include <iostream>
#include <string>
#include "Utils.h"

void ReviewService::reviewDueFlashcards(DbConnection& db) {
    auto reviews = ReviewRepository::getDueFlashcards(db);

    if (reviews.empty()) {
        std::wcout << L"No flashcards are due right now.\n";
        return;
    }

    for (const auto& review : reviews) {
        std::wcout << L"\n#" << review.flashcardId
                   << L" [" << review.subjectName << L" / " << review.topicName << L"]\n";
        std::wcout << L"Q: " << review.question << L"\n";

        readLine(L"Press Enter to show answer...");

        std::wcout << L"A: " << review.answer << L"\n";
        std::wstring result = readLine(L"Correct? (y/n): ");
        bool wasCorrect = !result.empty() && (result[0] == L'y' || result[0] == L'Y');

        ReviewRepository::saveReview(db, review.flashcardId, wasCorrect);
        std::wcout << L"Review saved.\n";
    }
}

void ReviewService::showWeakTopics(DbConnection& db) {
    auto topics = ReviewRepository::getWeakTopics(db);

    std::wcout << L"\nWeak Topics\n";

    for (const auto& topic : topics) {
        std::wcout << L"[" << topic.subjectName << L"] " << topic.topicName
                   << L" - reviews: " << topic.reviewCount
                   << L", wrong: " << topic.wrongCount
                   << L", wrong rate: " << topic.wrongRate << L"%\n";
    }

    if (topics.empty()) {
        std::wcout << L"No review history yet. Review some flashcards first.\n";
    }
}
