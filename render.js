/* ============================================================
   render.js
   Turns the structured evaluation result into the ledger/dossier
   DOM: matrix table, ranking table, top-candidate cards, and
   collapsible scorecards.
   ============================================================ */

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function redactMark() {
  return `<span class="redact" aria-hidden="true"><span></span><span></span><span></span></span>`;
}

function stampClass(decision) {
  const d = (decision || "").toLowerCase();
  if (d.includes("priority")) return "stamp--priority";
  if (d.includes("shortlist")) return "stamp--shortlist";
  if (d.includes("hold")) return "stamp--hold";
  if (d.includes("not recommended")) return "stamp--reject";
  return "stamp--default";
}

function mandatoryTagClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("does not")) return "mandatory-tag--no";
  if (s.includes("partial")) return "mandatory-tag--partial";
  return "mandatory-tag--meets";
}

function scorecardAnchorId(id) {
  return "sc-" + String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* ---------- JD matrix ---------- */
function renderMatrix(matrix) {
  const table = document.getElementById("matrixTable");
  const criteria = matrix?.criteria || [];

  let html = `<thead><tr><th>Criterion</th><th>Category</th><th class="num">Weight</th></tr></thead><tbody>`;
  criteria.forEach((c) => {
    html += `<tr>
      <td><strong>${escapeHtml(c.name)}</strong><br><span style="color:var(--ink-faint); font-size:12px;">${escapeHtml(c.description || "")}</span></td>
      <td>${escapeHtml(c.category)}</td>
      <td class="num">${escapeHtml(c.weight)}</td>
    </tr>`;
  });
  html += `</tbody>`;
  table.innerHTML = html;

  const knockoutBox = document.getElementById("knockoutBox");
  const knockouts = matrix?.knockout_criteria || [];
  knockoutBox.innerHTML = knockouts.length
    ? `<div class="field-label" style="margin:0 0 6px;">Knockout criteria</div>` +
      knockouts.map((k) => `<div class="ko-item">${escapeHtml(k)}</div>`).join("")
    : "";
}

/* ---------- Ranking table ---------- */
function renderRanking(ranking) {
  const table = document.getElementById("rankingTable");
  let html = `<thead><tr>
    <th class="num">Rank</th><th>Candidate</th><th class="num">Score</th><th>Rating</th><th>Mandatory</th><th>Decision</th><th>Reason</th>
  </tr></thead><tbody>`;

  (ranking || []).forEach((r) => {
    html += `<tr data-target="${scorecardAnchorId(r.id)}">
      <td class="num">${escapeHtml(r.rank)}</td>
      <td>${redactMark()}<span style="font-family:var(--font-mono);">${escapeHtml(r.id)}</span></td>
      <td class="num">${escapeHtml(r.score)}</td>
      <td>${escapeHtml(r.rating)}</td>
      <td><span class="mandatory-tag ${mandatoryTagClass(r.mandatory)}">${escapeHtml(r.mandatory)}</span></td>
      <td><span class="stamp ${stampClass(r.decision)}" style="transform:none; padding:3px 8px;">${escapeHtml(r.decision)}</span></td>
      <td>${escapeHtml(r.reason)}</td>
    </tr>`;
  });
  html += `</tbody>`;
  table.innerHTML = html;

  table.querySelectorAll("tbody tr").forEach((tr) => {
    tr.addEventListener("click", () => {
      const target = document.getElementById(tr.dataset.target);
      if (target) {
        target.open = true;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });
}

/* ---------- Top candidates ---------- */
function renderTop5(topCandidates) {
  const grid = document.getElementById("top5Grid");
  grid.innerHTML = (topCandidates || [])
    .map((t) => `
      <div class="top5-card">
        <div class="top5-card__rank">#${escapeHtml(t.priority)}</div>
        <div class="top5-card__head">
          ${redactMark()}
          <span class="top5-card__id">${escapeHtml(t.id)}</span>
          <span class="top5-card__score">${escapeHtml(t.score)}/100</span>
        </div>
        <p>${escapeHtml(t.hr_assessment)}</p>

        <div class="top5-card__label">Key evidence</div>
        <p>${escapeHtml(t.key_evidence)}</p>

        <div class="top5-card__label">Validate at interview</div>
        <p>${escapeHtml(t.risks)}</p>

        <div class="top5-card__label">Interview questions</div>
        <ul>${(t.interview_questions || []).map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ul>

        <span class="stamp ${stampClass(t.interview_priority === "Immediate" ? "priority" : t.interview_priority)}">${escapeHtml(t.interview_priority)}</span>
      </div>
    `)
    .join("");
}

/* ---------- Scorecards ---------- */
function renderScorecards(candidates) {
  const list = document.getElementById("scorecardList");
  list.innerHTML = (candidates || [])
    .map((c) => `
      <details class="scorecard" id="${scorecardAnchorId(c.id)}">
        <summary>
          ${redactMark()}
          <span class="scorecard__id">${escapeHtml(c.id)}</span>
          <span class="scorecard__score">${escapeHtml(c.total_score)}/100 · ${escapeHtml(c.rating_band)}</span>
          <span class="mandatory-tag ${mandatoryTagClass(c.mandatory_status)}">${escapeHtml(c.mandatory_status)}</span>
          <span class="stamp ${stampClass(c.decision)}" style="transform:none; padding:3px 8px;">${escapeHtml(c.decision)}</span>
          <span class="chev">▸</span>
        </summary>
        <div class="scorecard__body">
          <div class="table-wrap">
            <table class="ledger">
              <thead><tr><th>Requirement</th><th class="num">Score</th><th>Evidence</th></tr></thead>
              <tbody>
                ${(c.requirement_scores || [])
                  .map(
                    (r) => `<tr>
                      <td>${escapeHtml(r.requirement)}</td>
                      <td class="num">${escapeHtml(r.score)}/${escapeHtml(r.max)}</td>
                      <td>${escapeHtml(r.evidence)}</td>
                    </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="scorecard__grid">
            <div>
              <h4>Top strengths</h4>
              <ul>${(c.strengths || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
            </div>
            <div>
              <h4>Key gaps / risks</h4>
              <ul>${(c.gaps || []).map((g) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
            </div>
          </div>

          <p class="scorecard__rationale">"${escapeHtml(c.rationale)}"</p>
        </div>
      </details>
    `)
    .join("");
}

/* ---------- Hiring recommendation ---------- */
function renderRecommendation(rec) {
  const el = document.getElementById("recommendationBlock");
  if (!rec) { el.innerHTML = ""; return; }

  el.innerHTML = `
    <h4>Recommended interview order</h4>
    <ol>${(rec.interview_order || []).map((id) => `<li>${redactMark()}${escapeHtml(id)}</li>`).join("")}</ol>

    <h4>Common skill gaps across the pool</h4>
    <ul>${(rec.common_gaps || []).map((g) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>

    <h4>Does the pool meet the JD?</h4>
    <p>${escapeHtml(rec.pool_sufficiency)}</p>

    <h4>Unrealistic or unclear JD requirements</h4>
    <p>${escapeHtml(rec.unrealistic_requirements)}</p>
  `;
}

/* ---------- Top-level render ---------- */
function renderResults(result) {
  renderMatrix(result.jd_matrix);
  renderRanking(result.ranking);
  renderTop5(result.top_candidates);
  renderScorecards(result.candidates);
  renderRecommendation(result.hiring_recommendation);
}

/* ---------- Export helpers ---------- */
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(val) {
  const s = String(val ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rankingToCsv(ranking) {
  const header = ["Rank", "Candidate", "Score", "Rating", "Mandatory", "Decision", "Reason"];
  const rows = (ranking || []).map((r) => [r.rank, r.id, r.score, r.rating, r.mandatory, r.decision, r.reason]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}
