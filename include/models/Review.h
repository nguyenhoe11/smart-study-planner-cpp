#pragma once

#include <string>

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

