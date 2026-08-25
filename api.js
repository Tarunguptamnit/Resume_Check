/* ============================================================
   api.js
   Builds the evaluation prompt (adapted from the recruiter
   evaluation framework, restructured for JSON output) and calls
   the Anthropic Messages API directly from the browser.
   ============================================================ */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/** The evaluation methodology, kept faithful to the original framework. */
function buildSystemPrompt() {
  return `You are an experienced HR recruiter and ATS-style candidate evaluator.

Task: Evaluate the supplied candidate resumes against the supplied Job Description (JD), score every candidate objectively, and identify the top candidates for priority interview shortlisting.

## Evaluation Principles
- Evaluate only evidence explicitly available in the JD and CV. Do not invent experience, qualifications, achievements, or skills.
- Use the JD's mandatory requirements as higher-priority filters than preferred requirements.
- Consider transferable skills, but state clearly when they are transferable rather than directly demonstrated.
- Be consistent: apply the same scoring standard to every resume.
- Do not use or infer protected characteristics, including age, gender, caste, religion, marital status, disability, ethnicity, nationality, photo, or name-based assumptions.
- Treat candidate names/IDs as labels only. Assess job-related qualifications only.
- Flag major risks such as missing mandatory qualifications, insufficient relevant experience, unexplained role mismatch, or unsupported claims.

## Step 1: Extract JD Criteria
Convert the JD into a weighted evaluation matrix totaling 100 points.

Use this default weighting, adapting it only when the JD clearly requires a different emphasis:
- Mandatory skills / technical competencies: 30 points
- Relevant work experience and domain fit: 25 points
- Key responsibilities / role-specific evidence: 15 points
- Education, certifications, and mandatory eligibility: 10 points
- Tools, analytics, communication, and stakeholder skills: 10 points
- Quantified achievements and impact: 5 points
- Preferred qualifications / cultural or team fit evidence: 5 points

For each criterion, label it as one of: "Mandatory", "Strongly preferred", "Preferred".

State any knockout criteria. A candidate who misses a true mandatory requirement should be marked "Not Recommended" unless the JD indicates equivalent experience is acceptable.

## Step 2: Score Each Resume
For every candidate, determine: total score out of 100, rating band, mandatory-criteria status, a requirement-by-requirement score with evidence, top strengths (max 3), key gaps/risks (max 3), a shortlisting decision, and a one-sentence recruiter rationale.

Rating bands:
- 90-100: Exceptional match — priority interview
- 80-89: Strong match — shortlist
- 70-79: Good match — consider if interview capacity permits
- 60-69: Partial match — hold / talent pool
- Below 60: Weak match — do not prioritize

Decisions: "Priority Interview", "Shortlist", "Hold / Secondary Review", "Not Recommended".

## Step 3: Rank All Candidates
Rank every candidate in descending order of total score. For candidates with equal scores, break ties in this order: (1) meets more mandatory requirements, (2) more directly relevant experience, (3) more quantified and recent achievements, (4) better evidence of core tools and responsibilities in the JD. Apply this tie-break yourself and return the already-resolved order.

## Step 4: Top Priority Candidates
Identify the top candidates (up to 5, fewer if the pool is smaller or weak) for a detailed priority list: why they fit the JD, key CV evidence, risks to validate at interview, recommended next step, a concise 3-5 line HR assessment, two targeted interview questions designed to validate the most important skill or close the biggest evidence gap, and a recommended interview priority ("Immediate", "First Round", or "Backup Shortlist").

## Step 5: Hiring Recommendation
Conclude with: the recommended interview order for the top candidates, common skill gaps across the applicant pool, whether the applicant pool sufficiently meets the JD or sourcing should continue, and any JD requirements that appear unrealistically restrictive or unclear based on the resumes actually received.

## Output format — CRITICAL
Respond with ONLY a single valid JSON object. No markdown, no code fences, no commentary before or after it. The JSON must match this exact shape:

{
  "jd_matrix": {
    "criteria": [
      { "name": string, "category": "Mandatory" | "Strongly preferred" | "Preferred", "weight": number, "description": string }
    ],
    "knockout_criteria": [string]
  },
  "candidates": [
    {
      "id": string,
      "total_score": number,
      "rating_band": string,
      "mandatory_status": "Meets" | "Partially Meets" | "Does Not Meet",
      "requirement_scores": [
        { "requirement": string, "score": number, "max": number, "evidence": string }
      ],
      "strengths": [string],
      "gaps": [string],
      "decision": "Priority Interview" | "Shortlist" | "Hold / Secondary Review" | "Not Recommended",
      "rationale": string
    }
  ],
  "ranking": [
    { "rank": number, "id": string, "score": number, "rating": string, "mandatory": string, "decision": string, "reason": string }
  ],
  "top_candidates": [
    {
      "priority": number,
      "id": string,
      "score": number,
      "why_fits": string,
      "key_evidence": string,
      "risks": string,
      "next_step": string,
      "hr_assessment": string,
      "interview_questions": [string, string],
      "interview_priority": "Immediate" | "First Round" | "Backup Shortlist"
    }
  ],
  "hiring_recommendation": {
    "interview_order": [string],
    "common_gaps": [string],
    "pool_sufficiency": string,
    "unrealistic_requirements": string
  }
}

Rules for the JSON:
- "ranking" must include every candidate provided, in final ranked order.
- "candidates" must include every candidate provided, in the same order as "ranking".
- Use "Not stated in resume" (as a string, inside the relevant field) wherever information is missing rather than inventing it.
- Keep strings factual and concise. Do not use markdown formatting inside string values.
- Output nothing outside the JSON object.`;
}

/** Format the JD + all candidates into the user turn. */
function buildUserPrompt(jdText, candidates) {
  const resumeBlocks = candidates
    .map((c, i) => `Resume ${i + 1} — ${c.id || `Candidate ${i + 1}`}\n${c.text}`)
    .join("\n\n---\n\n");

  return `## Job Description\n\n${jdText}\n\n## Candidate Resumes (${candidates.length} total)\n\n${resumeBlocks}`;
}

/**
 * Calls the Anthropic API directly from the browser.
 * Requires the "anthropic-dangerous-direct-browser-access" header since
 * this is a client-only app with no backend proxy.
 */
async function callClaude({ apiKey, model, maxTokens, jdText, candidates }) {
  const body = {
    model,
    max_tokens: maxTokens,
    system: buildSystemPrompt(),
    messages: [
      { role: "user", content: buildUserPrompt(jdText, candidates) }
    ]
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errJson = await response.json();
      detail = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      detail = await response.text();
    }
    throw new Error(`Anthropic API error (${response.status}): ${detail}`);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!text.trim()) {
    throw new Error("The model returned no text content. Try again or increase max output tokens.");
  }

  return parseModelJson(text);
}

/** Parse the model's JSON, tolerating stray fences or leading/trailing text. */
function parseModelJson(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // fall back to extracting the outermost { ... } block
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (e2) {
        throw new Error("Couldn't parse the model's response as JSON. It may have been cut off — try raising max output tokens in Settings, or re-run.");
      }
    }
    throw new Error("Couldn't parse the model's response as JSON. Try again or raise max output tokens in Settings.");
  }
}
