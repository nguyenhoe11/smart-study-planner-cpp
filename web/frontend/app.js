const api = {
  health: "/api/health",
  flashcards: "/api/flashcards",
  flashcardSearch: "/api/flashcards/search",
  topics: "/api/topics",
  dueReviews: "/api/reviews/due",
  reviews: "/api/reviews",
  weakTopics: "/api/reviews/weak-topics",
  statistics: "/api/statistics/study",
};

const state = {
  flashcards: [],
  topics: [],
  currentSearch: "",
  busy: false,
};

const elements = {
  healthStatus: document.querySelector("#healthStatus"),
  refreshButton: document.querySelector("#refreshButton"),
  statsGrid: document.querySelector("#statsGrid"),
  searchInput: document.querySelector("#searchInput"),
  searchButton: document.querySelector("#searchButton"),
  clearSearchButton: document.querySelector("#clearSearchButton"),
  searchSummary: document.querySelector("#searchSummary"),
  flashcardList: document.querySelector("#flashcardList"),
  flashcardForm: document.querySelector("#flashcardForm"),
  editingId: document.querySelector("#editingId"),
  topicSelect: document.querySelector("#topicSelect"),
  questionInput: document.querySelector("#questionInput"),
  answerInput: document.querySelector("#answerInput"),
  difficultyInput: document.querySelector("#difficultyInput"),
  submitFlashcardButton: document.querySelector("#submitFlashcardButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  formTitle: document.querySelector("#formTitle"),
  reviewList: document.querySelector("#reviewList"),
  topicList: document.querySelector("#topicList"),
  weakTopicList: document.querySelector("#weakTopicList"),
  toast: document.querySelector("#toast"),
};

async function requestJson(url, options = {}) {
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function difficultyClass(difficulty) {
  if (difficulty <= 2) return "difficulty-low";
  if (difficulty >= 4) return "difficulty-high";
  return "difficulty-mid";
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function visibleFlashcards() {
  const keyword = normalizeSearchText(state.currentSearch);
  if (!keyword) return state.flashcards;

  return state.flashcards.filter((card) => {
    const searchableText = normalizeSearchText(
      [card.question, card.answer, card.topicName, card.subjectName].join(" ")
    );
    return searchableText.includes(keyword);
  });
}

function renderSearchSummary(visibleCount) {
  if (!state.currentSearch) {
    elements.searchSummary.textContent = `Showing all ${state.flashcards.length} flashcards.`;
    return;
  }

  elements.searchSummary.textContent = `Showing ${visibleCount} result${visibleCount === 1 ? "" : "s"} for "${state.currentSearch}".`;
}

function showToast(message, type = "info") {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type === "error" ? "error" : ""}`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 3200);
}

function setBusy(isBusy) {
  state.busy = isBusy;
  document.querySelectorAll("button, input, select, textarea").forEach((control) => {
    if (control.id !== "searchInput") {
      control.disabled = isBusy;
    }
  });
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${number.toFixed(2)}%`;
}

function renderStats(stats) {
  const entries = [
    ["Flashcards", stats.totalFlashcards, "blue"],
    ["Reviews", stats.totalReviews, ""],
    ["Correct", stats.correctCount, "green"],
    ["Wrong", stats.wrongCount, "red"],
    ["Accuracy", formatPercent(stats.accuracy), "green"],
    ["Due today", stats.dueTodayCount, "amber"],
  ];

  elements.statsGrid.innerHTML = entries
    .map(
      ([label, value, tone]) => `
        <div class="stat ${tone}">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `
    )
    .join("");
}

function renderFlashcards(flashcards) {
  if (!flashcards.length) {
    elements.flashcardList.innerHTML = `<div class="empty-state">No flashcards found.</div>`;
    return;
  }

  elements.flashcardList.innerHTML = flashcards
    .map(
      (card) => `
        <article class="flashcard-card">
          <div class="card-top">
            <div>
              <p class="card-title">#${escapeHtml(card.id)} ${escapeHtml(card.question)}</p>
              <div class="meta-line">${escapeHtml(card.subjectName)} / ${escapeHtml(card.topicName)}</div>
            </div>
            <div class="badge-row">
              <span class="badge ${difficultyClass(Number(card.difficulty))}">Difficulty ${escapeHtml(card.difficulty)}</span>
              <span class="badge">Next ${escapeHtml(card.nextReviewAt)}</span>
            </div>
          </div>
          <p class="answer-text">${escapeHtml(card.answer)}</p>
          <div class="item-actions">
            <button class="secondary" type="button" data-action="edit" data-id="${escapeHtml(card.id)}">Edit</button>
            <button class="danger" type="button" data-action="delete" data-id="${escapeHtml(card.id)}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderTopics(topics) {
  elements.topicSelect.innerHTML = topics
    .map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.subjectName)} / ${escapeHtml(topic.name)}</option>`)
    .join("");

  elements.topicList.innerHTML = topics.length
    ? topics
        .map(
          (topic) => `
            <div class="topic-row">
              <strong>#${escapeHtml(topic.id)} ${escapeHtml(topic.name)}</strong>
              <span>${escapeHtml(topic.subjectName)} · Priority ${escapeHtml(topic.priority)}</span>
            </div>
          `
        )
        .join("")
    : `<div class="empty-state">No topics found.</div>`;
}

function renderDueReviews(reviews) {
  if (!reviews.length) {
    elements.reviewList.innerHTML = `<div class="empty-state">No cards due right now.</div>`;
    return;
  }

  elements.reviewList.innerHTML = reviews
    .map(
      (review) => `
        <article class="review-card">
          <div>
            <p class="card-title">#${escapeHtml(review.flashcardId)} ${escapeHtml(review.question)}</p>
            <div class="meta-line">${escapeHtml(review.subjectName)} / ${escapeHtml(review.topicName)}</div>
          </div>
          <p class="answer-text hidden" data-answer-for="${escapeHtml(review.flashcardId)}">${escapeHtml(review.answer)}</p>
          <div class="review-actions">
            <button class="secondary" type="button" data-action="toggle-answer" data-id="${escapeHtml(review.flashcardId)}">Reveal answer</button>
            <button class="positive" type="button" data-action="review-correct" data-id="${escapeHtml(review.flashcardId)}">Correct</button>
            <button class="danger" type="button" data-action="review-wrong" data-id="${escapeHtml(review.flashcardId)}">Wrong</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderWeakTopics(topics) {
  if (!topics.length) {
    elements.weakTopicList.innerHTML = `<div class="empty-state">No review history yet.</div>`;
    return;
  }

  elements.weakTopicList.innerHTML = `
    <div class="insight-row header">
      <span>Topic</span>
      <span>Reviews</span>
      <span>Wrong</span>
      <span>Wrong rate</span>
    </div>
    ${topics
      .map(
        (topic) => `
          <div class="insight-row">
            <strong>${escapeHtml(topic.subjectName)} / ${escapeHtml(topic.topicName)}</strong>
            <span>${escapeHtml(topic.reviewCount)}</span>
            <span>${escapeHtml(topic.wrongCount)}</span>
            <span>${formatPercent(topic.wrongRate)}</span>
          </div>
        `
      )
      .join("")}
  `;
}

function resetForm() {
  elements.flashcardForm.reset();
  elements.editingId.value = "";
  elements.difficultyInput.value = 3;
  elements.formTitle.textContent = "Add flashcard";
  elements.submitFlashcardButton.textContent = "Add flashcard";
  elements.cancelEditButton.classList.add("hidden");
}

function startEdit(id) {
  const card = state.flashcards.find((item) => Number(item.id) === Number(id));
  if (!card) return;

  const topic = state.topics.find((item) => item.name === card.topicName && item.subjectName === card.subjectName);

  elements.editingId.value = card.id;
  if (topic) elements.topicSelect.value = topic.id;
  elements.questionInput.value = card.question;
  elements.answerInput.value = card.answer;
  elements.difficultyInput.value = card.difficulty;
  elements.formTitle.textContent = `Edit flashcard #${card.id}`;
  elements.submitFlashcardButton.textContent = "Save changes";
  elements.cancelEditButton.classList.remove("hidden");
  document.querySelector("#editor").scrollIntoView({ behavior: "smooth", block: "start" });
  elements.questionInput.focus();
}

async function checkHealth() {
  try {
    const health = await requestJson(api.health);
    elements.healthStatus.textContent = health.status === "ok" ? "API connected" : "API unknown";
    elements.healthStatus.className = "status-pill ok";
  } catch (error) {
    elements.healthStatus.textContent = "API offline";
    elements.healthStatus.className = "status-pill error";
  }
}

async function loadDashboard() {
  setBusy(true);
  try {
    await checkHealth();
    const [stats, flashcards, topics, dueReviews, weakTopics] = await Promise.all([
      requestJson(api.statistics),
      requestJson(api.flashcards),
      requestJson(api.topics),
      requestJson(api.dueReviews),
      requestJson(api.weakTopics),
    ]);

    state.flashcards = flashcards;
    state.topics = topics;
    const filteredFlashcards = visibleFlashcards();
    renderStats(stats);
    renderFlashcards(filteredFlashcards);
    renderSearchSummary(filteredFlashcards.length);
    renderTopics(topics);
    renderDueReviews(dueReviews);
    renderWeakTopics(weakTopics);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function saveFlashcard(event) {
  event.preventDefault();

  const payload = {
    topicId: Number(elements.topicSelect.value),
    question: elements.questionInput.value.trim(),
    answer: elements.answerInput.value.trim(),
    difficulty: Number(elements.difficultyInput.value),
  };

  if (!payload.topicId || !payload.question || !payload.answer) {
    showToast("Topic, question, and answer are required.", "error");
    return;
  }

  if (payload.difficulty < 1 || payload.difficulty > 5) {
    showToast("Difficulty must be between 1 and 5.", "error");
    return;
  }

  const id = elements.editingId.value;
  setBusy(true);
  try {
    if (id) {
      await requestJson(`${api.flashcards}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          question: payload.question,
          answer: payload.answer,
          difficulty: payload.difficulty,
        }),
      });
      showToast("Flashcard updated.");
    } else {
      await requestJson(api.flashcards, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Flashcard created.");
    }

    resetForm();
    await loadDashboard();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function deleteFlashcard(id) {
  const card = state.flashcards.find((item) => Number(item.id) === Number(id));
  const label = card ? `#${card.id} ${card.question}` : `#${id}`;
  if (!window.confirm(`Delete ${label}?`)) return;

  setBusy(true);
  try {
    await requestJson(`${api.flashcards}/${id}`, { method: "DELETE" });
    showToast("Flashcard deleted.");
    if (elements.editingId.value === String(id)) resetForm();
    await loadDashboard();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function saveReview(flashcardId, wasCorrect) {
  setBusy(true);
  try {
    await requestJson(api.reviews, {
      method: "POST",
      body: JSON.stringify({ flashcardId: Number(flashcardId), wasCorrect }),
    });
    showToast(wasCorrect ? "Review saved as correct." : "Review saved as wrong.");
    await loadDashboard();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

function searchFlashcards() {
  state.currentSearch = elements.searchInput.value.trim();
  const filteredFlashcards = visibleFlashcards();
  renderFlashcards(filteredFlashcards);
  renderSearchSummary(filteredFlashcards.length);
}

function clearSearch() {
  state.currentSearch = "";
  elements.searchInput.value = "";
  renderFlashcards(state.flashcards);
  renderSearchSummary(state.flashcards.length);
}

elements.refreshButton.addEventListener("click", loadDashboard);
elements.searchButton.addEventListener("click", searchFlashcards);
elements.clearSearchButton.addEventListener("click", clearSearch);
elements.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchFlashcards();
});
elements.searchInput.addEventListener("input", () => {
  state.currentSearch = elements.searchInput.value.trim();
  const filteredFlashcards = visibleFlashcards();
  renderFlashcards(filteredFlashcards);
  renderSearchSummary(filteredFlashcards.length);
});
elements.flashcardForm.addEventListener("submit", saveFlashcard);
elements.cancelEditButton.addEventListener("click", resetForm);

elements.flashcardList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;

  if (button.dataset.action === "edit") startEdit(id);
  if (button.dataset.action === "delete") deleteFlashcard(id);
});

elements.reviewList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;

  if (button.dataset.action === "toggle-answer") {
    const answer = elements.reviewList.querySelector(`[data-answer-for="${CSS.escape(id)}"]`);
    if (answer) {
      answer.classList.toggle("hidden");
      button.textContent = answer.classList.contains("hidden") ? "Reveal answer" : "Hide answer";
    }
  }

  if (button.dataset.action === "review-correct") saveReview(id, true);
  if (button.dataset.action === "review-wrong") saveReview(id, false);
});

loadDashboard();
