#pragma once

#include <string>

struct Flashcard {
    int id;

    std::wstring subjectName;

    std::wstring topicName;

    std::wstring question;

    std::wstring answer;

    int difficulty;

    std::wstring nextReviewAt;
};