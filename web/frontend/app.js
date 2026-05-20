const api = {
  health: "/api/health",
  flashcards: "/api/flashcards",
  flashcardSearch: "/api/flashcards/search",
  subjects: "/api/subjects",
  topics: "/api/topics",
  dueReviews: "/api/reviews/due",
  reviews: "/api/reviews",
  recentReviews: "/api/reviews/recent",
  weakTopics: "/api/reviews/weak-topics",
  statistics: "/api/statistics/study",
  topicStatistics: "/api/statistics/topics",
  documents: "/api/documents",
  documentImport: "/api/documents/import",
};

const state = {
  flashcards: [],
  subjects: [],
  topics: [],
  documents: [],
  currentDocumentId: "",
  documentLinks: [],
  documentSearch: "",
  currentSearch: "",
  filters: {
    subjectId: "",
    topicId: "",
    difficulty: "",
    dueOnly: false,
  },
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
  subjectFilter: document.querySelector("#subjectFilter"),
  topicFilter: document.querySelector("#topicFilter"),
  difficultyFilter: document.querySelector("#difficultyFilter"),
  dueOnlyFilter: document.querySelector("#dueOnlyFilter"),
  resetFiltersButton: document.querySelector("#resetFiltersButton"),
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
  topicStatsList: document.querySelector("#topicStatsList"),
  recentReviewList: document.querySelector("#recentReviewList"),
  documentSearchInput: document.querySelector("#documentSearchInput"),
  newDocumentButton: document.querySelector("#newDocumentButton"),
  importForm: document.querySelector("#importForm"),
  importUrlInput: document.querySelector("#importUrlInput"),
  importButton: document.querySelector("#importButton"),
  documentSummary: document.querySelector("#documentSummary"),
  documentList: document.querySelector("#documentList"),
  documentEditorTitle: document.querySelector("#documentEditorTitle"),
  documentTitleInput: document.querySelector("#documentTitleInput"),
  documentTagsInput: document.querySelector("#documentTagsInput"),
  documentSourceInput: document.querySelector("#documentSourceInput"),
  documentSourcePreview: document.querySelector("#documentSourcePreview"),
  documentContentInput: document.querySelector("#documentContentInput"),
  saveDocumentButton: document.querySelector("#saveDocumentButton"),
  deleteDocumentButton: document.querySelector("#deleteDocumentButton"),
  documentStatus: document.querySelector("#documentStatus"),
  documentLinksList: document.querySelector("#documentLinksList"),
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

  return state.flashcards.filter((card) => {
    const searchableText = normalizeSearchText(
      [card.question, card.answer, card.topicName, card.subjectName].join(" ")
    );
    const matchesKeyword = !keyword || searchableText.includes(keyword);
    const matchesSubject = !state.filters.subjectId || String(card.subjectId) === state.filters.subjectId;
    const matchesTopic = !state.filters.topicId || String(card.topicId) === state.filters.topicId;
    const matchesDifficulty = !state.filters.difficulty || String(card.difficulty) === state.filters.difficulty;
    const matchesDue = !state.filters.dueOnly || Number(card.isDue) === 1;
    return matchesKeyword && matchesSubject && matchesTopic && matchesDifficulty && matchesDue;
  });
}

function activeFilterCount() {
  return [
    state.currentSearch,
    state.filters.subjectId,
    state.filters.topicId,
    state.filters.difficulty,
    state.filters.dueOnly ? "due" : "",
  ].filter(Boolean).length;
}

function renderSearchSummary(visibleCount) {
  const filterCount = activeFilterCount();
  if (!filterCount) {
    elements.searchSummary.textContent = `Showing all ${state.flashcards.length} flashcards.`;
    return;
  }

  const keywordText = state.currentSearch ? ` for "${state.currentSearch}"` : "";
  elements.searchSummary.textContent = `Showing ${visibleCount} of ${state.flashcards.length} flashcards${keywordText}. ${filterCount} filter${filterCount === 1 ? "" : "s"} active.`;
}

