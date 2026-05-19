#include "TopicRepository.h"

std::vector<Topic> TopicRepository::getAll(DbConnection& db) {
    auto rows = db.query(
        L"SELECT "
        L"t.TopicId, "
        L"s.Name AS SubjectName, "
        L"t.Name AS TopicName, "
        L"t.Priority "
        L"FROM dbo.Topics t "
        L"JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId "
        L"ORDER BY s.Name, t.Name;"
    );

    std::vector<Topic> topics;
    for (const auto& row : rows) {
        Topic topic;
        topic.id = std::stoi(row[0]);
        topic.subjectName = row[1];
        topic.name = row[2];
        topic.priority = std::stoi(row[3]);
        topics.push_back(topic);
    }

    return topics;
}

bool TopicRepository::exists(DbConnection& db, int topicId) {
    auto rows = db.query(
        L"SELECT COUNT(*) FROM dbo.Topics WHERE TopicId = " +
        std::to_wstring(topicId) + L";"
    );

    return !rows.empty() && !rows[0].empty() && std::stoi(rows[0][0]) > 0;
}

