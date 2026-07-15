const { GoogleGenAI, Type } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
  console.error(
    '❌ GEMINI_API_KEY is not set. Check that server/.env exists, contains ' +
    'GEMINI_API_KEY=..., and that require("dotenv").config() runs at the ' +
    'very top of server.js before anything else.'
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gemini's responseSchema constrains the model at the API level to return
// exactly this shape — no markdown fences, no stray text to strip, and no
// risk of malformed JSON the way a plain prompt-based approach could produce.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    extractedData: {
      type: Type.OBJECT,
      properties: {
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        experienceLevel: { type: Type.STRING, enum: ['Fresher', 'Experienced'] },
      },
      required: ['email', 'phone', 'skills', 'experienceLevel'],
    },
    score: {
      type: Type.OBJECT,
      properties: {
        atsScore: { type: Type.NUMBER },
        matchPercentage: { type: Type.NUMBER },
      },
      required: ['atsScore', 'matchPercentage'],
    },
    skillsAnalysis: {
      type: Type.OBJECT,
      properties: {
        matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['matchedSkills', 'missingSkills'],
    },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['extractedData', 'score', 'skillsAnalysis', 'suggestions'],
};

const SYSTEM_INSTRUCTION = `You are an expert ATS (Applicant Tracking System) and technical recruiter. You analyze a resume against a specific job description and return a structured, honest assessment.

Scoring rules:
- atsScore (0-100): overall fit considering keyword/skill alignment, resume structure (clear sections, quantifiable achievements), and relevance of experience level to the role.
- matchPercentage (0-100): specifically what fraction of the job description's key requirements are evidenced in the resume.
- Be honest and specific. Do not default to a generous score. A resume genuinely missing core requirements should score low.

Skill extraction rules:
- Extract skills mentioned in the JOB DESCRIPTION itself (not a fixed list) — technologies, tools, frameworks, languages, methodologies, certifications, explicitly required soft skills.
- Normalize synonyms (e.g. "ReactJS" / "React.js" / "react" -> "React"; "JS" -> "JavaScript").
- matchedSkills: job-required skills that ARE evidenced in the resume.
- missingSkills: job-required skills that are NOT evidenced in the resume.

Suggestions rules:
- 3-6 specific, actionable suggestions tied to what's actually missing or weak in THIS resume for THIS job — not generic advice.
- Reference specific missing skills, weak sections, or missing quantifiable achievements by name.`;

async function analyzeWithAI(resumeText, jobDescription) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set — check server/.env and dotenv setup in server.js');
  }

  const prompt = `RESUME TEXT:
${resumeText.slice(0, 8000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 4000)}

Analyze this resume against this job description.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const parsed = JSON.parse(response.text);

  // Belt-and-suspenders shape check even though the schema should guarantee
  // this — protects against edge cases like an empty/blocked response.
  if (
    !parsed.extractedData ||
    !parsed.score ||
    !parsed.skillsAnalysis ||
    !Array.isArray(parsed.suggestions)
  ) {
    throw new Error('Gemini response missing required fields');
  }

  return parsed;
}

module.exports = { analyzeWithAI };