#pragma once

#include "DbConnection.h"
#include "models/Topic.h"

#include <vector>

class TopicRepository {
public:
    static std::vector<Topic> getAll(DbConnection& db);
    static bool exists(DbConnection& db, int topicId);
};

