#include "Menu.h"

#include <iostream>
#include <limits>

int showMenu() {
    std::wcout << L"\nSmart Study Planner\n";
    std::wcout << L"1. List flashcards\n";
    std::wcout << L"2. Search flashcards\n";
    std::wcout << L"3. Add flashcard\n";
    std::wcout << L"4. Edit flashcard\n";
    std::wcout << L"5. Delete flashcard\n";
    std::wcout << L"6. Review due flashcards\n";
    std::wcout << L"7. Show weak topics\n";
    std::wcout << L"8. Show study statistics\n";
    std::wcout << L"9. Exit\n";
    std::wcout << L"Choose: ";

    int choice = 0;
    std::wcin >> choice;
    std::wcin.ignore(std::numeric_limits<std::streamsize>::max(), L'\n');
    return choice;
}
