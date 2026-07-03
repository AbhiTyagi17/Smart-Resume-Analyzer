const extractData = (text) => {
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
  const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g;

  const skillsRegex =
    /(react|node\.?js|javascript|python|java|mongodb|express|tailwind|html|css|sql|git|aws|docker|typescript|next\.?js|flutter|angular|redux|firebase|mysql|postgresql)/gi;

  const skills = [...new Set(text.match(skillsRegex) || [])];

  return {
    email: text.match(emailRegex)?.[0] || "Not found",
    phone: text.match(phoneRegex)?.[0] || "Not found",
    skills: skills.length > 0 ? skills : ["No skills detected"],
    experienceLevel:
      text.includes("year") ||
      text.includes("yrs") ||
      text.includes("experience")
        ? "Experienced"
        : "Fresher",
  };
};

const calculateScore = (resumeText, jobDesc) => {
  const jobWords = jobDesc.split(/\s+/).filter((w) => w.length > 3);
  let matchCount = 0;

  jobWords.forEach((word) => {
    if (resumeText.includes(word.toLowerCase())) matchCount++;
  });

  const keywordMatch = jobWords.length
    ? Math.round((matchCount / jobWords.length) * 100)
    : 50;
  let atsScore = Math.min(95, keywordMatch + 28);

  if (resumeText.includes("experience") || resumeText.includes("education"))
    atsScore += 7;

  return {
    atsScore: Math.min(98, atsScore),
    matchPercentage: keywordMatch,
  };
};

const getSkillsAnalysis = (resumeText, jobDesc) => {
  const commonSkills = [
    "react",
    "node",
    "javascript",
    "mongodb",
    "express",
    "sql",
    "git",
    "html",
    "css",
    "python",
    "java",
    "aws",
    "docker",
  ];

  const jobSkills = commonSkills.filter((skill) => jobDesc.includes(skill));
  const resumeSkills = commonSkills.filter((skill) =>
    resumeText.includes(skill),
  );

  const matchedSkills = jobSkills.filter((skill) =>
    resumeSkills.includes(skill),
  );
  const missingSkills = jobSkills.filter(
    (skill) => !resumeSkills.includes(skill),
  );

  return { matchedSkills, missingSkills };
};

const getSuggestions = (resumeText, jobDesc) => {
  const suggestions = [];
  const { missingSkills } = getSkillsAnalysis(resumeText, jobDesc);

  missingSkills.forEach((skill) => {
    suggestions.push(`Add "${skill}" skill in your resume`);
  });

  if (!resumeText.includes("achieve") && !resumeText.includes("%")) {
    suggestions.push(
      "Add quantifiable achievements (e.g., 'Increased sales by 40%')",
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("Excellent keyword match! Focus on strong bullet points.");
  }

  return suggestions;
};

module.exports = {
  extractData,
  calculateScore,
  getSuggestions,
  getSkillsAnalysis,
};
