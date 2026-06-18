import { useState } from 'react';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import SubjectsPage from './pages/SubjectsPage';
import TopicsPage from './pages/TopicsPage';
import CardsPage from './pages/CardsPage';
import ReviewPage from './pages/ReviewPage';
import ImportPage from './pages/ImportPage';
import ProfilePage from './pages/ProfilePage';
import { useEbbinghaus } from './hooks/useEbbinghaus';

function App() {
  const [tab, setTab] = useState('learn');
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [pageStack, setPageStack] = useState(['learn']);
  const [reviewSubject, setReviewSubject] = useState(null);
  const ebbinghaus = useEbbinghaus();

  const pushPage = (page) => setPageStack(prev => [...prev, page]);

  const popPage = () => {
    setPageStack(prev => (prev.length <= 1 ? prev : prev.slice(0, -1)));
  };

  const currentPage = pageStack[pageStack.length - 1];
  const isFullScreen = currentPage === 'cards' || currentPage === 'reviewCards';

  const showTopics = (subject) => {
    setCurrentSubject(subject);
    pushPage('topics');
  };

  const showCards = (topic) => {
    setCurrentTopic(topic);
    pushPage('cards');
  };

  const showReviewCards = (subject) => {
    setReviewSubject(subject);
    pushPage('reviewCards');
  };

  const goBack = () => popPage();

  const switchTab = (newTab) => {
    if (newTab === tab) return;
    setTab(newTab);
    setPageStack([newTab]);
    setCurrentSubject(null);
    setCurrentTopic(null);
  };

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
      case 'import':
        return <ImportPage />;
      case 'profile':
        return <ProfilePage ebbinghaus={ebbinghaus} />;
      default:
        return <SubjectsPage onSelectSubject={showTopics} ebbinghaus={ebbinghaus} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-content2">
      <Sidebar activeTab={tab} onTabChange={switchTab} />
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        {renderPage()}
        {!isFullScreen && <BottomNav activeTab={tab} onTabChange={switchTab} />}
      </main>
    </div>
  );
}

export default App;
