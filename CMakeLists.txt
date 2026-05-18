cmake_minimum_required(VERSION 3.20)

project(SmartStudyPlanner LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(smart_study_planner
    src/DbConnection.cpp
    src/main.cpp
)

target_include_directories(smart_study_planner PRIVATE include)

if (WIN32)
    target_link_libraries(smart_study_planner PRIVATE odbc32)
else()
    message(FATAL_ERROR "This starter project currently targets Windows ODBC.")
endif()

