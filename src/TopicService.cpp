#include "TopicService.h"
#include "TopicRepository.h"

#include <iostream>

void TopicService::listTopics(DbConnection& db) {
    auto topics = TopicRepository::getAll(db);

    std::wcout << L"\nTopics\n";
    for (const auto& topic : topics) {
        std::wcout << L"#" << topic.id
                   << L" [" << topic.subjectName << L"] "
                   << topic.name
                   << L" (priority " << topic.priority << L")\n";
    }

    if (topics.empty()) {
        std::wcout << L"No topics found.\n";
    }
}

