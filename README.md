# CV Screening Desk — No-Key Edition

Upload a job description and up to ~30 resumes, get a ranked top-10 shortlist. **No API key, no account, no cost — and nothing is ever sent anywhere.** Every bit of matching happens as plain JavaScript in your browser.

Same single-file, zero-build-step design as before: it's one `index.html` you can open locally or host for free on GitHub Pages.

## How it's different from the AI version

There's no language model involved at all. Instead of an AI reading and judging each resume, this version:

1. Auto-extracts likely requirements from your JD (skills, tools, qualifications), boosting anything near words like "required," "must," or "proficient."
2. Lets you review and edit that list — remove noise, add anything missing, and mark true must-haves as **Required** (weighted twice as heavily as **Preferred**).
3. Scores each resume as: **70%** how many of those requirements it contains (with light synonym handling — "JS"/"JavaScript," "Excel"/"MS Excel," etc.) **+ 30%** overall text similarity to the JD.
4. Ranks everyone and shows the top 10.

It's the same technique most real ATS keyword filters use — fast and genuinely free, but it can't read for meaning. The app says this plainly in its "How this works" panel and again on the results screen, and it's worth taking seriously: a resume that lists relevant keywords will score well even if it's thin, and a resume that describes real experience in different words than your JD can score lower than it deserves. Treat the shortlist as a fast first pass to read yourself, not a final decision — especially for anyone near the cutoff.

## Deploy to GitHub Pages

Same process as before:

1. Create a new repo on [github.com](https://github.com) (or reuse your existing one).
2. Upload `index.html` (and this README) — just the one file, no folders.
3. Commit.
4. Settings → Pages → Source: **Deploy from a branch**, branch **main**, folder **/(root)** → Save.
5. Wait ~1 minute, refresh, and your live URL appears at the top of that Pages screen.

No key to paste anywhere this time — it works the moment it's live.

## Getting good results

- Spend a minute on the **Requirements** step before running. The auto-extraction is a starting point, not gospel — remove anything irrelevant, add anything it missed, and mark real must-haves as Required.
- For 30 resumes, uploading files via the drag-and-drop zone (rather than pasting each one) is much faster.
- Use the top-10 list to build your reading shortlist, not to make the final call.

## Customizing

- **Synonym dictionary, stopwords, scoring weights (70/30 split), Required-vs-Preferred weighting (2x vs 1x):** all near the top of the `<script>` block, clearly labeled.
- **Colors and type:** CSS custom properties at the top of the `<style>` block.
