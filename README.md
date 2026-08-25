# CV Screening Desk

A browser-only tool that scores candidate resumes against a job description using the Gemini API, and produces a weighted evaluation matrix, full ranking, top-candidate shortlist, and interview questions — styled in a clean Material look (Roboto type, Google-blue actions, decision chips in the four Google brand colors).

It's a **single self-contained `index.html` file** — no backend, no build step, no npm install, no subfolders to keep track of. Just that one file, hosted for free on **GitHub Pages**.

**How it works:** everything runs in your browser. When someone clicks "Run evaluation," the page calls Google's Gemini API directly. Their JD and resumes never touch any server of ours — only Google's API and (optionally) their own browser's local storage.

**Why Gemini instead of Claude:** the Anthropic API has no permanent free tier — new accounts get a one-time trial credit, then it's pay-per-use. Google's Gemini API has a real, ongoing free tier (no credit card, no expiry), which is what makes this app free to run for you and everyone you share it with.

## What you get

1. **JD evaluation matrix** — a weighted (100-point) breakdown of the job description's requirements, with mandatory/preferred labels and knockout criteria.
2. **Full ranking** — every candidate, sorted, with score, rating band, mandatory-criteria status, and decision.
3. **Top priority candidates** — HR assessment, key evidence, risks to validate, and two targeted interview questions each.
4. **Candidate-by-candidate scorecards** — expandable detail per requirement, with evidence, strengths, and gaps.
5. **Hiring recommendation** — interview order, common pool-wide gaps, and whether the JD itself looks unrealistic.

Export the ranking as CSV or the full result as JSON at any time.

## Before you deploy: get your free key and paste it in

This app ships with a placeholder key so outside people can open the link and use it immediately — no signup, no Settings fiddling. You need to fill that placeholder in once before you share the link.

1. Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**, sign in with any Google account, and click **Create API key**. No credit card needed.
2. Create it under a **fresh, dedicated project** if you're offered the choice, and make sure **billing stays off** on that project. With billing off, the key can only ever hit free-tier rate limits — it can never generate a bill, no matter how it's used.
3. Copy the key.
4. Open `index.html`, find this line near the top of the `<script>` block:
   ```js
   const SHARED_FREE_KEY = "PASTE_YOUR_FREE_GEMINI_KEY_HERE";
   ```
5. Replace the placeholder text between the quotes with your actual key, and save.

### What "free" means here — the tradeoffs

- **Rate limits, not a bill.** The free tier caps requests per minute and per day (it varies by model and changes over time — check the live numbers at [aistudio.google.com](https://aistudio.google.com)). For a few people running occasional evaluations, this is generally more than enough. If the limit is hit, the app shows an error asking to wait a minute or use a different key.
- **Shared quota.** Everyone using your deployed link shares the same free-tier allowance, since they're all using the one key baked into the page. Fine for a small, known group; if usage grows, see "scaling up" below.
- **Data usage.** On the free tier, Google may use submitted data to improve their products — this is the tradeoff for $0 cost. If you're screening real candidates' resumes, make sure that's acceptable, or have people use their own key on a billed project instead (billed usage has different data-handling terms — check Google's current terms before relying on this).
- **The key is visible in your page's source.** Anyone can view it via the browser's dev tools. That's why step 2 (no billing enabled) matters — it caps the worst case at "someone else uses up the free quota," never "someone else runs up a bill."

### Prefer people to use their own key instead?

Each person can get their own free key in under a minute at the same link above, then paste it into the app's **Settings** panel (checking "remember" saves it in their browser for next time). This avoids shared rate-limit contention and keeps the shared key out of the picture entirely — leave `SHARED_FREE_KEY` as the placeholder and everyone will be prompted for their own.

### Scaling up beyond "a few people, occasionally"

If this grows into heavier or public use, the free tier's shared rate limit will start to bite. At that point the standard fix is a small backend (e.g. a Cloudflare Worker or Vercel function) that holds the key server-side instead of in the page — happy to help build that when you're there.

## File structure

```
cv-screening-desk/
├── index.html   # everything: markup, styles, and all app logic in one file
└── README.md
```

Keeping it to one file is deliberate — GitHub's drag-and-drop uploader can silently nest a dragged *folder* one level too deep, which breaks relative links to separate CSS/JS files. A single file has nothing to break.

## Run it locally first (optional but recommended)

You can't just double-click `index.html` in some browsers because of file:// restrictions — serve it with any tiny local server:

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
5. Drag in `index.html` (with your key already pasted in) and `README.md` — just the two files, not a folder.
6. Scroll down, click **Commit changes**.
7. Go to the repo's **Settings** tab → **Pages** (left sidebar).
8. Under "Build and deployment," set **Source** to **Deploy from a branch**, branch **main**, folder **/(root)**, then **Save**.
9. Wait about a minute, then refresh — GitHub shows the live URL at the top of that Pages settings screen, something like:
   `https://<your-username>.github.io/cv-screening-desk/`
10. Open that URL and try it — no key entry needed, it should just work.

### Already have a repo with an older version of this app?

Open the repo on GitHub, delete any `css` and `js` folders if present (open each file inside them, click the trash icon, commit), then open `index.html`, click the pencil (edit) icon, delete everything, and paste in this new version. Commit — Pages redeploys automatically within a minute.

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

- **Default model / weighting / rating bands:** edit the prompt text inside the `<script>` block (`buildSystemPrompt`).
- **Which Gemini model is used by default:** change the `value` on the model field in the Settings drawer markup, or just type a different model name into that field in the running app.
- **Colors and type:** edit the CSS custom properties at the top of the `<style>` block (`:root { ... }`).
- **Max candidates:** there's no hard cap in the code; very large batches (15–20 detailed resumes) may need a higher "Max output tokens" value in Settings if a run gets cut off.

## Limitations to keep in mind

- This is a decision **aid**, not a hiring decision. Scores come from a language model reading text you provide — validate mandatory-criteria gaps and headline claims before acting on them, especially for candidates near a cutoff score.
- PDF/DOCX parsing happens client-side; scanned (image-only) PDFs with no embedded text layer won't extract — paste the resume text manually in that case.
- Free-tier rate limits and model availability change over time at Google's discretion — if the app stops responding, check the current free-tier model list at aistudio.google.com and update the model field.
