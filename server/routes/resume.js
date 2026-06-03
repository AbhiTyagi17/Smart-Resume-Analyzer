const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const { extractData, calculateScore, getSuggestions, getSkillsAnalysis } = require('../utils/resumeUtils');

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        if (!req.body.jobDescription) return res.status(400).json({ error: "Job description required" });

        const pdfData = await pdf(req.file.buffer);
        const resumeText = pdfData.text.toLowerCase();
        const jobDescription = req.body.jobDescription.toLowerCase();

        const extractedData = extractData(resumeText);
        const score = calculateScore(resumeText, jobDescription);
        const suggestions = getSuggestions(resumeText, jobDescription);
        const skillsAnalysis = getSkillsAnalysis(resumeText, jobDescription);   // ← New

        res.json({
            success: true,
            extractedData,
            score,
            suggestions,
            skillsAnalysis   // ← Sending matched & missing skills
        });

    } catch (error) {
        console.error("🔥 Analysis Error:", error.message);
        res.status(500).json({ error: "Failed to analyze resume", message: error.message });
    }
});

module.exports = router;