import { useState, useRef } from 'react';
import { Card, CardContent, Button, Input, Radio, RadioGroup, Chip, Separator } from '@heroui/react';
import { ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../api';

function ImportPage() {
  const [subject, setSubject] = useState('english');
  const [topicName, setTopicName] = useState('');
  const [fileName, setFileName] = useState('');
  const [importData, setImportData] = useState(null);
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Drop zone hover animation
  useGSAP(() => {
    const el = dropZoneRef.current;
    if (!el) return;
    const onEnter = () => gsap.to(el, { borderColor: '#006FEE', scale: 1.01, duration: 0.2 });
    const onLeave = () => gsap.to(el, { borderColor: '', scale: 1, duration: 0.2 });
    el.addEventListener('dragenter', onEnter);
    el.addEventListener('dragleave', onLeave);
    el.addEventListener('drop', onLeave);
    return () => {
      el.removeEventListener('dragenter', onEnter);
      el.removeEventListener('dragleave', onLeave);
      el.removeEventListener('drop', onLeave);
    };
  }, { scope: dropZoneRef });

  // Preview stagger
  const previewRef = useRef(null);
  useGSAP(() => {
    if (!preview.length) return;
    const items = previewRef.current?.children;
    gsap.from(items, { opacity: 0, y: 10, duration: 0.3, stagger: 0.05, ease: 'power2.out' });
  }, { scope: previewRef, dependencies: [preview.length] });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStatus(null);
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
          rows = parsed.map(r => ({ front: r.front || r.Front || r.word || '', back: r.back || r.Back || r.definition || r.meaning || '' })).filter(r => r.front && r.back);
        } else if (ext === 'txt') {
          rows = text.split('\n').filter(l => l.trim()).map(l => {
            const parts = l.includes('|') ? l.split('|') : l.split('\t');
            return parts.length >= 2 ? { front: parts[0].trim(), back: parts[1].trim() } : null;
          }).filter(Boolean);
        }
        if (!rows.length) throw new Error('未找到有效数据');
        setImportData(rows);
        setPreview(rows.slice(0, 5));
        setStatus({ type: 'success', text: `识别到 ${rows.length} 条卡片数据` });
      } catch (err) {
        setStatus({ type: 'error', text: err.message });
        setImportData(null); setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    if (!importData) return;
    setImporting(true);
    try {
      const result = await api('/import', { method: 'POST', body: JSON.stringify({ subject, topic: topicName, cards: importData }) });
      setStatus({ type: 'success', text: `成功导入 ${result.count} 张卡片到「${result.topic}」` });
      setImportData(null); setPreview([]); setFileName('');
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally { setImporting(false); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold">导入资料</h2>
        <p className="text-sm text-default-400 mt-1">支持 CSV / JSON / TXT 格式批量导入</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8 space-y-4">
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <DocumentTextIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div><p className="text-sm font-semibold text-primary-700">格式说明</p>
                <ul className="text-xs text-primary-600 mt-1 space-y-0.5 list-disc list-inside">
                  <li>CSV：第一行为表头，之后每行 front,back</li>
                  <li>JSON：{`[{"front":"单词","back":"释义"}]`}</li>
                  <li>TXT：每行用 | 或 Tab 分隔 front|back</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-5">
            <div><label className="text-sm font-semibold mb-2 block">选择科目</label>
              <RadioGroup aria-label="选择科目" value={subject} onValueChange={setSubject} orientation="horizontal">
                <Radio value="english">考研英语</Radio>
                <Radio value="politics">考研政治</Radio>
              </RadioGroup>
            </div>
            <Separator />
            <div><label className="text-sm font-semibold mb-2 block">章节名称</label>
              <Input placeholder="输入章节名称（可选）" value={topicName} onChange={e => setTopicName(e.target.value)} variant="bordered" size="sm" />
            </div>
            <Separator />
            <div>
              <label className="text-sm font-semibold mb-3 block">选择文件</label>
              <div ref={dropZoneRef} className="border-2 border-dashed border-default-200 rounded-xl p-6 text-center transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                {fileName ? (
                  <div className="flex items-center justify-center gap-2"><DocumentTextIcon className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{fileName}</span></div>
                ) : (
                  <div className="flex flex-col items-center gap-2"><ArrowUpTrayIcon className="w-8 h-8 text-default-300" /><p className="text-sm text-default-400">点击选择文件</p><p className="text-xs text-default-300">.csv .json .txt</p></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <input ref={fileInputRef} type="file" accept=".csv,.json,.txt" onChange={handleFile} className="hidden" />

        {preview.length > 0 && (
          <div><h4 className="text-sm font-semibold mb-2">数据预览</h4>
            <div ref={previewRef} className="space-y-1.5">
              {preview.map((r, i) => (
                <Card key={i} className="bg-default-50"><CardContent className="p-2.5 flex items-center gap-3">
                  <span className="text-xs text-default-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{r.front}</p><p className="text-xs text-default-400 truncate">{r.back?.substring(0, 80)}</p></div>
                </CardContent></Card>
              ))}
            </div>
            {importData && importData.length > 5 && <p className="text-xs text-default-400 mt-2 text-center">还有 {importData.length - 5} 条数据未显示</p>}
          </div>
        )}

        {status && (
          <Chip color={status.type === 'success' ? 'success' : 'danger'} variant="flat" className="w-full justify-start px-4 py-2 h-auto gap-2">
            {status.type === 'success' ? <CheckCircleIcon className="w-4 h-4" /> : <ExclamationTriangleIcon className="w-4 h-4" />}
            <span className="text-sm">{status.text}</span>
          </Chip>
        )}

        <Button color="primary" size="lg" className="w-full h-12 rounded-xl font-bold" isDisabled={!importData || importing} isLoading={importing} onPress={doImport}>确认导入</Button>
      </div>
    </div>
  );
}

function parseCSVLine(line) {
  const result = []; let current = '', inQuotes = false;
  for (const ch of line) {
    if (inQuotes) { if (ch === '"') inQuotes = false; else current += ch; }
    else { if (ch === '"') inQuotes = true; else if (ch === ',') { result.push(current.trim()); current = ''; } else current += ch; }
  }
  result.push(current.trim());
  return result;
}

export default ImportPage;
