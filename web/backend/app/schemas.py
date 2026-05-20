from pydantic import BaseModel, Field


class FlashcardCreate(BaseModel):
    topicId: int
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=1000)
    difficulty: int = Field(ge=1, le=5)


class FlashcardUpdate(BaseModel):
    topicId: int
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=1000)
    difficulty: int = Field(ge=1, le=5)


class ReviewCreate(BaseModel):
    flashcardId: int
    wasCorrect: bool


class WebImportRequest(BaseModel):
    url: str = Field(min_length=8, max_length=1000)


class DocumentLink(BaseModel):
    label: str = Field(min_length=1, max_length=250)
    url: str = Field(min_length=8, max_length=1000)


class StudyDocumentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    sourceUrl: str | None = Field(default=None, max_length=1000)
    tags: str | None = Field(default=None, max_length=250)
    content: str = Field(min_length=1)
    links: list[DocumentLink] = Field(default_factory=list)


class StudyDocumentUpdate(StudyDocumentCreate):
    pass
