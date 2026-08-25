# CV Screening Desk

A browser-only tool that scores candidate resumes against a job description using Claude, and produces a weighted evaluation matrix, full ranking, top-candidate shortlist, and interview questions — styled like an analyst's case file.

No backend, no build step, no npm install. It's plain HTML/CSS/JS, so you can host it for free on **GitHub Pages**.

**How it works:** everything runs in your browser. When you click "Run evaluation," the page calls the Anthropic API directly using an API key you paste into Settings. Your JD, resumes, and key never touch any server of ours — only Anthropic's API and (optionally) your own browser's local storage.

## What you get

1. **JD evaluation matrix** — a weighted (100-point) breakdown of the job description's requirements, with mandatory/preferred labels and knockout criteria.
2. **Full ranking** — every candidate, sorted, with score, rating band, mandatory-criteria status, and decision.
3. **Top 5 priority candidates** — HR assessment, key evidence, risks to validate, and two targeted interview questions each.
4. **Candidate-by-candidate scorecards** — expandable detail per requirement, with evidence, strengths, and gaps.
5. **Hiring recommendation** — interview order, common pool-wide gaps, and whether the JD itself looks unrealistic.

Export the ranking as CSV or the full result as JSON at any time.

## Before you deploy: understand the API key model

This is a client-only app — there is no server to hide a key behind. Every visitor pastes **their own** Anthropic API key into Settings before running an evaluation. That key:

- is sent directly from their browser to `api.anthropic.com`,
- is never written into the code or committed to the repo,
- stays in memory for the session, or in that browser's `localStorage` only if they tick "Remember key on this device."

**Never commit a real API key into `app.js`, `index.html`, or anywhere else in the repo.** If you want a version where you don't have to re-enter the key every time, use the "Remember key on this device" checkbox — it's stored locally in your own browser only, not synced or shared. This tool is best suited to personal or internal team use (each person uses their own key), not a public multi-tenant deployment.

Get an API key at [console.anthropic.com](https://console.anthropic.com) (Settings → API Keys).

## File structure

```
cv-screening-desk/
├── index.html          # page structure
├── css/style.css        # all styling (design tokens at the top)
├── js/parse.js          # PDF/DOCX/TXT text extraction (client-side)
├── js/api.js             # prompt construction + Anthropic API call
├── js/render.js          # renders the JSON result into the page
├── js/app.js              # state, tabs, candidate list, wiring
└── README.md
```

## Run it locally first (optional but recommended)

You can't just double-click `index.html` in some browsers because of file:// restrictions on JS modules — serve it with any tiny local server:

```bash
cd cv-screening-desk
python3 -m http.server 8000
# then open http://localhost:8000
```

or, if you have Node:

```bash
npx serve .
```

## Deploy to GitHub Pages

### Option A — GitHub's web UI (no git installed needed)

1. Go to [github.com](https://github.com) and sign in.
2. Click the **+** in the top-right corner → **New repository**.
3. Name it (e.g. `cv-screening-desk`), leave it **Public**, don't add a README (you already have one), then click **Create repository**.
4. On the new repo's page, click **uploading an existing file**.
5. Drag in all the files and folders from this project (`index.html`, `css/`, `js/`, `README.md`) — GitHub preserves the folder structure when you drop a whole folder.
6. Scroll down, click **Commit changes**.
7. Go to the repo's **Settings** tab → **Pages** (left sidebar).
8. Under "Build and deployment," set **Source** to **Deploy from a branch**, branch **main**, folder **/(root)**, then **Save**.
9. Wait about a minute, then refresh — GitHub shows the live URL at the top of that Pages settings screen, something like:
   `https://<your-username>.github.io/cv-screening-desk/`
10. Open that URL, click **Settings** in the app, paste your Anthropic API key, and you're running.

### Option B — Git command line

```bash
cd cv-screening-desk
git init
git add .
git commit -m "Initial commit: CV Screening Desk"
git branch -M main
git remote add origin https://github.com/<your-username>/cv-screening-desk.git
git push -u origin main
```

Then repeat steps 7–10 above (Settings → Pages → Deploy from branch → main → /root).

### Updating the site later

- **Web UI:** open the file in GitHub, click the pencil (edit) icon, make changes, commit. Pages redeploys automatically in under a minute.
- **Git CLI:** edit locally, then
  ```bash
  git add .
  git commit -m "Describe your change"
  git push
  ```

## Customizing

- **Default model / weighting / rating bands:** edit the prompt text in `js/api.js` (`buildSystemPrompt`).
- **Colors and type:** edit the CSS custom properties at the top of `css/style.css` (`:root { ... }`).
- **Max candidates:** there's no hard cap in the code; very large batches (15–20 detailed resumes) may need a higher "Max output tokens" value in Settings if a run gets cut off.

## Limitations to keep in mind

- This is a decision **aid**, not a hiring decision. Scores come from a language model reading text you provide — validate mandatory-criteria gaps and headline claims before acting on them, especially for candidates near a cutoff score.
- PDF/DOCX parsing happens client-side; scanned (image-only) PDFs with no embedded text layer won't extract — paste the resume text manually in that case.
- The Anthropic API's direct-browser-access mode is intended for tools like this one where each user supplies their own key; it is not meant for embedding a shared key in a publicly deployed page.
