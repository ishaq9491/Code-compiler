import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

function App() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState({
    html: '<!-- Write your HTML here -->',
    css: '/* CSS here */',
    javascript: '// JS here',
    other: '// Write your code here',
  });
  const [output, setOutput] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const languageMap = {
    c: 50,
    cpp: 54,
    java: 62,
    python: 71,
    javascript: 63,
  };

  const handleRun = async () => {
    const language_id = languageMap[language];

    if (!language_id) {
      setOutput('⚠️ This language runs in the browser only (HTML/CSS/JS)');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/run-code', {
        language_id,
        source_code: code.other,
        stdin: '',
      });

      setOutput(response.data.output || '⚠️ No output received');
    } catch (err) {
      setOutput('❌ Error: ' + (err.response?.data?.output || err.message));
    }
  };

  const handleCodeChange = (langKey, value) => {
    setCode((prev) => ({ ...prev, [langKey]: value || '' }));
  };

  const renderEditor = () => {
    const selectedCode =
      ['html', 'css', 'javascript'].includes(language) ? code[language] : code.other;

    return (
      <Editor
        height="40vh"
        language={
          language === 'html' || language === 'css'
            ? language
            : languageMap[language]
              ? language
              : 'javascript'
        }
        theme="vs-dark"
        value={selectedCode}
        onChange={(value) =>
          handleCodeChange(
            ['html', 'css', 'javascript'].includes(language) ? language : 'other',
            value
          )
        }
      />
    );
  };

  const renderIframePreview = () => {
    if (['html', 'css', 'javascript'].includes(language)) {
      const html = `
        <html>
          <head>
            <style>
              body {
                background-color: black;
                color: white;
                padding: 1rem;
                font-family: sans-serif;
              }
              ${code.css}
            </style>
          </head>
          <body>
            ${code.html}
            <script>${code.javascript}</script>
          </body>
        </html>
      `;

      return (
        <iframe
          title="Live Preview"
          srcDoc={html}
          style={{
            width: '100%',
            height: '300px',
            border: '1px solid #444',
            marginTop: '1rem',
            backgroundColor: 'black',
          }}
        />
      );
    }
    return null;
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2rem' }}>🌍 Multi-language Code Editor</h1>

      {/* Language Selector */}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          margin: '1rem 0',
          padding: '0.5rem',
          backgroundColor: '#000',
          color: '#fff',
          border: '1px solid #fff',
        }}
      >
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
        <option value="java">Java</option>
        <option value="c">C</option>
        <option value="cpp">C++</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
      </select>

      {/* Code Editor */}
      {renderEditor()}

      {/* Run Button for compiled languages */}
      {language in languageMap && (
        <>
          <button
            onClick={handleRun}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: isHovered ? '#000' : '#fff',
              color: isHovered ? '#fff' : '#000',
              border: '1px solid #fff',
              cursor: 'pointer',
              transition: '0.3s ease',
            }}
          >
            Run Code
          </button>
          <pre
            style={{
              backgroundColor: '#1e1e1e',
              color: 'white',
              padding: '1rem',
              marginTop: '1rem',
              whiteSpace: 'pre-wrap',
              borderRadius: '5px',
              minHeight: '100px',
            }}
          >
            {output}
          </pre>
        </>
      )}

      {/* Live Preview for HTML/CSS/JS */}
      {renderIframePreview()}
    </div>
  );
}

export default App;
