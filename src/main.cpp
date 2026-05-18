#include "DbConnection.h"

#include <iostream>
#include <limits>
#include <string>

int showMenu() {
    std::wcout << L"\nSmart Study Planner\n";
    std::wcout << L"1. List flashcards\n";
    std::wcout << L"2. Add flashcard\n";
    std::wcout << L"3. Review due flashcards\n";
    std::wcout << L"4. Show weak topics\n";
    std::wcout << L"5. Exit\n";
    std::wcout << L"Choose: ";

    int choice = 0;
    std::wcin >> choice;
    std::wcin.ignore(std::numeric_limits<std::streamsize>::max(), L'\n');
    return choice;
}

std::wstring readLine(const std::wstring& prompt) {
    std::wcout << prompt;
    std::wstring value;
    std::getline(std::wcin, value);
    return value;
}

int readInt(const std::wstring& prompt, int defaultValue) {
    std::wcout << prompt;

    int value = defaultValue;
    if (!(std::wcin >> value)) {
        std::wcin.clear();
        value = defaultValue;
    }

    std::wcin.ignore(std::numeric_limits<std::streamsize>::max(), L'\n');
    return value;
}

std::wstring escapeSql(const std::wstring& value) {
    std::wstring escaped;
    escaped.reserve(value.size());

    for (wchar_t ch : value) {
        escaped.push_back(ch);
        if (ch == L'\'') {
            escaped.push_back(L'\'');
        }
    }

    return escaped;
}

void listFlashcards(DbConnection& db) {
    auto rows = db.query(
        L"SELECT "
        L"f.FlashcardId, "
        L"s.Name AS SubjectName, "
        L"t.Name AS TopicName, "
        L"f.Question, "
        L"f.Difficulty, "
        L"CONVERT(NVARCHAR(19), f.NextReviewAt, 120) "
        L"FROM dbo.Flashcards f "
        L"JOIN dbo.Topics t ON f.TopicId = t.TopicId "
        L"JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId "
        L"ORDER BY f.FlashcardId;"
    );

    std::wcout << L"\nFlashcards\n";

    for (const auto& row : rows) {
        std::wcout << L"#" << row[0]
                   << L" [" << row[1] << L" / " << row[2] << L"] "
                   << row[3]
                   << L" (difficulty " << row[4]
                   << L", next review " << row[5] << L")\n";
    }

    if (rows.empty()) {
        std::wcout << L"No flashcards found.\n";
    }
}

void listTopics(DbConnection& db) {
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

    std::wcout << L"\nTopics\n";
    for (const auto& row : rows) {
        std::wcout << L"#" << row[0]
                   << L" [" << row[1] << L"] "
                   << row[2]
                   << L" (priority " << row[3] << L")\n";
    }
}

void addFlashcard(DbConnection& db) {
    listTopics(db);

    int topicId = readInt(L"\nTopic ID: ", 0);
    std::wstring question = readLine(L"Question: ");
    std::wstring answer = readLine(L"Answer: ");
    int difficulty = readInt(L"Difficulty (1 easy - 5 hard): ", 3);

    if (topicId <= 0 || question.empty() || answer.empty()) {
        std::wcout << L"Missing topic, question, or answer. Flashcard not created.\n";
        return;
    }

    if (difficulty < 1) {
        difficulty = 1;
    } else if (difficulty > 5) {
        difficulty = 5;
    }

    std::wstring sql =
        L"INSERT INTO dbo.Flashcards (TopicId, Question, Answer, Difficulty) VALUES (" +
        std::to_wstring(topicId) + L", N'" +
        escapeSql(question) + L"', N'" +
        escapeSql(answer) + L"', " +
        std::to_wstring(difficulty) + L");";

    db.execute(sql);
    std::wcout << L"Flashcard created.\n";
}

void reviewDueFlashcards(DbConnection& db) {
    auto rows = db.query(
        L"SELECT TOP 10 "
        L"f.FlashcardId, "
        L"s.Name AS SubjectName, "
        L"t.Name AS TopicName, "
        L"f.Question, "
        L"f.Answer "
        L"FROM dbo.Flashcards f "
        L"JOIN dbo.Topics t ON f.TopicId = t.TopicId "
        L"JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId "
        L"WHERE f.NextReviewAt <= SYSUTCDATETIME() "
        L"ORDER BY f.Difficulty DESC, f.NextReviewAt ASC;"
    );

    if (rows.empty()) {
        std::wcout << L"No flashcards are due right now.\n";
        return;
    }

    for (const auto& row : rows) {
        std::wcout << L"\n#" << row[0]
                   << L" [" << row[1] << L" / " << row[2] << L"]\n";
        std::wcout << L"Q: " << row[3] << L"\n";

        readLine(L"Press Enter to show answer...");

        std::wcout << L"A: " << row[4] << L"\n";
        std::wstring result = readLine(L"Correct? (y/n): ");
        bool wasCorrect = !result.empty() && (result[0] == L'y' || result[0] == L'Y');

        std::wstring flashcardId = row[0];
        std::wstring sql =
            L"INSERT INTO dbo.ReviewLogs (FlashcardId, WasCorrect) VALUES (" +
            flashcardId + L", " + (wasCorrect ? L"1" : L"0") + L");"
            L"UPDATE dbo.Flashcards "
            L"SET ReviewIntervalDays = CASE "
            L"WHEN " + std::wstring(wasCorrect ? L"1" : L"0") + L" = 1 THEN "
            L"CASE WHEN ReviewIntervalDays * 2 > 30 THEN 30 ELSE ReviewIntervalDays * 2 END "
            L"ELSE 1 END, "
            L"NextReviewAt = DATEADD(day, CASE "
            L"WHEN " + std::wstring(wasCorrect ? L"1" : L"0") + L" = 1 THEN "
            L"CASE WHEN ReviewIntervalDays * 2 > 30 THEN 30 ELSE ReviewIntervalDays * 2 END "
            L"ELSE 1 END, SYSUTCDATETIME()) "
            L"WHERE FlashcardId = " + flashcardId + L";";

        db.execute(sql);
        std::wcout << L"Review saved.\n";
    }
}

