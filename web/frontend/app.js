const api = {
  flashcards: "/api/flashcards",
  flashcardSearch: "/api/flashcards/search",
  topics: "/api/topics",
  dueReviews: "/api/reviews/due",
  reviews: "/api/reviews",
  weakTopics: "/api/reviews/weak-topics",
  statistics: "/api/statistics/study",
};

const state = {
  topics: [],
};

async function requestJson(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed." }));
    throw new Error(error.detail || "Request failed.");
  }

  return response.json();
}

function renderStats(stats) {
  const entries = [
    ["Flashcards", stats.totalFlashcards],
    ["Reviews", stats.totalReviews],
    ["Correct", stats.correctCount],
    ["Wrong", stats.wrongCount],
    ["Accuracy", `${stats.accuracy}%`],
    ["Due Today", stats.dueTodayCount],
  ];

  document.querySelector("#statsGrid").innerHTML = entries
    .map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function renderFlashcards(flashcards) {
  const container = document.querySelector("#flashcardList");

  if (!flashcards.length) {
    container.innerHTML = `<div class="item">No flashcards found.</div>`;
    return;
  }

  container.innerHTML = flashcards
    .map(
      (card) => `
        <article class="item">
          <div class="item-title">#${card.id} ${card.question}</div>
          <div class="item-meta">${card.subjectName} / ${card.topicName} · difficulty ${card.difficulty} · next ${card.nextReviewAt}</div>
          <p>${card.answer}</p>
          <div class="item-actions">
            <button class="secondary" onclick="editFlashcard(${card.id}, '${escapeForJs(card.question)}', '${escapeForJs(card.answer)}', ${card.difficulty})">Edit</button>
            <button class="secondary" onclick="deleteFlashcard(${card.id})">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderTopics(topics) {
  const select = document.querySelector("#topicSelect");
  select.innerHTML = topics
    .map((topic) => `<option value="${topic.id}">${topic.subjectName} / ${topic.name}</option>`)
    .join("");
}

function renderDueReviews(reviews) {
  const container = document.querySelector("#reviewList");
  if (!reviews.length) {
    container.innerHTML = `<div class="item">No cards due right now.</div>`;
    return;
  }

  container.innerHTML = reviews
    .map(
      (review) => `
        <article class="item">
          <div class="item-title">#${review.flashcardId} ${review.question}</div>
          <div class="item-meta">${review.subjectName} / ${review.topicName}</div>
          <p>${review.answer}</p>
          <div class="item-actions">
            <button onclick="saveReview(${review.flashcardId}, true)">Correct</button>
            <button class="secondary" onclick="saveReview(${review.flashcardId}, false)">Wrong</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderWeakTopics(topics) {
  const container = document.querySelector("#weakTopicList");
  if (!topics.length) {
    container.innerHTML = `<div class="item">No review history yet.</div>`;
    return;
  }

  container.innerHTML = topics
    .map(
      (topic) => `
        <article class="item">
          <div class="item-title">${topic.subjectName} / ${topic.topicName}</div>
          <div class="item-meta">Reviews: ${topic.reviewCount} · Wrong: ${topic.wrongCount} · Wrong rate: ${topic.wrongRate}%</div>
        </article>
      `
    )
    .join("");
}

function escapeForJs(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

async function loadDashboard() {
  const [stats, flashcards, topics, dueReviews, weakTopics] = await Promise.all([
    requestJson(api.statistics),
    requestJson(api.flashcards),
    requestJson(api.topics),
    requestJson(api.dueReviews),
    requestJson(api.weakTopics),
  ]);

  state.topics = topics;
  renderStats(stats);
  renderFlashcards(flashcards);
  renderTopics(topics);
  renderDueReviews(dueReviews);
  renderWeakTopics(weakTopics);
}

async function searchFlashcards() {
  const keyword = document.querySelector("#searchInput").value.trim();
  const url = keyword ? `${api.flashcardSearch}?keyword=${encodeURIComponent(keyword)}` : api.flashcards;
  renderFlashcards(await requestJson(url));
}

async function addFlashcard(event) {
  event.preventDefault();

  await requestJson(api.flashcards, {
    method: "POST",
    body: JSON.stringify({
      topicId: Number(document.querySelector("#topicSelect").value),
      question: document.querySelector("#questionInput").value.trim(),
      answer: document.querySelector("#answerInput").value.trim(),
      difficulty: Number(document.querySelector("#difficultyInput").value),
    }),
  });

  event.target.reset();
  document.querySelector("#difficultyInput").value = 3;
  await loadDashboard();
}

async function editFlashcard(id, currentQuestion, currentAnswer, currentDifficulty) {
  const question = prompt("New question:", currentQuestion);
  if (!question) return;

  const answer = prompt("New answer:", currentAnswer);
  if (!answer) return;

  const difficulty = Number(prompt("Difficulty (1-5):", currentDifficulty));
  if (!difficulty || difficulty < 1 || difficulty > 5) return;

  await requestJson(`${api.flashcards}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ question, answer, difficulty }),
  });
  await loadDashboard();
}

async function deleteFlashcard(id) {
  if (!confirm(`Delete flashcard #${id}?`)) return;

  await requestJson(`${api.flashcards}/${id}`, { method: "DELETE" });
  await loadDashboard();
}

async function saveReview(flashcardId, wasCorrect) {
  await requestJson(api.reviews, {
    method: "POST",
    body: JSON.stringify({ flashcardId, wasCorrect }),
  });
  await loadDashboard();
}

document.querySelector("#refreshButton").addEventListener("click", loadDashboard);
document.querySelector("#searchButton").addEventListener("click", searchFlashcards);
document.querySelector("#searchInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchFlashcards();
});
document.querySelector("#addForm").addEventListener("submit", addFlashcard);

loadDashboard().catch((error) => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="panel" style="margin:1rem;color:#991b1b;">${error.message}</div>`
  );
});

