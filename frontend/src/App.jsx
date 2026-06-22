import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import SubjectsPage from './pages/SubjectsPage';
import TopicsPage from './pages/TopicsPage';
import CardsPage from './pages/CardsPage';
import ReviewPage from './pages/ReviewPage';
import ImportPage from './pages/ImportPage';
import WordbookPage from './pages/WordbookPage';
import ProfilePage from './pages/ProfilePage';
import AiPage from './pages/AiPage';
import LoginPage from './pages/LoginPage';
import SplashPage from './pages/SplashPage';
import { useEbbinghaus } from './hooks/useEbbinghaus';
import api from './api';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState('learn');
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [pageStack, setPageStack] = useState(['learn']);
  const [reviewSubject, setReviewSubject] = useState(null);
  const ebbinghaus = useEbbinghaus();

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    const initStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setBackgroundColor({ color: '#006FEE' });
          await StatusBar.setStyle({ style: Style.Light });
        } catch (e) {
          console.log('StatusBar init error:', e);
        }
      }
    };
    initStatusBar();

    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // Clean up corrupted data
        localStorage.removeItem('user');
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = useCallback((userData) => {
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTab('learn');
    setPageStack(['learn']);
    setCurrentSubject(null);
    setCurrentTopic(null);
  }, []);

  const pushPage = useCallback((page) => setPageStack(prev => [...prev, page]), []);
  const popPage = useCallback(() => setPageStack(prev => (prev.length <= 1 ? prev : prev.slice(0, -1))), []);

  const currentPage = pageStack[pageStack.length - 1];
  const isFullScreen = currentPage === 'cards' || currentPage === 'reviewCards';

  const showTopics = useCallback((subject) => {
    setCurrentSubject(subject);
    pushPage('topics');
  }, [pushPage]);

  const showCards = useCallback((topic) => {
    setCurrentTopic(topic);
    pushPage('cards');
  }, [pushPage]);

  const showReviewCards = useCallback((subject) => {
    setReviewSubject(subject);
    pushPage('reviewCards');
  }, [pushPage]);

  // 从词书跳转到学习页面
  const navigateToTopic = useCallback((topic) => {
    setCurrentTopic(topic);
    setTab('learn');
    setPageStack(['learn', 'cards']);
  }, []);

  const goBack = useCallback(() => popPage(), [popPage]);

  const switchTab = useCallback((newTab) => {
    if (newTab === tab) return;
    setTab(newTab);
    setPageStack([newTab]);
    setCurrentSubject(null);
    setCurrentTopic(null);
  }, [tab]);

  if (showSplash) {
    return <SplashPage onComplete={handleSplashComplete} />;
  }

  if (!authChecked) return null;

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'learn':
        return <SubjectsPage onSelectSubject={showTopics} ebbinghaus={ebbinghaus} />;
      case 'topics':
        return <TopicsPage subject={currentSubject} onBack={goBack} onSelectTopic={showCards} ebbinghaus={ebbinghaus} />;
      case 'cards':
        return <CardsPage topic={currentTopic} onBack={goBack} ebbinghaus={ebbinghaus} />;
      case 'review':
        return <ReviewPage onSelectSubject={showReviewCards} ebbinghaus={ebbinghaus} />;
      case 'reviewCards':
        return <CardsPage topic={reviewSubject} onBack={goBack} ebbinghaus={ebbinghaus} reviewMode />;
      case 'wordbook':
        return <WordbookPage onBack={() => switchTab('learn')} onNavigateToTopic={navigateToTopic} />;
      case 'import':
        return <ImportPage onImportSuccess={() => {}} />;
      case 'ai':
        return <AiPage />;
      case 'profile':
        return <ProfilePage ebbinghaus={ebbinghaus} user={user} onLogout={handleLogout} />;
      default:
        return <SubjectsPage onSelectSubject={showTopics} ebbinghaus={ebbinghaus} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-content2 theme-transition">
      <Sidebar activeTab={tab} onTabChange={switchTab} user={user} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        {renderPage()}
        {!isFullScreen && <BottomNav activeTab={tab} onTabChange={switchTab} />}
      </main>
    </div>
  );
}

export default App;