void showWeakTopics(DbConnection& db) {
    auto rows = db.query(
        L"SELECT TOP 10 "
        L"s.Name AS SubjectName, "
        L"t.Name AS TopicName, "
        L"COUNT(rl.ReviewLogId) AS ReviewCount, "
        L"SUM(CASE WHEN rl.WasCorrect = 0 THEN 1 ELSE 0 END) AS WrongCount, "
        L"CAST(100.0 * SUM(CASE WHEN rl.WasCorrect = 0 THEN 1 ELSE 0 END) / COUNT(rl.ReviewLogId) AS DECIMAL(5,2)) AS WrongRate "
        L"FROM dbo.ReviewLogs rl "
        L"JOIN dbo.Flashcards f ON rl.FlashcardId = f.FlashcardId "
        L"JOIN dbo.Topics t ON f.TopicId = t.TopicId "
        L"JOIN dbo.Subjects s ON t.SubjectId = s.SubjectId "
        L"GROUP BY s.Name, t.Name "
        L"HAVING COUNT(rl.ReviewLogId) > 0 "
        L"ORDER BY WrongRate DESC, ReviewCount DESC;"
    );

    std::wcout << L"\nWeak Topics\n";

    for (const auto& row : rows) {
        std::wcout << L"[" << row[0] << L"] " << row[1]
                   << L" - reviews: " << row[2]
                   << L", wrong: " << row[3]
                   << L", wrong rate: " << row[4] << L"%\n";
    }

    if (rows.empty()) {
        std::wcout << L"No review history yet. Review some flashcards first.\n";
    }
}

int wmain(int argc, wchar_t* argv[]) {
    std::wstring server = L"HOANE\\SQLEXPRESS";
    std::wstring database = L"SmartStudyPlanner";
    std::wstring driver = L"ODBC Driver 18 for SQL Server";
    std::wstring user;
    std::wstring password;

    for (int i = 1; i < argc; ++i) {
        std::wstring arg = argv[i];
        if (arg == L"--server" && i + 1 < argc) {
            server = argv[++i];
        } else if (arg == L"--database" && i + 1 < argc) {
            database = argv[++i];
        } else if (arg == L"--driver" && i + 1 < argc) {
            driver = argv[++i];
        } else if (arg == L"--user" && i + 1 < argc) {
            user = argv[++i];
        } else if (arg == L"--password" && i + 1 < argc) {
            password = argv[++i];
        }
    }

    std::wstring connectionString =
        L"Driver={" + driver + L"};"
        L"Server=" + server + L";"
        L"Database=" + database + L";"
        L"Encrypt=no;"
        L"TrustServerCertificate=yes;";

    if (user.empty()) {
        connectionString += L"Trusted_Connection=yes;";
    } else {
        connectionString += L"UID=" + user + L";PWD=" + password + L";";
    }

    try {
        DbConnection db;
        db.connect(connectionString);

        std::wcout << L"Connected to SQL Server: " << server << L"\n";

        auto rows = db.query(L"SELECT COUNT(*) FROM dbo.Flashcards;");
        if (!rows.empty() && !rows.front().empty()) {
            std::wcout << L"Flashcards in database: " << rows.front().front() << L"\n";
        }

        bool running = true;
        while (running) {
            int choice = showMenu();

            switch (choice) {
            case 1:
                listFlashcards(db);
                break;
            case 2:
                addFlashcard(db);
                break;
            case 3:
                reviewDueFlashcards(db);
                break;
            case 4:
                showWeakTopics(db);
                break;
            case 5:
                running = false;
                break;
            default:
                std::wcout << L"Invalid choice.\n";
                break;
            }
        }
    } catch (const std::exception& ex) {
        std::cerr << ex.what() << "\n";
        std::cerr << "Tip: create the database with sql/schema.sql and confirm SSMS can connect to HOANE\\SQLEXPRESS.\n";
        return 1;
    }

    return 0;
}
