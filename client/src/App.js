import { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const clearAll = () => {
    setFile(null);
    setFileName("");
    setJobDesc("");
    setResult(null);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!file || !jobDesc.trim()) {
      setError("Please upload a PDF resume and paste job description");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDesc);

    try {
      const res = await axios.post('http://localhost:5000/api/resume/analyze', formData);
      setResult(res.data);
    } catch (err) {
      setError("Failed to analyze resume. Please check your file and try again.");
      console.error(err);
    }
    setLoading(false);
  };

  const downloadReport = () => {
    if (!result) return;

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Smart Resume Analyzer - Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${date}`, 20, 35);

    doc.setFontSize(16);
    doc.text(`ATS Score: ${result.score.atsScore}%`, 20, 50);

    doc.setFontSize(14);
    doc.text("Skills Detected:", 20, 65);
    doc.setFontSize(12);
    doc.text(result.extractedData.skills.join(", "), 20, 75);

    doc.setFontSize(14);
    doc.text("Suggestions to Improve:", 20, 95);
    let y = 105;
    result.suggestions.forEach((suggestion, i) => {
      doc.text(`${i + 1}. ${suggestion}`, 20, y);
      y += 10;
    });

    doc.setFontSize(10);
    doc.text("Built with MERN Stack | Smart Resume Analyzer", 20, 280);

    doc.save(`Resume_Analysis_${date}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">Smart Resume Analyzer</h1>
          <p className="text-xl text-gray-600">AI-powered ATS Compatibility Checker</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-semibold mb-6">Upload Resume</h2>

            <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 transition">
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-4xl mb-3 block">📄</span>
              <p className="font-medium">Click to upload PDF resume</p>
              <p className="text-sm text-gray-500 mt-1">Max 10MB</p>
            </label>

            {fileName && (
              <p className="mt-4 text-sm text-green-600 font-medium text-center">
                ✅ {fileName}
              </p>
            )}

            <h2 className="text-2xl font-semibold mt-10 mb-4">Job Description</h2>
            <textarea
              rows="11"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              className="w-full border border-gray-300 p-5 rounded-2xl focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Paste the full job description here..."
            />

            <div className="flex gap-3 mt-8">
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg transition disabled:opacity-70"
              >
                {loading ? "Analyzing..." : "Analyze Resume"}
              </button>

              <button 
                onClick={clearAll}
                className="px-6 bg-gray-200 hover:bg-gray-300 rounded-2xl font-medium"
              >
                Clear
              </button>
            </div>

            {error && <p className="text-red-500 text-center mt-4 font-medium">{error}</p>}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="bg-white p-8 rounded-3xl shadow-xl">
                {/* ATS Score */}
                <div className="flex justify-center mb-10">
                  <div className="relative w-52 h-52">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-7xl font-bold text-blue-600">
                          {result.score.atsScore}
                        </div>
                        <div className="text-xl -mt-2">/100</div>
                      </div>
                    </div>
                    <svg className="w-52 h-52 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="14"/>
                      <circle 
                        cx="60" cy="60" r="54" 
                        fill="none" 
                        stroke="#2563eb" 
                        strokeWidth="14"
                        strokeDasharray={`${result.score.atsScore * 3.4} 340`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-green-600 font-semibold mb-3">✅ Matched Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.skillsAnalysis.matchedSkills.map((skill, i) => (
                        <span key={i} className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-red-600 font-semibold mb-3">❌ Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.skillsAnalysis.missingSkills.map((skill, i) => (
                        <span key={i} className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">💡 Suggestions to Improve</h3>
                  <ul className="space-y-3 text-gray-700">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-blue-500">→</span> {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={downloadReport}
                  className="mt-10 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg transition flex items-center justify-center gap-2"
                >
                  📥 Download Complete Analysis Report (PDF)
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xl">
                Your analysis result will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;