function applyFlashcardView() {
  const filteredFlashcards = visibleFlashcards();
  renderFlashcards(filteredFlashcards);
  renderSearchSummary(filteredFlashcards.length);
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

function formatCount(value, label) {
  const number = Number(value || 0);
  return `${number} ${label}${number === 1 ? "" : "s"}`;
}

function hostnameFromUrl(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function visibleDocuments() {
  const keyword = normalizeSearchText(state.documentSearch);
  if (!keyword) return state.documents;

  return state.documents.filter((document) => {
    const text = normalizeSearchText(
      [document.title, document.tags, document.sourceUrl].join(" ")
    );
    return text.includes(keyword);
  });
}

function renderDocuments() {
  const documents = visibleDocuments();
  elements.documentSummary.textContent = state.documentSearch
    ? `Showing ${documents.length} of ${state.documents.length} saved documents.`
    : `${formatCount(state.documents.length, "document")} saved.`;

  if (!documents.length) {
    elements.documentList.innerHTML = `<div class="empty-state">No saved documents found.</div>`;
    return;
  }

  elements.documentList.innerHTML = documents
    .map(
      (document) => `
        <button class="document-row ${String(document.id) === String(state.currentDocumentId) ? "active" : ""}" type="button" data-document-id="${escapeHtml(document.id)}">
          <span>
            <strong>${escapeHtml(document.title)}</strong>
            <small>${escapeHtml(document.tags || "No tags")} | ${escapeHtml(formatCount(document.linkCount, "link"))}</small>
          </span>
          <small>Updated ${escapeHtml(document.updatedAt)}</small>
        </button>
      `
    )
    .join("");
}

function renderDocumentSource(sourceUrl) {
  if (!sourceUrl) {
    elements.documentSourcePreview.classList.add("hidden");
    elements.documentSourcePreview.innerHTML = "";
    return;
  }

  elements.documentSourcePreview.classList.remove("hidden");
  elements.documentSourcePreview.innerHTML = `
    <span>Source</span>
    <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(hostnameFromUrl(sourceUrl))}</a>
  `;
}

function renderDocumentLinks(links = []) {
  state.documentLinks = links.slice(0, 30);

  if (!state.documentLinks.length) {
    elements.documentLinksList.innerHTML = `<div class="empty-state">No extracted links saved for this document.</div>`;
    return;
  }

  elements.documentLinksList.innerHTML = `
    <div class="source-links-heading">Extracted links</div>
    ${state.documentLinks
      .map(
        (link) => `
          <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(link.label)}
            <span>${escapeHtml(hostnameFromUrl(link.url))}</span>
          </a>
        `
      )
      .join("")}
  `;
}

function resetDocumentEditor() {
  state.currentDocumentId = "";
  state.documentLinks = [];
  elements.documentEditorTitle.textContent = "New study document";
  elements.documentTitleInput.value = "";
  elements.documentTagsInput.value = "";
  elements.documentSourceInput.value = "";
  elements.documentContentInput.value = "";
  elements.documentStatus.textContent = "Draft is not saved yet.";
  elements.deleteDocumentButton.classList.add("hidden");
  renderDocumentSource("");
  renderDocumentLinks([]);
  renderDocuments();
}

function fillDocumentEditor(document, statusText) {
  state.currentDocumentId = document.id || "";
  elements.documentEditorTitle.textContent = document.id
    ? `Editing #${document.id}`
    : "Imported web document";
  elements.documentTitleInput.value = document.title || "";
  elements.documentTagsInput.value = document.tags || "";
  elements.documentSourceInput.value = document.sourceUrl || "";
  elements.documentContentInput.value = document.content || "";
  elements.documentStatus.textContent = statusText;
  elements.deleteDocumentButton.classList.toggle("hidden", !document.id);
  renderDocumentSource(document.sourceUrl || "");
  renderDocumentLinks(document.links || []);
  renderDocuments();
}

async function loadDocument(documentId) {
  setBusy(true);
  try {
    const savedDocument = await requestJson(`${api.documents}/${documentId}`);
    fillDocumentEditor(savedDocument, `Loaded saved document #${savedDocument.id}.`);
    window.document.querySelector("#documents").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function importDocument(event) {
  event.preventDefault();
  const url = elements.importUrlInput.value.trim();
  if (!url) {
    showToast("Paste a website URL first.", "error");
    return;
  }

  setBusy(true);
  try {
    const imported = await requestJson(api.documentImport, {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    fillDocumentEditor(
      { ...imported, id: "", tags: "" },
      "Imported content is ready. Edit it, then save it into your library."
    );
    showToast("Website content imported.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function saveDocument() {
  const payload = {
    title: elements.documentTitleInput.value.trim(),
    tags: elements.documentTagsInput.value.trim() || null,
    sourceUrl: elements.documentSourceInput.value.trim() || null,
    content: elements.documentContentInput.value.trim(),
    links: state.documentLinks,
  };

  if (!payload.title || !payload.content) {
    showToast("Document title and content are required.", "error");
    return;
  }

  setBusy(true);
  try {
    if (state.currentDocumentId) {
      await requestJson(`${api.documents}/${state.currentDocumentId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Document updated.");
    } else {
      const result = await requestJson(api.documents, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      state.currentDocumentId = result.id;
      showToast("Document saved.");
    }

    await loadDashboard();
    if (state.currentDocumentId) {
      await loadDocument(state.currentDocumentId);
    }
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function deleteDocument() {
  if (!state.currentDocumentId) return;

  const label = elements.documentTitleInput.value.trim() || `#${state.currentDocumentId}`;
  if (!window.confirm(`Delete document "${label}"?`)) return;

  setBusy(true);
  try {
    await requestJson(`${api.documents}/${state.currentDocumentId}`, { method: "DELETE" });
    showToast("Document deleted.");
    resetDocumentEditor();
    await loadDashboard();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
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
              ${Number(card.isDue) === 1 ? `<span class="badge due">Due now</span>` : ""}
              <span class="badge">Every ${escapeHtml(card.reviewIntervalDays)} day${Number(card.reviewIntervalDays) === 1 ? "" : "s"}</span>
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

function renderFilters() {
  const selectedSubject = state.filters.subjectId;
  const selectedTopic = state.filters.topicId;
  const topicsForFilter = selectedSubject
    ? state.topics.filter((topic) => String(topic.subjectId) === selectedSubject)
    : state.topics;

  elements.subjectFilter.innerHTML = `
    <option value="">All subjects</option>
    ${state.subjects
      .map((subject) => `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`)
      .join("")}
  `;
  elements.subjectFilter.value = selectedSubject;

  elements.topicFilter.innerHTML = `
    <option value="">All topics</option>
    ${topicsForFilter
      .map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.subjectName)} / ${escapeHtml(topic.name)}</option>`)
      .join("")}
  `;

  const topicStillVisible = topicsForFilter.some((topic) => String(topic.id) === selectedTopic);
  elements.topicFilter.value = topicStillVisible ? selectedTopic : "";
  state.filters.topicId = elements.topicFilter.value;
  elements.difficultyFilter.value = state.filters.difficulty;
  elements.dueOnlyFilter.checked = state.filters.dueOnly;
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
              <span>${escapeHtml(topic.subjectName)} | Priority ${escapeHtml(topic.priority)}</span>
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
          <div class="badge-row">
            <span class="badge ${difficultyClass(Number(review.difficulty))}">Difficulty ${escapeHtml(review.difficulty)}</span>
            <span class="badge">Interval ${escapeHtml(review.reviewIntervalDays)} day${Number(review.reviewIntervalDays) === 1 ? "" : "s"}</span>
            <span class="badge due">Due ${escapeHtml(review.nextReviewAt)}</span>
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

function renderTopicStats(topics) {
  if (!topics.length) {
    elements.topicStatsList.innerHTML = `<div class="empty-state">No topic statistics yet.</div>`;
    return;
  }

  elements.topicStatsList.innerHTML = `
    <div class="topic-stat-row header">
      <span>Topic</span>
      <span>Cards</span>
      <span>Due</span>
      <span>Reviews</span>
      <span>Accuracy</span>
    </div>
    ${topics
      .map(
        (topic) => `
          <div class="topic-stat-row">
            <strong>${escapeHtml(topic.subjectName)} / ${escapeHtml(topic.topicName)}</strong>
            <span>${escapeHtml(topic.flashcardCount)}</span>
            <span>${escapeHtml(topic.dueCount)}</span>
            <span>${escapeHtml(topic.reviewCount)}</span>
            <span>${formatPercent(topic.accuracy)}</span>
          </div>
        `
      )
      .join("")}
  `;
}

function renderRecentReviews(reviews) {
  if (!reviews.length) {
    elements.recentReviewList.innerHTML = `<div class="empty-state">No reviews saved yet.</div>`;
    return;
  }

  elements.recentReviewList.innerHTML = reviews
    .map(
      (review) => `
        <article class="activity-row">
          <div>
            <strong>#${escapeHtml(review.flashcardId)} ${escapeHtml(review.question)}</strong>
            <span>${escapeHtml(review.subjectName)} / ${escapeHtml(review.topicName)} | ${escapeHtml(review.reviewedAt)}</span>
          </div>
          <span class="badge ${review.wasCorrect ? "difficulty-low" : "difficulty-high"}">${review.wasCorrect ? "Correct" : "Wrong"}</span>
        </article>
      `
    )
    .join("");
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

  elements.editingId.value = card.id;
  elements.topicSelect.value = card.topicId;
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
    const [stats, flashcards, subjects, topics, dueReviews, weakTopics, topicStats, recentReviews, documents] = await Promise.all([
      requestJson(api.statistics),
      requestJson(api.flashcards),
      requestJson(api.subjects),
      requestJson(api.topics),
      requestJson(api.dueReviews),
      requestJson(api.weakTopics),
      requestJson(api.topicStatistics),
      requestJson(api.recentReviews),
      requestJson(api.documents),
    ]);

    state.flashcards = flashcards;
    state.subjects = subjects;
    state.topics = topics;
    state.documents = documents;
    renderStats(stats);
    renderDocuments();
    renderFilters();
    applyFlashcardView();
    renderTopics(topics);
    renderDueReviews(dueReviews);
    renderWeakTopics(weakTopics);
    renderTopicStats(topicStats);
    renderRecentReviews(recentReviews);
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
          topicId: payload.topicId,
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
  applyFlashcardView();
}

function clearSearch() {
  state.currentSearch = "";
  elements.searchInput.value = "";
  applyFlashcardView();
}

function resetFilters() {
  state.filters = {
    subjectId: "",
    topicId: "",
    difficulty: "",
    dueOnly: false,
  };
  renderFilters();
  applyFlashcardView();
}

function updateFilters() {
  state.filters.subjectId = elements.subjectFilter.value;
  state.filters.topicId = elements.topicFilter.value;
  state.filters.difficulty = elements.difficultyFilter.value;
  state.filters.dueOnly = elements.dueOnlyFilter.checked;
  renderFilters();
  applyFlashcardView();
}

elements.refreshButton.addEventListener("click", loadDashboard);
elements.searchButton.addEventListener("click", searchFlashcards);
elements.clearSearchButton.addEventListener("click", clearSearch);
elements.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchFlashcards();
});
elements.searchInput.addEventListener("input", () => {
  state.currentSearch = elements.searchInput.value.trim();
  applyFlashcardView();
});
elements.subjectFilter.addEventListener("change", updateFilters);
elements.topicFilter.addEventListener("change", updateFilters);
elements.difficultyFilter.addEventListener("change", updateFilters);
elements.dueOnlyFilter.addEventListener("change", updateFilters);
elements.resetFiltersButton.addEventListener("click", resetFilters);
elements.documentSearchInput.addEventListener("input", () => {
  state.documentSearch = elements.documentSearchInput.value.trim();
  renderDocuments();
});
elements.newDocumentButton.addEventListener("click", resetDocumentEditor);
elements.importForm.addEventListener("submit", importDocument);
elements.saveDocumentButton.addEventListener("click", saveDocument);
elements.deleteDocumentButton.addEventListener("click", deleteDocument);
elements.documentSourceInput.addEventListener("input", () => {
  renderDocumentSource(elements.documentSourceInput.value.trim());
});
elements.documentList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-document-id]");
  if (!button) return;
  loadDocument(button.dataset.documentId);
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
