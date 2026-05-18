#include "DbConnection.h"

#include <stdexcept>

namespace {
std::string narrow(const std::wstring& value) {
    std::string result;
    result.reserve(value.size());
    for (wchar_t ch : value) {
        result.push_back(ch < 128 ? static_cast<char>(ch) : '?');
    }
    return result;
}
}

DbConnection::DbConnection() : env_(SQL_NULL_HENV), dbc_(SQL_NULL_HDBC), connected_(false) {
    SQLRETURN ret = SQLAllocHandle(SQL_HANDLE_ENV, SQL_NULL_HANDLE, &env_);
    if (!SQL_SUCCEEDED(ret)) {
        throw std::runtime_error("Could not allocate ODBC environment handle.");
    }

    ret = SQLSetEnvAttr(env_, SQL_ATTR_ODBC_VERSION, reinterpret_cast<void*>(SQL_OV_ODBC3), 0);
    throwIfFailed(ret, SQL_HANDLE_ENV, env_, "set ODBC version");

    ret = SQLAllocHandle(SQL_HANDLE_DBC, env_, &dbc_);
    throwIfFailed(ret, SQL_HANDLE_ENV, env_, "allocate ODBC connection handle");
}

DbConnection::~DbConnection() {
    disconnect();
    if (dbc_ != SQL_NULL_HDBC) {
        SQLFreeHandle(SQL_HANDLE_DBC, dbc_);
    }
    if (env_ != SQL_NULL_HENV) {
        SQLFreeHandle(SQL_HANDLE_ENV, env_);
    }
}

void DbConnection::connect(const std::wstring& connectionString) {
    SQLWCHAR outConnectionString[1024];
    SQLSMALLINT outLength = 0;

    SQLRETURN ret = SQLDriverConnectW(
        dbc_,
        nullptr,
        reinterpret_cast<SQLWCHAR*>(const_cast<wchar_t*>(connectionString.c_str())),
        SQL_NTS,
        outConnectionString,
        static_cast<SQLSMALLINT>(std::size(outConnectionString)),
        &outLength,
        SQL_DRIVER_NOPROMPT
    );

    throwIfFailed(ret, SQL_HANDLE_DBC, dbc_, "connect to SQL Server");
    connected_ = true;
}

void DbConnection::disconnect() {
    if (connected_) {
        SQLDisconnect(dbc_);
        connected_ = false;
    }
}

bool DbConnection::isConnected() const {
    return connected_;
}

std::vector<std::vector<std::wstring>> DbConnection::query(const std::wstring& sql) {
    SQLHSTMT stmt = SQL_NULL_HSTMT;
    SQLRETURN ret = SQLAllocHandle(SQL_HANDLE_STMT, dbc_, &stmt);
    throwIfFailed(ret, SQL_HANDLE_DBC, dbc_, "allocate statement handle");

    ret = SQLExecDirectW(stmt, reinterpret_cast<SQLWCHAR*>(const_cast<wchar_t*>(sql.c_str())), SQL_NTS);
    if (!SQL_SUCCEEDED(ret)) {
        throwIfFailed(ret, SQL_HANDLE_STMT, stmt, "execute query");
    }

    SQLSMALLINT columnCount = 0;
    ret = SQLNumResultCols(stmt, &columnCount);
    throwIfFailed(ret, SQL_HANDLE_STMT, stmt, "read result column count");

    std::vector<std::vector<std::wstring>> rows;
    while ((ret = SQLFetch(stmt)) != SQL_NO_DATA) {
        throwIfFailed(ret, SQL_HANDLE_STMT, stmt, "fetch row");

        std::vector<std::wstring> row;
        for (SQLUSMALLINT col = 1; col <= columnCount; ++col) {
            wchar_t buffer[512];
            SQLLEN indicator = 0;
            ret = SQLGetData(stmt, col, SQL_C_WCHAR, buffer, sizeof(buffer), &indicator);
            throwIfFailed(ret, SQL_HANDLE_STMT, stmt, "read column data");

            row.emplace_back(indicator == SQL_NULL_DATA ? L"NULL" : buffer);
        }
        rows.push_back(row);
    }

    SQLFreeHandle(SQL_HANDLE_STMT, stmt);
    return rows;
}

void DbConnection::execute(const std::wstring& sql) {
    SQLHSTMT stmt = SQL_NULL_HSTMT;
    SQLRETURN ret = SQLAllocHandle(SQL_HANDLE_STMT, dbc_, &stmt);
    throwIfFailed(ret, SQL_HANDLE_DBC, dbc_, "allocate statement handle");

    ret = SQLExecDirectW(stmt, reinterpret_cast<SQLWCHAR*>(const_cast<wchar_t*>(sql.c_str())), SQL_NTS);
    if (!SQL_SUCCEEDED(ret)) {
        throwIfFailed(ret, SQL_HANDLE_STMT, stmt, "execute statement");
    }

    SQLFreeHandle(SQL_HANDLE_STMT, stmt);
}

void DbConnection::throwIfFailed(SQLRETURN ret, SQLSMALLINT handleType, SQLHANDLE handle, const std::string& action) const {
    if (SQL_SUCCEEDED(ret)) {
        return;
    }

    SQLWCHAR state[6];
    SQLWCHAR message[SQL_MAX_MESSAGE_LENGTH];
    SQLINTEGER nativeError = 0;
    SQLSMALLINT messageLength = 0;

    SQLRETURN diagRet = SQLGetDiagRecW(handleType, handle, 1, state, &nativeError, message, SQL_MAX_MESSAGE_LENGTH, &messageLength);
    if (SQL_SUCCEEDED(diagRet)) {
        throw std::runtime_error("Failed to " + action + ": [" + narrow(state) + "] " + narrow(message));
    }

    throw std::runtime_error("Failed to " + action + ".");
}

