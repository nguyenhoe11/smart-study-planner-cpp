#pragma once

#include <string>
#include <vector>

#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>

#include <sql.h>
#include <sqlext.h>

class DbConnection {
public:
    DbConnection();
    ~DbConnection();

    DbConnection(const DbConnection&) = delete;
    DbConnection& operator=(const DbConnection&) = delete;

    void connect(const std::wstring& connectionString);
    void disconnect();
    bool isConnected() const;

    std::vector<std::vector<std::wstring>> query(const std::wstring& sql);
    void execute(const std::wstring& sql);

private:
    SQLHENV env_;
    SQLHDBC dbc_;
    bool connected_;

    void throwIfFailed(SQLRETURN ret, SQLSMALLINT handleType, SQLHANDLE handle, const std::string& action) const;
};
