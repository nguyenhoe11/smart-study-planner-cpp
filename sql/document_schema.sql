USE SmartStudyPlanner;
GO

IF OBJECT_ID(N'dbo.StudyDocuments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StudyDocuments (
        DocumentId INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(250) NOT NULL,
        SourceUrl NVARCHAR(1000) NULL,
        Tags NVARCHAR(250) NULL,
        Content NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;

IF OBJECT_ID(N'dbo.StudyDocumentLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StudyDocumentLinks (
        DocumentLinkId INT IDENTITY(1,1) PRIMARY KEY,
        DocumentId INT NOT NULL,
        Label NVARCHAR(250) NOT NULL,
        Url NVARCHAR(1000) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_StudyDocumentLinks_Documents
            FOREIGN KEY (DocumentId) REFERENCES dbo.StudyDocuments(DocumentId)
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_StudyDocuments_UpdatedAt'
      AND object_id = OBJECT_ID(N'dbo.StudyDocuments')
)
BEGIN
    CREATE INDEX IX_StudyDocuments_UpdatedAt
    ON dbo.StudyDocuments(UpdatedAt DESC, DocumentId DESC);
END;
GO
