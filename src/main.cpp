#include "DbConnection.h"

#include <iostream>
#include <string>

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

        std::wcout << L"Starter app is ready.\n";
    } catch (const std::exception& ex) {
        std::cerr << ex.what() << "\n";
        std::cerr << "Tip: create the database with sql/schema.sql and confirm SSMS can connect to .\\SQLEXPRESS.\n";
        return 1;
    }

    return 0;
}
