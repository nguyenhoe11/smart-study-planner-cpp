#pragma once

#include <string>

std::wstring readLine(const std::wstring& prompt);

int readInt(const std::wstring& prompt, int defaultValue);

std::wstring escapeSql(const std::wstring& value);