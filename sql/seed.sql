USE SmartStudyPlanner;
GO

INSERT INTO dbo.Subjects (Name)
VALUES (N'Database'), (N'C++ Algorithms');

INSERT INTO dbo.Topics (SubjectId, Name, Priority)
SELECT SubjectId, N'SQL Joins', 5 FROM dbo.Subjects WHERE Name = N'Database'
UNION ALL
SELECT SubjectId, N'Normalization', 4 FROM dbo.Subjects WHERE Name = N'Database'
UNION ALL
SELECT SubjectId, N'Binary Search', 4 FROM dbo.Subjects WHERE Name = N'C++ Algorithms'
UNION ALL
SELECT SubjectId, N'Priority Queue', 5 FROM dbo.Subjects WHERE Name = N'C++ Algorithms';

INSERT INTO dbo.Flashcards (TopicId, Question, Answer, Difficulty)
SELECT TopicId, N'INNER JOIN khac LEFT JOIN o diem nao?', N'INNER JOIN chi lay dong match ca hai bang; LEFT JOIN lay tat ca dong ben trai va NULL neu ben phai khong match.', 3
FROM dbo.Topics WHERE Name = N'SQL Joins'
UNION ALL
SELECT TopicId, N'1NF yeu cau dieu gi?', N'Moi cell chua gia tri atomic, khong lap nhom cot va moi dong co the dinh danh rieng.', 3
FROM dbo.Topics WHERE Name = N'Normalization'
UNION ALL
SELECT TopicId, N'Dieu kien de dung binary search?', N'Du lieu phai duoc sap xep hoac khong gian dap an phai co tinh don dieu.', 2
FROM dbo.Topics WHERE Name = N'Binary Search'
UNION ALL
SELECT TopicId, N'Priority queue phu hop cho bai toan nao?', N'Bai toan can lay phan tu uu tien cao nhat/thap nhat lien tuc, nhu lap lich on tap theo muc do can on.', 2
FROM dbo.Topics WHERE Name = N'Priority Queue';
GO

