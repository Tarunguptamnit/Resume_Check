/* ============================================================
   app.js
   Application state, tab navigation, candidate list management,
   settings drawer, and the run/export button wiring.
   ============================================================ */

const state = {
  candidates: [],   // { uid, id, text }
  lastResult: null,
  settings: {
    apiKey: "",
    model: "claude-sonnet-5",
    maxTokens: 16000,
    remember: false
  }
};

let uidCounter = 0;
const nextUid = () => `c${++uidCounter}`;

/* ============================================================
   Settings persistence
   ============================================================ */
function loadSettings() {
  const remembered = localStorage.getItem("cvdesk_settings");
  if (remembered) {
    try {
      const parsed = JSON.parse(remembered);
      Object.assign(state.settings, parsed, { remember: true });
    } catch {}
  }
  document.getElementById("apiKey").value = state.settings.apiKey;
  document.getElementById("modelSelect").value = state.settings.model;
  document.getElementById("maxTokens").value = state.settings.maxTokens;
  document.getElementById("rememberKey").checked = state.settings.remember;
}

function saveSettings() {
  state.settings.apiKey = document.getElementById("apiKey").value.trim();
  state.settings.model = document.getElementById("modelSelect").value;
  state.settings.maxTokens = parseInt(document.getElementById("maxTokens").value, 10) || 16000;
  state.settings.remember = document.getElementById("rememberKey").checked;

  if (state.settings.remember) {
    localStorage.setItem("cvdesk_settings", JSON.stringify(state.settings));
  } else {
    localStorage.removeItem("cvdesk_settings");
  }
  closeDrawer();
  updateRunBar();
}

function openDrawer() { document.getElementById("settingsDrawer").hidden = false; }
function closeDrawer() { document.getElementById("settingsDrawer").hidden = true; }

/* ============================================================
   Tabs
   ============================================================ */
function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === tabName));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-active", p.id === `panel-${tabName}`));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============================================================
   Candidate list
   ============================================================ */
function addCandidate({ id = "", text = "" } = {}) {
  state.candidates.push({ uid: nextUid(), id, text });
  renderCandidateList();
}

function removeCandidate(uid) {
  state.candidates = state.candidates.filter((c) => c.uid !== uid);
  renderCandidateList();
}

function renderCandidateList() {
  const container = document.getElementById("candidateList");
  container.innerHTML = state.candidates
    .map(
      (c, i) => `
      <div class="candidate-card" data-uid="${c.uid}">
        <div class="candidate-card__row">
          <input class="candidate-card__id" type="text" placeholder="Candidate ID or name, e.g. Candidate ${i + 1}" value="${escapeHtml(c.id)}" data-field="id">
          <button class="candidate-card__remove" type="button" data-action="remove">Remove</button>
        </div>
        <textarea placeholder="Paste this candidate's resume text here..." data-field="text">${escapeHtml(c.text)}</textarea>
        <div class="candidate-card__meta">${c.text ? `${c.text.trim().split(/\s+/).length} words` : "No resume text yet"}</div>
      </div>
    `
    )
    .join("");

  container.querySelectorAll(".candidate-card").forEach((card) => {
    const uid = card.dataset.uid;
    card.querySelector('[data-field="id"]').addEventListener("input", (e) => {
      const c = state.candidates.find((x) => x.uid === uid);
      if (c) c.id = e.target.value;
    });
    card.querySelector('[data-field="text"]').addEventListener("input", (e) => {
      const c = state.candidates.find((x) => x.uid === uid);
      if (c) c.text = e.target.value;
      card.querySelector(".candidate-card__meta").textContent = e.target.value.trim()
        ? `${e.target.value.trim().split(/\s+/).length} words`
        : "No resume text yet";
    });
    card.querySelector('[data-action="remove"]').addEventListener("click", () => removeCandidate(uid));
  });

  document.getElementById("candidateCount").textContent = state.candidates.length;
  updateRunBar();
}

/* ============================================================
   File uploads
   ============================================================ */
document.getElementById("jdFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const status = document.getElementById("jdFileStatus");
  status.textContent = `Reading ${file.name}…`;
  try {
    const text = await extractTextFromFile(file);
    document.getElementById("jdText").value = text;
    status.textContent = `Loaded ${file.name} (${text.trim().split(/\s+/).length} words).`;
  } catch (err) {
    status.textContent = err.message;
  }
  e.target.value = "";
});

