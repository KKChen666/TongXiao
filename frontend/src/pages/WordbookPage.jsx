import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card, CardContent, Button, Input, Spinner, Chip, Checkbox,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Pagination
} from '@heroui/react';
import {
  ChevronLeftIcon, PlusIcon, TrashIcon, BookOpenIcon,
  MagnifyingGlassIcon, FolderPlusIcon, AcademicCapIcon,
  PlayIcon
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

function WordbookPage({ onBack }) {
  const [wordbooks, setWordbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const listRef = useRef(null);

  useGSAP(() => {
    if (loading || !wordbooks.length) return;
    const items = listRef.current?.children;
    if (!items?.length) return;
    gsap.from(items, { opacity: 0, y: 20, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
  }, { scope: listRef, dependencies: [loading, wordbooks.length] });

  const loadWordbooks = async () => {
    try {
      const data = await api('/wordbooks');
      setWordbooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWordbooks(); }, []);

  if (selectedBook) {
    return <WordbookDetail bookId={selectedBook} onBack={() => setSelectedBook(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button isIconOnly variant="ghost" size="sm" onPress={onBack}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">我的词书</h2>
            <p className="text-xs text-default-400">从知识库中选择词条创建词书</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-4">
            <CreateWordbookButton onSuccess={loadWordbooks} />

            {wordbooks.length === 0 ? (
              <div className="text-center py-12 text-default-400">
                <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>还没有词书，点击上方按钮创建</p>
              </div>
            ) : (
              <div ref={listRef} className="space-y-3">
                {wordbooks.map(wb => (
                  <Card
                    key={wb.id}
                    className="border border-transparent hover:border-primary/20 transition-shadow duration-200 cursor-pointer hover:shadow-md"
                    onClick={() => setSelectedBook(wb.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{wb.name}</h3>
                          {wb.description && (
                            <p className="text-xs text-default-400 mt-1 truncate">{wb.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Chip size="sm" variant="flat">{wb.subject_name}</Chip>
                            <span className="text-xs text-default-400">{wb.item_count} 词条</span>
                          </div>
                        </div>
                        <BookOpenIcon className="w-5 h-5 text-default-300 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateWordbookButton({ onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('english');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api('/wordbooks', {
        method: 'POST',
        body: JSON.stringify({ name, description, subject })
      });
      setName(''); setDescription('');
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        className="w-full h-14 rounded-xl"
        startContent={<PlusIcon className="w-5 h-5" />}
        onPress={() => setIsOpen(true)}
      >
        创建新词书
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <ModalHeader>创建词书</ModalHeader>
        <ModalBody className="space-y-4">
          <Input
            label="词书名称"
            placeholder="例如：四级核心词汇"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium mb-1.5 block">描述（可选）</label>
            <textarea
              placeholder="词书描述..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-default-200 bg-content1 text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={subject === 'english' ? 'primary' : 'flat'}
              onPress={() => setSubject('english')}
            >
              英语
            </Button>
            <Button
              size="sm"
              variant={subject === 'politics' ? 'primary' : 'flat'}
              onPress={() => setSubject('politics')}
            >
              政治
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onPress={() => setIsOpen(false)}>取消</Button>
          <Button variant="primary" onPress={handleCreate} isLoading={creating} isDisabled={!name.trim()}>
            创建
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function WordbookDetail({ bookId, onBack }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingItems, setAddingItems] = useState(false);
  const [wordsPerUnit, setWordsPerUnit] = useState(20);
  const [generatingUnit, setGeneratingUnit] = useState(null);
  const gridRef = useRef(null);

  const loadBook = async () => {
    try {
      const data = await api(`/wordbooks/${bookId}`);
      setBook(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBook(); }, [bookId]);

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

  const removeItem = async (knowledgeId) => {
    try {
      await api(`/wordbooks/${bookId}/items/${knowledgeId}`, { method: 'DELETE' });
      setBook(prev => ({
        ...prev,
        items: prev.items.filter(i => i.id !== knowledgeId),
        item_count: prev.item_count - 1
      }));
    } catch (err) {
      alert(err.message);
    }
  };

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
      alert(`已生成学习卡片：${result.topic_name}（${result.card_count} 张）`);
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
      alert(`已生成学习卡片：${result.topic_name}（${result.card_count} 张）`);
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
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
          <Button isIconOnly variant="ghost" size="sm" onPress={onBack}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{book.name}</h2>
            {book.description && <p className="text-xs text-default-400">{book.description}</p>}
          </div>
          <Chip variant="flat">{book.item_count} 词条</Chip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8">
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1"
              startContent={<FolderPlusIcon className="w-4 h-4" />}
              onPress={() => setAddingItems(true)}
            >
              添加词条
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              startContent={<BookOpenIcon className="w-4 h-4" />}
              onPress={generateAllTopic}
              isLoading={generatingUnit === 'all'}
              isDisabled={!book.items?.length}
            >
              全书学习
            </Button>
          </div>

          {!book.items?.length ? (
            <div className="text-center py-12 text-default-400">
              <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>词书为空，点击「添加词条」从知识库中选择</p>
            </div>
          ) : (
            <>
              {/* Unit size selector */}
              <Card className="bg-default-50">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold mb-3">每单元词数</p>
                  <div className="flex gap-2">
                    {UNIT_SIZES.map(s => (
                      <Button
                        key={s.value}
                        size="sm"
                        variant={wordsPerUnit === s.value ? 'primary' : 'flat'}
                        onPress={() => setWordsPerUnit(s.value)}
                        className="flex-1"
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Units grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    共 {units.length} 个单元
                  </h3>
                  <span className="text-xs text-default-400">
                    每单元 {wordsPerUnit} 词
                  </span>
                </div>
                <div ref={gridRef} className="grid grid-cols-2 gap-3">
                  {units.map(unit => (
                    <Card
                      key={unit.index}
                      className="border border-default-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <AcademicCapIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm">第{unit.index}单元</h4>
                            <p className="text-[11px] text-default-400">
                              {unit.offset + 1}-{unit.offset + unit.limit} 词
                            </p>
                          </div>
                        </div>
                        {/* Preview: first 2 words */}
                        <div className="space-y-1 mb-3">
                          {unit.items.slice(0, 2).map((item, i) => (
                            <p key={i} className="text-xs text-default-500 truncate">
                              {item.front}
                            </p>
                          ))}
                          {unit.limit > 2 && (
                            <p className="text-[11px] text-default-300">...</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          className="w-full"
                          startContent={<PlayIcon className="w-3.5 h-3.5" />}
                          onPress={() => generateUnitTopic(unit)}
                          isLoading={generatingUnit === unit.index}
                        >
                          开始学习
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button
            variant="ghost"
            color="danger"
            className="w-full mt-4"
            onPress={deleteBook}
          >
            删除词书
          </Button>
        </div>
      </div>

      {addingItems && (
        <KnowledgePicker
          bookId={bookId}
          subject={book.subject_key || 'english'}
          onClose={() => setAddingItems(false)}
          onAdded={(count) => {
            setAddingItems(false);
            loadBook();
          }}
        />
      )}
    </div>
  );
}

function KnowledgePicker({ bookId, subject, onClose, onAdded }) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adding, setAdding] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ subject, page, page_size: 30 });
      if (search) params.set('search', search);
      const data = await api(`/knowledge?${params}`);
      setItems(data.items);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [page]);

  const handleSearch = () => {
    setPage(1);
    loadItems();
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    try {
      await api(`/wordbooks/${bookId}/items`, {
        method: 'POST',
        body: JSON.stringify({ item_ids: Array.from(selected) })
      });
      onAdded(selected.size);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalHeader className="flex items-center justify-between">
        <span>从知识库选择词条</span>
        <Chip size="sm" variant="flat">已选 {selected.size}</Chip>
      </ModalHeader>
      <ModalBody>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="搜索词条..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
          />
          <Button variant="flat" onPress={handleSearch}>搜索</Button>
        </div>

        <div className="flex justify-between items-center mb-2">
          <Button size="sm" variant="ghost" onPress={selectAll}>
            {selected.size === items.length ? '取消全选' : '全选'}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-colors ${selected.has(item.id) ? 'border-primary bg-primary-50' : 'border-transparent'}`}
                onClick={() => toggleSelect(item.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox
                    isSelected={selected.has(item.id)}
                    onValueChange={() => toggleSelect(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.front}</p>
                    <p className="text-xs text-default-400 truncate">{item.back}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              size="sm"
            />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onPress={onClose}>取消</Button>
        <Button
          variant="primary"
          onPress={handleAdd}
          isLoading={adding}
          isDisabled={!selected.size}
        >
          添加 {selected.size} 项
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default WordbookPage;
