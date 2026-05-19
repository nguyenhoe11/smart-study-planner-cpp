#pragma once

#include "DbConnection.h"

class TopicService {
public:
    static void listTopics(DbConnection& db);
};

