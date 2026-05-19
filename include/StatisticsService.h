#pragma once

#include "DbConnection.h"

class StatisticsService {
public:
    static void showStudyStatistics(DbConnection& db);
};

