import { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const COLORS = {
  paper: '#EDE9DF',
  ink: '#1F1B14',
  card: '#FFFFFF',
  line: '#DCD3BE',
  muted: '#8A7F68',
  faint: '#9A9080',
  teal: '#0E6E55',
  tealTint: '#E7F2ED',
  rust: '#B23A18',
  rustTint: '#F7E9E2',
  gold: '#A9791F',
  goldTint: '#F5EFDF',
};

const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";
const FONT_SERIF = "'Fraunces', Georgia, serif";
const FONT_SANS = "'IBM Plex Sans', system-ui, sans-serif";

const getVerdict = (score) => {
  if (score >= 75) return { label: 'STRONG MATCH', color: COLORS.teal, tint: COLORS.tealTint };
  if (score >= 50) return { label: 'NEEDS REVIEW', color: COLORS.gold, tint: COLORS.goldTint };
  return { label: 'WEAK MATCH', color: COLORS.rust, tint: COLORS.rustTint };
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
      setError(
        err.response?.data?.error || 'Failed to analyze resume. Please check your file and try again.'
      );
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
    doc.text(`ATS Score: ${result.score.atsScore}%  -  ${verdict.label}`, 20, 42);

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

  // ---- Reusable inline style objects ----
  const tabLabel = {
    display: 'inline-block',
    background: COLORS.ink,
    color: COLORS.paper,
    fontFamily: FONT_MONO,
    fontSize: '11px',
    letterSpacing: '2px',
    fontWeight: 600,
    padding: '4px 14px',
    borderRadius: '4px 4px 0 0',
    marginLeft: '20px',
  };

  const card = {
    background: COLORS.card,
    border: `1px solid ${COLORS.line}`,
    borderRadius: '8px',
    padding: '28px',
    boxShadow: `0 1px 0 ${COLORS.line}`,
  };

  const skillPill = (bg, color) => ({
    display: 'inline-block',
    background: bg,
    color,
    fontFamily: FONT_MONO,
    fontSize: '12px',
    padding: '6px 12px',
    borderRadius: '5px',
    marginRight: '8px',
    marginBottom: '8px',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.paper,
        padding: '48px 20px',
        fontFamily: FONT_SANS,
        color: COLORS.ink,
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Masthead */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottom: `2px solid ${COLORS.ink}`,
            paddingBottom: '18px',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <p style={{ fontFamily: FONT_MONO, fontSize: '11px', letterSpacing: '3px', color: COLORS.muted, margin: '0 0 8px' }}>
              APPLICANT TRACKING REVIEW
            </p>
            <h1 style={{ fontFamily: FONT_SERIF, fontSize: '38px', fontWeight: 700, margin: 0 }}>
              Smart Resume Analyzer
            </h1>
          </div>
          <p style={{ fontFamily: FONT_MONO, fontSize: '12px', color: COLORS.muted, margin: 0 }}>
            FILE OPENED {new Date().toLocaleDateString()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* ---------- Intake panel ---------- */}
          <div style={{ flex: '1 1 380px' }}>
            <div style={tabLabel}>INTAKE</div>
            <div style={{ ...card, borderTopLeftRadius: 0, marginTop: '-1px' }}>
              <label
                style={{
                  display: 'block',
                  border: `2px dashed ${file ? COLORS.teal : '#C9BFA6'}`,
                  borderRadius: '6px',
                  padding: '28px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>📄</span>
                <p style={{ fontWeight: 500, margin: 0 }}>{fileName ? 'Replace resume PDF' : 'Attach resume (PDF)'}</p>
                <p style={{ fontSize: '12px', color: COLORS.faint, marginTop: '4px' }}>Max 10MB</p>
              </label>

              {fileName && (
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    background: COLORS.tealTint,
                    color: COLORS.teal,
                    padding: '8px 12px',
                    borderRadius: '5px',
                  }}
                >
                  <span>✓</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileName}
                  </span>
                </div>
              )}

              <p style={{ fontFamily: FONT_MONO, fontSize: '11px', letterSpacing: '2px', fontWeight: 600, color: COLORS.muted, marginTop: '28px', marginBottom: '10px' }}>
                TARGET ROLE — JOB DESCRIPTION
              </p>
              <textarea
                rows="10"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                style={{
                  width: '100%',
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: '6px',
                  padding: '14px',
                  fontSize: '14px',
                  fontFamily: FONT_SANS,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: COLORS.ink,
                }}
                placeholder="Paste the full job description here…"
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    letterSpacing: '0.5px',
                    background: COLORS.ink,
                    color: COLORS.paper,
                    cursor: loading ? 'default' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'ANALYZING…' : 'RUN ANALYSIS'}
                </button>
                <button
                  onClick={clearAll}
                  style={{
                    padding: '14px 20px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.line}`,
                    background: 'transparent',
                    color: '#6B6252',
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>

              {error && (
                <p style={{ color: COLORS.rust, fontSize: '13px', marginTop: '16px' }}>⚠ {error}</p>
              )}
            </div>
          </div>

          {/* ---------- Report panel ---------- */}
          <div style={{ flex: '2 1 480px' }}>
            {result ? (
              <>
                <div style={tabLabel}>ANALYSIS REPORT</div>
                <div style={{ ...card, borderTopLeftRadius: 0, marginTop: '-1px' }}>
                  {result.usedFallback && (
                    <div
                      style={{
                        background: COLORS.goldTint,
                        color: '#7A5A10',
                        fontSize: '13px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        marginBottom: '20px',
                      }}
                    >
                      ⚠ AI analysis was unavailable, so this result used the basic keyword-matching
                      fallback (less accurate).
                      {result.fallbackReason && (
                        <div style={{ fontFamily: FONT_MONO, fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>
                          Reason: {result.fallbackReason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verdict */}
                  {(() => {
                    const verdict = getVerdict(result.score.atsScore);
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '24px',
                          marginBottom: '28px',
                          paddingBottom: '28px',
                          borderBottom: `1px solid #EFE9DA`,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            width: '104px',
                            height: '104px',
                            borderRadius: '50%',
                            border: `4px double ${verdict.color}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: verdict.color,
                            fontFamily: FONT_MONO,
                            transform: 'rotate(-8deg)',
                            boxSizing: 'border-box',
                          }}
                        >
                          <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>
                            {result.score.atsScore}
                          </span>
                          <span style={{ fontSize: '10px', marginTop: '2px' }}>/ 100</span>
                        </div>
                        <div>
                          <p style={{ fontFamily: FONT_MONO, fontSize: '11px', letterSpacing: '2px', color: COLORS.faint, margin: '0 0 4px' }}>
                            VERDICT
                          </p>
                          <p style={{ fontFamily: FONT_SERIF, fontSize: '24px', fontWeight: 700, color: verdict.color, margin: 0 }}>
                            {verdict.label}
                          </p>
                          <p style={{ fontSize: '13px', color: '#6B6252', marginTop: '6px' }}>
                            Keyword overlap: {result.score.matchPercentage}%
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Skills */}
                  <div style={{ display: 'flex', gap: '32px', marginBottom: '28px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <h4 style={{ fontFamily: FONT_MONO, fontSize: '11px', letterSpacing: '2px', color: COLORS.teal, marginBottom: '10px' }}>
                        ✓ MATCHED SKILLS
                      </h4>
                      <div>
                        {result.skillsAnalysis.matchedSkills.length ? (
                          result.skillsAnalysis.matchedSkills.map((skill, i) => (
                            <span key={i} style={skillPill(COLORS.tealTint, COLORS.teal)}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '13px', color: COLORS.faint }}>None found</span>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: '1 1 200px' }}>
                      <h4 style={{ fontFamily: FONT_MONO, fontSize: '11px', letterSpacing: '2px', color: COLORS.rust, marginBottom: '10px' }}>
                        ✕ MISSING SKILLS
                      </h4>
                      <div>
                        {result.skillsAnalysis.missingSkills.length ? (
                          result.skillsAnalysis.missingSkills.map((skill, i) => (
                            <span key={i} style={skillPill(COLORS.rustTint, COLORS.rust)}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '13px', color: COLORS.faint }}>None — full coverage</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div style={{ marginBottom: '28px' }}>
                    <h3 style={{ fontFamily: FONT_MONO, fontSize: '11px', letterSpacing: '2px', color: COLORS.muted, marginBottom: '14px' }}>
                      REVIEWER NOTES
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', marginBottom: '12px', color: '#3A342A' }}>
                          <span style={{ fontFamily: FONT_MONO, fontSize: '12px', color: COLORS.faint, flexShrink: 0 }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={downloadReport}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: COLORS.teal,
                      color: COLORS.paper,
                      fontWeight: 600,
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                    }}
                  >
                    ↓ DOWNLOAD FULL REPORT (PDF)
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  minHeight: '380px',
                  border: `2px dashed #D6CDB6`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.faint,
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                <span style={{ fontSize: '32px', marginBottom: '10px' }}>🗂</span>
                <p style={{ fontFamily: FONT_MONO, fontSize: '13px', margin: 0 }}>AWAITING SUBMISSION</p>
                <p style={{ fontSize: '12px', marginTop: '6px', maxWidth: '260px' }}>
                  Attach a resume and paste a job description to open a report.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;