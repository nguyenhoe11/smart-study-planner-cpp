from pydantic import BaseModel, Field


class FlashcardCreate(BaseModel):
    topicId: int
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=1000)
    difficulty: int = Field(ge=1, le=5)


class FlashcardUpdate(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=1000)
    difficulty: int = Field(ge=1, le=5)


class ReviewCreate(BaseModel):
    flashcardId: int
    wasCorrect: bool

