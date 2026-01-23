import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import './App.css';

const LANGUAGES = [
  { key: 'python', label: '🐍 Python', id: 71 },
  { key: 'javascript', label: '🟨 JS (Node)', id: 63 },
  { key: 'java', label: '☕ Java', id: 62 },
  { key: 'c', label: '🔵 C', id: 50 },
  { key: 'cpp', label: '🟦 C++', id: 54 },
  { key: 'html', label: '🌐 HTML' },
  { key: 'css', label: '🎨 CSS' },
  { key: 'js', label: '⚡ JS (Browser)' },
];

export default function App() {
  const [language, setLanguage] = useState('python');

  const [code, setCode] = useState({
    html: '',
    css: '',
    js: '',
    javascript: '',
    other: '',
  });

  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [browserLogs, setBrowserLogs] = useState('');
  const [history, setHistory] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);

  const languageMap = {
    c: 50,
    cpp: 54,
    java: 62,
    python: 71,
    javascript: 63,
  };

  /* ✅ Correct code selection */
  const selectedCode =
    language === 'javascript'
      ? code.javascript
      : ['html', 'css', 'js'].includes(language)
      ? code[language]
      : code.other;

  /* ✅ canRun logic */
  const canRun =
    language in languageMap &&
    (language === 'javascript'
      ? code.javascript.trim().length > 0
      : code.other.trim().length > 0);

  /* ⏎ Ctrl + Enter */
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'Enter' && canRun) {
        handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canRun, code]);

  /* ▶ Run compiled code */
  const handleRun = async () => {
    if (!canRun) return;

    try {
      const source =
        language === 'javascript' ? code.javascript : code.other;

      const res = await axios.post('/run-code', {
        language_id: languageMap[language],
        source_code: source,
        stdin,
      });

      const result = res.data.output || '⚠️ No output';
      setOutput(result);

      setHistory((prev) => [
        {
          lang: language,
          output: result,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      setOutput('❌ Error: ' + (err.response?.data?.output || err.message));
    }
  };

  /* 🗑 Delete current language only */
  const handleDeleteCurrent = () => {
    setCode((prev) => ({
      ...prev,
      [language === 'html'
        ? 'html'
        : language === 'css'
        ? 'css'
        : language === 'js'
        ? 'js'
        : language === 'javascript'
        ? 'javascript'
        : 'other']: '',
    }));

    setOutput('');
    setBrowserLogs('');
    setStdin('');
  };

  /* 🌐 Capture browser console.log */
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === 'console-log') {
        setBrowserLogs((prev) => prev + event.data.message + '\n');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  /* 🔁 Language change logic (FINAL FIX ✅) */
  const handleLanguageChange = (langKey) => {
    setLanguage(langKey);
    setOutput('');
    setBrowserLogs('');
    setStdin('');

    setCode((prev) => ({
      html: prev.html, // ✅ keep
      css: prev.css,   // ✅ keep
      js: prev.js,     // ✅ keep (browser JS)

      javascript: langKey === 'javascript' ? '' : prev.javascript,
      other: ['python', 'java', 'c', 'cpp'].includes(langKey) ? '' : prev.other,
    }));
  };

  return (
    <div className={`app ${fullscreen ? 'fullscreen' : ''}`}>
      <header className="header">
        <h1>⚡ Online Code Editor</h1>
        <p>Live Server + Compiler</p>
      </header>

      {/* Language Bar */}
      <div className="lang-bar">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.key}
            className={language === lang.key ? 'lang active' : 'lang'}
            onClick={() => handleLanguageChange(lang.key)}
          >
            {lang.label}
          </button>
        ))}

        <button className="fs-btn" onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? '🗗 Exit' : '🗖 Fullscreen'}
        </button>

        <button className="delete-btn" onClick={handleDeleteCurrent}>
          🗑 Delete Code
        </button>
      </div>

      {/* Editor */}
      <div className="editor-card">
        <Editor
          height={fullscreen ? '80vh' : '45vh'}
          language={language === 'js' ? 'javascript' : language}
          theme="vs-dark"
          value={selectedCode}
          onChange={(value) => {
            const key =
              language === 'javascript'
                ? 'javascript'
                : ['html', 'css', 'js'].includes(language)
                ? language
                : 'other';
            setCode((prev) => ({ ...prev, [key]: value || '' }));
          }}
        />
      </div>

      {/* 🌐 LIVE SERVER */}
      {(language === 'html' || language === 'css' || language === 'js') && (
        <div className="output-card">
          <h3>🌐 Live Preview</h3>
          <iframe
            title="preview"
            style={{
              width: '100%',
              height: '350px',
              borderRadius: '8px',
              border: '1px solid #222',
              background: '#fff',
            }}
            srcDoc={`
<!DOCTYPE html>
<html>
<head>
  <style>${code.css}</style>
</head>
<body>
  ${code.html}

  <script>
    (function () {
      const oldLog = console.log;
      console.log = function (...args) {
        oldLog.apply(console, args);
        window.parent.postMessage(
          { type: 'console-log', message: args.join(' ') },
          '*'
        );
      };
    })();
  </script>

  <script>${code.js}</script>
</body>
</html>
`}
          />
        </div>
      )}

      {/* Input */}
      {language in languageMap && (
        <div className="input-card">
          <h3>⌨ Input (stdin)</h3>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
          />
          <button className="clear-btn" onClick={() => setStdin('')}>
            Clear Input
          </button>
        </div>
      )}

      {/* Run Button */}
      <button
        className={`run-btn ${
          !(language in languageMap) || !canRun ? 'disabled' : ''
        }`}
        disabled={!(language in languageMap) || !canRun}
        onClick={handleRun}
      >
        {language in languageMap ? '▶ Run Code (Ctrl+Enter)' : '🌐 Live Server'}
      </button>

      {/* Output */}
      {language in languageMap && (
        <div className="output-card">
          <h3>🖥 Output</h3>
          <pre>{output || 'Run code to see output...'}</pre>
          <button className="clear-btn" onClick={() => setOutput('')}>
            Clear Output
          </button>
        </div>
      )}

      {/* Browser Console */}
      {language === 'js' && (
        <div className="output-card">
          <h3>🖥 Browser Console</h3>
          <pre>{browserLogs || 'No console output yet...'}</pre>
          <button className="clear-btn" onClick={() => setBrowserLogs('')}>
            Clear Console
          </button>
        </div>
      )}

      {/* History */}
      <div className="history-card">
        <h3>📜 Execution History</h3>
        {history.map((item, i) => (
          <div
            key={i}
            className="history-item"
            onClick={() => setOutput(item.output)}
          >
            <span>{item.lang}</span>
            <span>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
