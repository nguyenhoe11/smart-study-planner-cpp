#include "Utils.h"

#include <iostream>
#include <limits>

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