import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeftIcon, PlusIcon, TrashIcon, BookOpenIcon,
  MagnifyingGlassIcon, FolderPlusIcon, AcademicCapIcon,
  PlayIcon, XMarkIcon, CheckIcon
} from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../api';

const UNIT_SIZES = [
  { value: 20, label: '20词' },
  { value: 30, label: '30词' },
  { value: 50, label: '50词' },
  { value: 100, label: '100词' },
];

/* ---- WordbookPage: 词书列表 ---- */
function WordbookPage({ onBack, onNavigateToTopic }) {
  const [wordbooks, setWordbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const listRef = useRef(null);

  useGSAP(() => {
    if (loading || !wordbooks.length) return;
    const items = listRef.current?.children;
    if (!items?.length) return;
    gsap.from(items, { opacity: 0, y: 20, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
  }, { scope: listRef, dependencies: [loading, wordbooks.length] });

  const loadWordbooks = useCallback(async () => {
    try {
      const data = await api('/wordbooks');
      setWordbooks(data);
    } catch (err) {
      console.error('loadWordbooks error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWordbooks(); }, [loadWordbooks]);

  if (selectedBook) {
    return <WordbookDetail bookId={selectedBook} onBack={() => { setSelectedBook(null); loadWordbooks(); }} onNavigateToTopic={onNavigateToTopic} />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">我的词书</h2>
            <p className="text-xs text-default-400">从知识库中选择词条创建词书</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* 创建按钮 */}
            <button
              onClick={() => setShowCreate(true)}
              className="w-full h-14 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              创建新词书
            </button>

            {wordbooks.length === 0 ? (
              <div className="text-center py-12 text-default-400">
                <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>还没有词书，点击上方按钮创建</p>
              </div>
            ) : (
              <div ref={listRef} className="space-y-3">
                {wordbooks.map(wb => (
                  <div
                    key={wb.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer hover:shadow-md"
                    onClick={() => setSelectedBook(wb.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{wb.name}</h3>
                        {wb.description && (
                          <p className="text-xs text-default-400 mt-1 truncate">{wb.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            {wb.subject_name}
                          </span>
                          <span className="text-xs text-default-400">{wb.item_count} 词条</span>
                        </div>
                      </div>
                      <BookOpenIcon className="w-5 h-5 text-default-300 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 创建词书弹窗 */}
      {showCreate && (
        <CreateWordbookDialog
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); loadWordbooks(); }}
        />
      )}
    </div>
  );
}

/* ---- CreateWordbookDialog ---- */
function CreateWordbookDialog({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('english');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api('/wordbooks', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description, subject })
      });
      onSuccess();
    } catch (err) {
      console.error('create wordbook error:', err);
      setError(err.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-bold">创建词书</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <XMarkIcon className="w-5 h-5 text-default-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">词书名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="例如：四级核心词汇"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">描述（可选）</label>
            <textarea
              placeholder="词书描述..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">科目</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${subject === 'english' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                onClick={() => setSubject('english')}
              >
                英语
              </button>
              <button
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${subject === 'politics' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                onClick={() => setSubject('politics')}
              >
                政治
              </button>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- WordbookDetail: 词书详情 ---- */
function WordbookDetail({ bookId, onBack, onNavigateToTopic }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingItems, setAddingItems] = useState(false);
  const [wordsPerUnit, setWordsPerUnit] = useState(20);
  const [generatingUnit, setGeneratingUnit] = useState(null);
  const gridRef = useRef(null);

  const loadBook = useCallback(async () => {
    try {
      const data = await api(`/wordbooks/${bookId}`);
      setBook(data);
    } catch (err) {
      console.error('loadBook error:', err);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => { loadBook(); }, [loadBook]);

  const units = useMemo(() => {
    if (!book?.items?.length) return [];
    const result = [];
    const total = book.items.length;
    for (let i = 0; i < total; i += wordsPerUnit) {
      const end = Math.min(i + wordsPerUnit, total);
      result.push({
        index: result.length + 1,
        offset: i,
        limit: end - i,
        items: book.items.slice(i, end),
      });
    }
    return result;
  }, [book?.items, wordsPerUnit]);

  useGSAP(() => {
    if (loading || !units.length) return;
    const items = gridRef.current?.children;
    if (!items?.length) return;
    gsap.from(items, { opacity: 0, y: 20, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
  }, { scope: gridRef, dependencies: [loading, units.length, wordsPerUnit] });

  const generateUnitTopic = async (unit) => {
    setGeneratingUnit(unit.index);
    try {
      const result = await api(`/wordbooks/${bookId}/unit-to-topic`, {
        method: 'POST',
        body: JSON.stringify({
          unit_name: `第${unit.index}单元`,
          offset: unit.offset,
          limit: unit.limit,
        })
      });
      // 生成成功后跳转到学习页面
      if (onNavigateToTopic) {
        onNavigateToTopic({ id: result.topic_id, name: result.topic_name });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingUnit(null);
    }
  };

  const generateAllTopic = async () => {
    setGeneratingUnit('all');
    try {
      const result = await api(`/wordbooks/${bookId}/to-topic`, { method: 'POST' });
      // 生成成功后跳转到学习页面
      if (onNavigateToTopic) {
        onNavigateToTopic({ id: result.topic_id, name: result.topic_name });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingUnit(null);
    }
  };

  const deleteBook = async () => {
    if (!confirm('确定删除这个词书吗？')) return;
    try {
      await api(`/wordbooks/${bookId}`, { method: 'DELETE' });
      onBack();
    } catch (err) {
      alert(err.message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api(`/wordbooks/${bookId}/items/${itemId}`, { method: 'DELETE' });
      loadBook(); // 刷新词书
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex-1 flex items-center justify-center text-default-400">
        词书不存在
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{book.name}</h2>
            {book.description && <p className="text-xs text-default-400">{book.description}</p>}
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {book.item_count} 词条
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8">
        <div className="space-y-4">
          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => setAddingItems(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <FolderPlusIcon className="w-4 h-4" />
              添加词条
            </button>
            <button
              onClick={generateAllTopic}
              disabled={!book.items?.length || generatingUnit === 'all'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpenIcon className="w-4 h-4" />
              {generatingUnit === 'all' ? '生成中...' : '全书学习'}
            </button>
          </div>

          {!book.items?.length ? (
            <div className="text-center py-12 text-default-400">
              <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>词书为空，点击「添加词条」从知识库中选择</p>
            </div>
          ) : (
            <>
              {/* 单元设置 */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <p className="text-sm font-semibold mb-3">每单元词数</p>
                <div className="flex gap-2">
                  {UNIT_SIZES.map(s => (
                    <button
                      key={s.value}
                      className={`flex-1 h-8 rounded-lg text-xs font-medium transition-colors ${wordsPerUnit === s.value ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                      onClick={() => setWordsPerUnit(s.value)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 单元列表 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">共 {units.length} 个单元</h3>
                  <span className="text-xs text-default-400">每单元 {wordsPerUnit} 词</span>
                </div>
                <div ref={gridRef} className="grid grid-cols-2 gap-3">
                  {units.map(unit => (
                    <div key={unit.index} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm">第{unit.index}单元</h4>
                          <p className="text-[11px] text-default-400">
                            {unit.offset + 1}-{unit.offset + unit.limit} 词
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 mb-3">
                        {unit.items.slice(0, 2).map((item, i) => (
                          <p key={i} className="text-xs text-default-500 truncate">{item.front}</p>
                        ))}
                        {unit.limit > 2 && <p className="text-[11px] text-default-300">...</p>}
                      </div>
                      <button
                        onClick={() => generateUnitTopic(unit)}
                        disabled={generatingUnit === unit.index}
                        className="w-full h-8 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {generatingUnit === unit.index ? (
                          '生成中...'
                        ) : (
                          <>
                            <PlayIcon className="w-3.5 h-3.5" />
                            开始学习
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 词条列表 */}
              <div>
                <h3 className="font-semibold text-sm mb-3">词条列表</h3>
                <div className="space-y-2">
                  {book.items.map((item, i) => (
                    <div key={item.id || i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.front}</p>
                        <p className="text-xs text-default-400 truncate">{item.back}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-default-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 删除词书 */}
          <button
            onClick={deleteBook}
            className="w-full py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
          >
            删除词书
          </button>
        </div>
      </div>

      {/* 添加词条弹窗 */}
      {addingItems && (
        <KnowledgePicker
          bookId={bookId}
          subject={book.subject_key || 'english'}
          onClose={() => setAddingItems(false)}
          onAdded={() => { setAddingItems(false); loadBook(); }}
        />
      )}
    </div>
  );
}

/* ---- KnowledgePicker: 从知识库选择词条 ---- */
function KnowledgePicker({ bookId, subject, onClose, onAdded }) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ subject, page: String(page), page_size: '30' });
      if (search) params.set('search', search);
      const data = await api(`/knowledge?${params}`);
      setItems(data.items || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('loadItems error:', err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [subject, page, search]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleSearch = () => {
    if (page === 1) {
      loadItems();
    } else {
      setPage(1);
    }
  };

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(i => i.id)));
    }
  };

  const handleAdd = async () => {
    if (!selected.size) return;
    setAdding(true);
    setError('');
    try {
      await api(`/wordbooks/${bookId}/items`, {
        method: 'POST',
        body: JSON.stringify({ item_ids: Array.from(selected) })
      });
      onAdded(selected.size);
    } catch (err) {
      console.error('add items error:', err);
      setError(err.message || '添加失败');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-bold">从知识库选择词条</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              已选 {selected.size}
            </span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <XMarkIcon className="w-5 h-5 text-default-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索词条..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              className="flex-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={handleSearch}
              className="px-4 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              搜索
            </button>
          </div>

          {/* Select all */}
          <div className="flex justify-between items-center">
            <button
              className="text-sm text-blue-600 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              onClick={selectAll}
            >
              {selected.size === items.length ? '取消全选' : '全选当前页'}
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>
          )}

          {/* Item list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-default-400 text-sm">暂无词条</div>
          ) : (
            <div className="space-y-2">
              {items.map(item => {
                const isSelected = selected.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center gap-3 ${
                      isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.front}</p>
                      <p className="text-xs text-default-400 truncate">{item.back}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            取消
          </button>
          <button
            onClick={handleAdd}
            disabled={!selected.size || adding}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? '添加中...' : `添加 ${selected.size} 项`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WordbookPage;
