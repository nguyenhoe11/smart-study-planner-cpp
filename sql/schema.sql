IF DB_ID(N'SmartStudyPlanner') IS NULL
BEGIN
    CREATE DATABASE SmartStudyPlanner;
END;
GO

USE SmartStudyPlanner;
GO

IF OBJECT_ID(N'dbo.ReviewLogs', N'U') IS NOT NULL DROP TABLE dbo.ReviewLogs;
IF OBJECT_ID(N'dbo.Flashcards', N'U') IS NOT NULL DROP TABLE dbo.Flashcards;
IF OBJECT_ID(N'dbo.Topics', N'U') IS NOT NULL DROP TABLE dbo.Topics;
IF OBJECT_ID(N'dbo.Subjects', N'U') IS NOT NULL DROP TABLE dbo.Subjects;
GO

CREATE TABLE dbo.Subjects (
    SubjectId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL UNIQUE,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.Topics (
    TopicId INT IDENTITY(1,1) PRIMARY KEY,
    SubjectId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Priority TINYINT NOT NULL DEFAULT 3,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Topics_Subjects FOREIGN KEY (SubjectId) REFERENCES dbo.Subjects(SubjectId),
    CONSTRAINT UQ_Topics_Subject_Name UNIQUE (SubjectId, Name),
    CONSTRAINT CK_Topics_Priority CHECK (Priority BETWEEN 1 AND 5)
);

CREATE TABLE dbo.Flashcards (
    FlashcardId INT IDENTITY(1,1) PRIMARY KEY,
    TopicId INT NOT NULL,
    Question NVARCHAR(500) NOT NULL,
    Answer NVARCHAR(1000) NOT NULL,
    Difficulty TINYINT NOT NULL DEFAULT 3,
    NextReviewAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ReviewIntervalDays INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Flashcards_Topics FOREIGN KEY (TopicId) REFERENCES dbo.Topics(TopicId),
    CONSTRAINT CK_Flashcards_Difficulty CHECK (Difficulty BETWEEN 1 AND 5),
    CONSTRAINT CK_Flashcards_ReviewInterval CHECK (ReviewIntervalDays >= 1)
);

CREATE TABLE dbo.ReviewLogs (
    ReviewLogId INT IDENTITY(1,1) PRIMARY KEY,
    FlashcardId INT NOT NULL,
    ReviewedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    WasCorrect BIT NOT NULL,
    ResponseSeconds INT NULL,
    CONSTRAINT FK_ReviewLogs_Flashcards FOREIGN KEY (FlashcardId) REFERENCES dbo.Flashcards(FlashcardId),
    CONSTRAINT CK_ReviewLogs_ResponseSeconds CHECK (ResponseSeconds IS NULL OR ResponseSeconds >= 0)
);

CREATE INDEX IX_Flashcards_NextReviewAt ON dbo.Flashcards(NextReviewAt, Difficulty);
CREATE INDEX IX_ReviewLogs_FlashcardId_ReviewedAt ON dbo.ReviewLogs(FlashcardId, ReviewedAt DESC);
GO

