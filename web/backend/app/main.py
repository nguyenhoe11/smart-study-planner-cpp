from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import repositories
from app.schemas import FlashcardCreate, FlashcardUpdate, ReviewCreate


ROOT_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = ROOT_DIR / "frontend"

app = FastAPI(title="Smart Study Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/")
def index():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/flashcards")
def list_flashcards():
    return repositories.list_flashcards()


@app.get("/api/flashcards/search")
def search_flashcards(keyword: str):
    return repositories.search_flashcards(keyword)


@app.post("/api/flashcards", status_code=201)
def create_flashcard(payload: FlashcardCreate):
    if not repositories.topic_exists(payload.topicId):
        raise HTTPException(status_code=404, detail="Topic not found.")

    repositories.create_flashcard(
        payload.topicId,
        payload.question,
        payload.answer,
        payload.difficulty,
    )
    return {"message": "Flashcard created."}


@app.put("/api/flashcards/{flashcard_id}")
def update_flashcard(flashcard_id: int, payload: FlashcardUpdate):
    if not repositories.flashcard_exists(flashcard_id):
        raise HTTPException(status_code=404, detail="Flashcard not found.")

    repositories.update_flashcard(
        flashcard_id,
        payload.question,
        payload.answer,
        payload.difficulty,
    )
    return {"message": "Flashcard updated."}


@app.delete("/api/flashcards/{flashcard_id}")
def delete_flashcard(flashcard_id: int):
    if not repositories.flashcard_exists(flashcard_id):
        raise HTTPException(status_code=404, detail="Flashcard not found.")

    repositories.delete_flashcard(flashcard_id)
    return {"message": "Flashcard deleted."}


@app.get("/api/topics")
def list_topics():
    return repositories.list_topics()


@app.get("/api/reviews/due")
def due_reviews():
    return repositories.due_reviews()


@app.post("/api/reviews", status_code=201)
def save_review(payload: ReviewCreate):
    if not repositories.flashcard_exists(payload.flashcardId):
        raise HTTPException(status_code=404, detail="Flashcard not found.")

    repositories.save_review(payload.flashcardId, payload.wasCorrect)
    return {"message": "Review saved."}


@app.get("/api/reviews/weak-topics")
def weak_topics():
    return repositories.weak_topics()


@app.get("/api/statistics/study")
def study_statistics():
    return repositories.study_statistics()

