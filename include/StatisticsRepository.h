#pragma once

#include "DbConnection.h"
#include "models/StudyStatistics.h"

class StatisticsRepository {
public:
    static StudyStatistics getStudyStatistics(DbConnection& db);
};
