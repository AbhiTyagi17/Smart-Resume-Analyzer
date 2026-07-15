const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const { extractData, calculateScore, getSuggestions, getSkillsAnalysis } = require('../utils/resumeUtils');
const { analyzeWithAI } = require('../utils/aiAnalyzer');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are accepted'));
    }
    cb(null, true);
  },
});

router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!req.body.jobDescription) return res.status(400).json({ error: 'Job description required' });

    const pdfData = await pdf(req.file.buffer);
    const resumeText = pdfData.text;
    const jobDescription = req.body.jobDescription;

    if (!resumeText.trim()) {
      return res.status(400).json({ error: 'Could not extract any text from this PDF. It may be a scanned image — try a text-based PDF instead.' });
    }

    let analysis;
    let usedFallback = false;
    let fallbackReason = null;

    try {
      analysis = await analyzeWithAI(resumeText, jobDescription);
    } catch (aiError) {
      // AI call failed (no API key, rate limit, malformed response, network
      // issue, etc.) — degrade gracefully to the original heuristic pipeline
      // instead of failing the whole request.
      console.error('⚠️ AI analysis failed, falling back to heuristic analysis:', aiError.message);
      usedFallback = true;
      fallbackReason = aiError.message;

      const lowerResume = resumeText.toLowerCase();
      const lowerJobDesc = jobDescription.toLowerCase();

      analysis = {
        extractedData: extractData(lowerResume),
        score: calculateScore(lowerResume, lowerJobDesc),
        skillsAnalysis: getSkillsAnalysis(lowerResume, lowerJobDesc),
        suggestions: getSuggestions(lowerResume, lowerJobDesc),
      };
    }

    res.json({
      success: true,
      usedFallback,
      fallbackReason,
      ...analysis,
    });
  } catch (error) {
    console.error('🔥 Analysis Error:', error.message);
    res.status(500).json({ error: 'Failed to analyze resume', message: error.message });
  }
});

module.exports = router;