import { useState, useRef } from 'react';
import api from '../api';

function ImportPage() {
  const [subject, setSubject] = useState('english');
  const [topicName, setTopicName] = useState('');
  const [fileName, setFileName] = useState('未选择文件');
  const [importData, setImportData] = useState(null);
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState({ text: '', ok: true });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = false;
        } else current += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ',') { result.push(current.trim()); current = ''; }
        else current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const ext = file.name.split('.').pop().toLowerCase();
      try {
        let rows = [];
        if (ext === 'csv') {
          const lines = text.split('\n').filter(l => l.trim());
          if (lines.length < 2) throw new Error('CSV 数据不足');
          for (let i = 1; i < lines.length; i++) {
            const vals = parseCSVLine(lines[i]);
            if (vals.length >= 2) rows.push({ front: vals[0], back: vals[1] });
          }
        } else if (ext === 'json') {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error('JSON 应为数组');
          rows = parsed.map(r => ({
            front: r.front || r.Front || r.word || '',
            back: r.back || r.Back || r.definition || r.meaning || '',
          })).filter(r => r.front && r.back);
        } else if (ext === 'txt') {
          rows = text.split('\n').filter(l => l.trim()).map(l => {
            const parts = l.includes('|') ? l.split('|') : l.split('\t');
            return parts.length >= 2 ? { front: parts[0].trim(), back: parts[1].trim() } : null;
          }).filter(Boolean);
        }
        if (!rows.length) throw new Error('未找到有效数据');
        setImportData(rows);
        setPreview(rows.slice(0, 10));
        setStatus({ text: `✅ 共 ${rows.length} 条，预览前 ${Math.min(10, rows.length)} 条`, ok: true });
      } catch (err) {
        setStatus({ text: `❌ 读取失败：${err.message}`, ok: false });
        setImportData(null);
        setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    if (!importData) return;
    setImporting(true);
    try {
      const result = await api('/import', {
        method: 'POST',
        body: JSON.stringify({ subject, topic: topicName, cards: importData }),
      });
      setStatus({ text: `✅ 成功导入 ${result.count} 张卡片到「${result.topic}」`, ok: true });
      setImportData(null);
      setPreview([]);
      setFileName('未选择文件');
    } catch (err) {
      setStatus({ text: `❌ 导入失败：${err.message}`, ok: false });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page active">
      <div className="header"><div className="header-title">导入学习资料</div></div>
      <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 12 }}>支持 CSV / JSON / TXT 格式</div>

      <div className="import-card">
        <div className="import-label">选择科目</div>
        <div className="import-radio-group">
          <label className="import-radio">
            <input type="radio" name="import-subject" value="english"
              checked={subject === 'english'} onChange={() => setSubject('english')} />
            考研英语
          </label>
          <label className="import-radio">
            <input type="radio" name="import-subject" value="politics"
              checked={subject === 'politics'} onChange={() => setSubject('politics')} />
            考研政治
          </label>
        </div>

        <div className="import-label">章节名称（可选）</div>
        <input
          className="import-input"
          placeholder="输入新章节名称，或留空自动命名"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
        />

        <div className="import-label">选择文件</div>
        <div className="import-file-row">
          <span className="file-name">{fileName}</span>
          <button className="import-btn import-btn-primary" onClick={() => fileInputRef.current?.click()}>
            选择文件
          </button>
        </div>
      </div>

      <input
        id="file-input"
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.txt"
        onChange={handleFile}
      />

      {preview.length > 0 && (
        <div className="import-preview">
          {preview.map((r, i) => (
            <div key={i} className="preview-item">
              <div className="p-front">{i + 1}. {r.front}</div>
              <div className="p-back">{(r.back || '').substring(0, 60)}</div>
            </div>
          ))}
        </div>
      )}

      <button
        className="import-btn import-btn-primary"
        style={{ width: '100%', height: 44, borderRadius: 22, fontSize: 15, marginBottom: 12 }}
        disabled={!importData || importing}
        onClick={doImport}
      >
        {importing ? '导入中...' : '确认导入'}
      </button>

      {status.text && (
        <div className={`import-status ${status.ok ? 'status-ok' : 'status-err'}`}>
          {status.text}
        </div>
      )}
    </div>
  );
}

export default ImportPage;