document.getElementById("bulkFiles").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const status = document.getElementById("bulkFileStatus");
  let done = 0;
  for (const file of files) {
    status.textContent = `Reading ${file.name}… (${done + 1}/${files.length})`;
    try {
      const text = await extractTextFromFile(file);
      addCandidate({ id: idFromFilename(file.name), text });
    } catch (err) {
      status.textContent = `Couldn't read ${file.name}: ${err.message}`;
    }
    done++;
  }
  status.textContent = `Added ${files.length} candidate${files.length === 1 ? "" : "s"} from uploaded files.`;
  e.target.value = "";
});

document.getElementById("addCandidate").addEventListener("click", () => addCandidate());

/* ============================================================
   Run bar state
   ============================================================ */
function updateRunBar() {
  const jdText = document.getElementById("jdText").value.trim();
  const hasCandidates = state.candidates.some((c) => c.text.trim().length > 0);
  const hasKey = !!document.getElementById("apiKey").value.trim();
  const runBtn = document.getElementById("runEval");
  const meta = document.getElementById("runMeta");

  const missing = [];
  if (!jdText) missing.push("a job description");
  if (!hasCandidates) missing.push("at least one candidate with resume text");
  if (!hasKey) missing.push("an Anthropic API key (see Settings)");

  runBtn.disabled = missing.length > 0;
  meta.textContent = missing.length
    ? `Add ${missing.join(", ")} to run an evaluation.`
    : `Ready — ${state.candidates.filter((c) => c.text.trim()).length} candidate(s) against the job description.`;
}

/* ============================================================
   Run evaluation
   ============================================================ */
async function runEvaluation() {
  const jdText = document.getElementById("jdText").value.trim();
  const candidates = state.candidates
    .filter((c) => c.text.trim())
    .map((c, i) => ({ id: c.id.trim() || `Candidate ${i + 1}`, text: c.text.trim() }));

  const loading = document.getElementById("loading");
  const errorBox = document.getElementById("errorBox");
  const results = document.getElementById("results");
  const runBtn = document.getElementById("runEval");

  errorBox.hidden = true;
  results.hidden = true;
  loading.hidden = false;
  runBtn.disabled = true;

  const messages = [
    "Reading candidate files…",
    "Building the weighting matrix…",
    "Scoring each candidate against the JD…",
    "Ranking and drafting interview questions…"
  ];
  let mi = 0;
  const msgTimer = setInterval(() => {
    mi = (mi + 1) % messages.length;
    document.getElementById("loadingMsg").textContent = messages[mi];
  }, 3500);
  document.getElementById("loadingMsg").textContent = messages[0];

  try {
    const result = await callClaude({
      apiKey: state.settings.apiKey || document.getElementById("apiKey").value.trim(),
      model: document.getElementById("modelSelect").value,
      maxTokens: parseInt(document.getElementById("maxTokens").value, 10) || 16000,
      jdText,
      candidates
    });
    state.lastResult = result;
    renderResults(result);
    results.hidden = false;
  } catch (err) {
    errorBox.hidden = false;
    errorBox.textContent = err.message || "Something went wrong calling the Anthropic API.";
  } finally {
    clearInterval(msgTimer);
    loading.hidden = true;
    runBtn.disabled = false;
    updateRunBar();
  }
}

/* ============================================================
   Wiring
   ============================================================ */
document.querySelectorAll("[data-tab]").forEach((el) =>
  el.addEventListener("click", () => activateTab(el.dataset.tab))
);
document.getElementById("toCandidates").addEventListener("click", () => activateTab("candidates"));
document.getElementById("toResults").addEventListener("click", () => activateTab("results"));

document.getElementById("openSettings").addEventListener("click", openDrawer);
document.getElementById("closeSettings").addEventListener("click", closeDrawer);
document.getElementById("saveSettings").addEventListener("click", saveSettings);
document.getElementById("settingsDrawer").addEventListener("click", (e) => {
  if (e.target.id === "settingsDrawer") closeDrawer();
});

document.getElementById("jdText").addEventListener("input", updateRunBar);
document.getElementById("apiKey").addEventListener("input", updateRunBar);

document.getElementById("runEval").addEventListener("click", runEvaluation);

document.getElementById("downloadJson").addEventListener("click", () => {
  if (!state.lastResult) return;
  downloadFile("cv-screening-results.json", JSON.stringify(state.lastResult, null, 2), "application/json");
});
document.getElementById("downloadCsv").addEventListener("click", () => {
  if (!state.lastResult) return;
  downloadFile("cv-screening-ranking.csv", rankingToCsv(state.lastResult.ranking), "text/csv");
});

/* ============================================================
   Init
   ============================================================ */
loadSettings();
addCandidate();      // start with one empty candidate card
addCandidate();
updateRunBar();
