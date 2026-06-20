import { useState, useRef } from 'react';
import { Card, CardContent, Button, Input, Radio, RadioGroup, Chip, Separator } from '@heroui/react';
import { ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api, { uploadFile } from '../api';

const ACCEPT_TYPES = '.csv,.json,.txt,.docx,.pdf';

function ImportPage({ onImportSuccess }) {
  const [subject, setSubject] = useState('english');
  const [tags, setTags] = useState('');
  const [fileName, setFileName] = useState('');
  const [importData, setImportData] = useState(null);
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const [useFileUpload, setUseFileUpload] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

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

  const previewRef = useRef(null);
  useGSAP(() => {
    if (!preview.length) return;
    const items = previewRef.current?.children;
    gsap.from(items, { opacity: 0, y: 10, duration: 0.3, stagger: 0.05, ease: 'power2.out' });
  }, { scope: previewRef, dependencies: [preview.length] });

  const isServerParseable = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    return ['docx', 'pdf'].includes(ext);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStatus(null);
    setImportData(null);
    setPreview([]);

    if (isServerParseable(file.name)) {
      setUseFileUpload(true);
      setStatus({ type: 'info', text: `已选择 ${file.name}，将由服务器解析` });
      return;
    }

    setUseFileUpload(false);
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
        setStatus({ type: 'success', text: `识别到 ${rows.length} 条词条数据` });
      } catch (err) {
        setStatus({ type: 'error', text: err.message });
        setImportData(null); setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    setImporting(true);
    try {
      let result;
      if (useFileUpload) {
        const file = fileInputRef.current?.files[0];
        if (!file) throw new Error('请重新选择文件');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('subject', subject);
        fd.append('tags', tags);
        result = await uploadFile('/knowledge/import/file', fd);
      } else {
        if (!importData) throw new Error('没有可导入的数据');
        const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
        result = await api('/knowledge/import', {
          method: 'POST',
          body: JSON.stringify({ subject, tags: tagList, items: importData })
        });
      }
      setStatus({
        type: 'success',
        text: `导入完成！新增 ${result.new} 条，重复 ${result.duplicate} 条`
      });
      setImportData(null); setPreview([]); setFileName(''); setUseFileUpload(false);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally { setImporting(false); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold">导入知识库</h2>
        <p className="text-sm text-default-400 mt-1">将文件中的词条导入到知识库，之后可以创建词书</p>
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
                  <li>Word (.docx)：自动识别「词汇 + 释义」对</li>
                  <li>PDF (.pdf)：自动提取文本并解析词条</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-5">
            <div><label className="text-sm font-semibold mb-2 block">选择科目</label>
              <RadioGroup aria-label="选择科目" value={subject} onChange={setSubject} orientation="horizontal">
                <Radio value="english">考研英语</Radio>
                <Radio value="politics">考研政治</Radio>
              </RadioGroup>
            </div>
            <Separator />
            <div><label className="text-sm font-semibold mb-2 block">标签（可选，逗号分隔）</label>
              <Input
                placeholder="例如：四级,高频,核心词汇"
                value={tags}
                onChange={e => setTags(e.target.value)}
                variant="primary"
                size="sm"
              />
            </div>
            <Separator />
            <div>
              <label className="text-sm font-semibold mb-3 block">选择文件</label>
              <div ref={dropZoneRef} className="border-2 border-dashed border-default-200 rounded-xl p-6 text-center transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                {fileName ? (
                  <div className="flex items-center justify-center gap-2"><DocumentTextIcon className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{fileName}</span></div>
                ) : (
                  <div className="flex flex-col items-center gap-2"><ArrowUpTrayIcon className="w-8 h-8 text-default-300" /><p className="text-sm text-default-400">点击选择文件</p><p className="text-xs text-default-300">.csv .json .txt .docx .pdf</p></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <input ref={fileInputRef} type="file" accept={ACCEPT_TYPES} onChange={handleFile} className="hidden" />

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
          <Chip color={status.type === 'success' ? 'success' : status.type === 'info' ? 'accent' : 'danger'} variant="secondary" className="w-full justify-start px-4 py-2 h-auto gap-2">
            {status.type === 'success' ? <CheckCircleIcon className="w-4 h-4" /> : <ExclamationTriangleIcon className="w-4 h-4" />}
            <span className="text-sm">{status.text}</span>
          </Chip>
        )}

        <Button variant="primary" size="lg" className="w-full h-12 rounded-xl font-bold"
          isDisabled={(!importData && !useFileUpload) || importing}
          isPending={importing}
          onPress={doImport}>
          导入到知识库
        </Button>
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
