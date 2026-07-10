import { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Score tiers drive both the stamp color and its verdict label —
// the visual language of the report is derived directly from the data.
const getVerdict = (score) => {
  if (score >= 75) return { label: 'STRONG MATCH', color: '#0E6E55', tint: '#E7F2ED' };
  if (score >= 50) return { label: 'NEEDS REVIEW', color: '#A9791F', tint: '#F5EFDF' };
  return { label: 'WEAK MATCH', color: '#B23A18', tint: '#F7E9E2' };
};

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError('');
  };

  const clearAll = () => {
    setFile(null);
    setFileName('');
    setJobDesc('');
    setResult(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file || !jobDesc.trim()) {
      setError('Please upload a PDF resume and paste job description');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDesc);

    try {
      const res = await axios.post(`${API_URL}/api/resume/analyze`, formData);
      setResult(res.data);
    } catch (err) {
      setError('Failed to analyze resume. Please check your file and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    const verdict = getVerdict(result.score.atsScore);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Smart Resume Analyzer - Report', 20, 20);

    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text(`Generated on: ${date}`, 20, 28);
    doc.setTextColor(0);

    doc.setFontSize(16);
    doc.text(`ATS Score: ${result.score.atsScore}%  —  ${verdict.label}`, 20, 42);

    doc.setFontSize(14);
    doc.text('Skills Detected:', 20, 58);
    doc.setFontSize(12);
    doc.text(doc.splitTextToSize(result.extractedData.skills.join(', '), 170), 20, 66);

    doc.setFontSize(14);
    doc.text('Suggestions to Improve:', 20, 95);
    let y = 105;
    result.suggestions.forEach((suggestion, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${suggestion}`, 170);
      doc.setFontSize(12);
      doc.text(lines, 20, y);
      y += 8 * lines.length;
    });

    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text('Built with MERN Stack | Smart Resume Analyzer', 20, 285);

    doc.save(`Resume_Analysis_${date}.pdf`);
  };

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ background: '#EDE9DF', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Masthead */}
        <div className="mb-10 flex items-end justify-between border-b-2 pb-5" style={{ borderColor: '#1F1B14' }}>
          <div>
            <p
              className="text-xs tracking-[0.3em] mb-2"
              style={{ color: '#8A7F68', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              APPLICANT TRACKING REVIEW
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold"
              style={{ color: '#1F1B14', fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Smart Resume Analyzer
            </h1>
          </div>
          <p
            className="hidden sm:block text-sm"
            style={{ color: '#8A7F68', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            FILE OPENED {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ---------- Intake panel ---------- */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div
                className="absolute -top-3 left-6 px-4 py-1 text-xs tracking-[0.2em] font-semibold rounded-t-md"
                style={{ background: '#1F1B14', color: '#EDE9DF', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                INTAKE
              </div>
              <div
                className="bg-white rounded-lg p-7 pt-9 border"
                style={{ borderColor: '#DCD3BE', boxShadow: '0 1px 0 #DCD3BE' }}
              >
                <label
                  className="block border-2 border-dashed rounded-md p-7 text-center cursor-pointer transition-colors"
                  style={{ borderColor: file ? '#0E6E55' : '#C9BFA6' }}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-3xl mb-2 block">📄</span>
                  <p className="font-medium" style={{ color: '#1F1B14' }}>
                    {fileName ? 'Replace resume PDF' : 'Attach resume (PDF)'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#9A9080' }}>
                    Max 10MB
                  </p>
                </label>

                {fileName && (
                  <div
                    className="mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded"
                    style={{ background: '#E7F2ED', color: '#0E6E55' }}
                  >
                    <span>✓</span>
                    <span className="font-mono text-xs truncate">{fileName}</span>
                  </div>
                )}

                <p
                  className="text-xs tracking-[0.2em] font-semibold mt-8 mb-3"
                  style={{ color: '#8A7F68', fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  TARGET ROLE — JOB DESCRIPTION
                </p>
                <textarea
                  rows="10"
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  className="w-full border rounded-md p-4 text-sm resize-none focus:outline-none"
                  style={{ borderColor: '#DCD3BE', color: '#1F1B14' }}
                  onFocus={(e) => (e.target.style.borderColor = '#1F1B14')}
                  onBlur={(e) => (e.target.style.borderColor = '#DCD3BE')}
                  placeholder="Paste the full job description here…"
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-md font-semibold text-sm tracking-wide transition disabled:opacity-60"
                    style={{ background: '#1F1B14', color: '#EDE9DF' }}
                  >
                    {loading ? 'ANALYZING…' : 'RUN ANALYSIS'}
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-5 rounded-md font-medium text-sm border transition"
                    style={{ borderColor: '#DCD3BE', color: '#6B6252' }}
                  >
                    Clear
                  </button>
                </div>

                {error && (
                  <p className="text-sm mt-4" style={{ color: '#B23A18' }}>
                    ⚠ {error}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ---------- Report panel ---------- */}
          <div className="lg:col-span-3">
            {result ? (
              <div className="relative animate-[fadeIn_0.4s_ease]">
                <div
                  className="absolute -top-3 left-6 px-4 py-1 text-xs tracking-[0.2em] font-semibold rounded-t-md"
                  style={{ background: '#1F1B14', color: '#EDE9DF', fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  ANALYSIS REPORT
                </div>
                <div
                  className="bg-white rounded-lg p-8 pt-10 border"
                  style={{ borderColor: '#DCD3BE', boxShadow: '0 1px 0 #DCD3BE' }}
                >
                  {/* Verdict stamp */}
                  {(() => {
                    const verdict = getVerdict(result.score.atsScore);
                    return (
                      <div className="flex items-center gap-6 mb-8 pb-8 border-b" style={{ borderColor: '#EFE9DA' }}>
                        <div
                          className="shrink-0 w-28 h-28 rounded-full flex flex-col items-center justify-center border-4"
                          style={{
                            borderColor: verdict.color,
                            borderStyle: 'double',
                            color: verdict.color,
                            transform: 'rotate(-8deg)',
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          <span className="text-3xl font-bold leading-none">{result.score.atsScore}</span>
                          <span className="text-[10px] mt-1">/ 100</span>
                        </div>
                        <div>
                          <p
                            className="text-xs tracking-[0.25em] font-semibold mb-1"
                            style={{ color: '#9A9080', fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            VERDICT
                          </p>
                          <p
                            className="text-2xl font-bold"
                            style={{ color: verdict.color, fontFamily: "'Fraunces', Georgia, serif" }}
                          >
                            {verdict.label}
                          </p>
                          <p className="text-sm mt-1" style={{ color: '#6B6252' }}>
                            Keyword overlap: {result.score.matchPercentage}%
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Skills */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4
                        className="text-xs tracking-[0.2em] font-semibold mb-3"
                        style={{ color: '#0E6E55', fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        ✓ MATCHED SKILLS
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.skillsAnalysis.matchedSkills.length ? (
                          result.skillsAnalysis.matchedSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded text-xs font-mono"
                              style={{ background: '#E7F2ED', color: '#0E6E55' }}
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm" style={{ color: '#9A9080' }}>None found</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4
                        className="text-xs tracking-[0.2em] font-semibold mb-3"
                        style={{ color: '#B23A18', fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        ✕ MISSING SKILLS
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.skillsAnalysis.missingSkills.length ? (
                          result.skillsAnalysis.missingSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded text-xs font-mono"
                              style={{ background: '#F7E9E2', color: '#B23A18' }}
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm" style={{ color: '#9A9080' }}>None — full coverage</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="mb-8">
                    <h3
                      className="text-xs tracking-[0.2em] font-semibold mb-4"
                      style={{ color: '#8A7F68', fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      REVIEWER NOTES
                    </h3>
                    <ul className="space-y-3">
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex gap-3 text-sm" style={{ color: '#3A342A' }}>
                          <span
                            className="shrink-0 font-mono text-xs mt-0.5"
                            style={{ color: '#9A9080' }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={downloadReport}
                    className="w-full py-3.5 rounded-md font-semibold text-sm tracking-wide transition flex items-center justify-center gap-2"
                    style={{ background: '#0E6E55', color: '#EDE9DF' }}
                  >
                    ↓ DOWNLOAD FULL REPORT (PDF)
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="h-full min-h-[420px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed"
                style={{ borderColor: '#D6CDB6', color: '#9A9080' }}
              >
                <span className="text-4xl mb-3">🗂</span>
                <p className="text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  AWAITING SUBMISSION
                </p>
                <p className="text-xs mt-1 max-w-xs text-center">
                  Attach a resume and paste a job description to open a report.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;