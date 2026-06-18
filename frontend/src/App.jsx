import { useState } from 'react';
import './App.css';
import BottomNav from './components/BottomNav';
import SubjectsPage from './pages/SubjectsPage';
import TopicsPage from './pages/TopicsPage';
import CardsPage from './pages/CardsPage';
import ProfilePage from './pages/ProfilePage';
import ImportPage from './pages/ImportPage';

function App() {
  const [tab, setTab] = useState('subjects');
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [pageStack, setPageStack] = useState(['subjects']);

  const pushPage = (page) => {
    setPageStack(prev => [...prev, page]);
  };

  const popPage = () => {
    setPageStack(prev => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  };

  const currentPage = pageStack[pageStack.length - 1];

  const showTopics = (subject) => {
    setCurrentSubject(subject);
    pushPage('topics');
  };

  const showCards = (topic) => {
    setCurrentTopic(topic);
    pushPage('cards');
  };

  const goBack = () => {
    popPage();
  };

  const switchTab = (newTab) => {
    if (newTab === tab) {
      if (newTab === 'subjects') {
        setPageStack(['subjects']);
      }
      return;
    }
    setTab(newTab);
    if (newTab === 'subjects') {
      setPageStack(['subjects']);
    } else if (newTab === 'import') {
      setPageStack(['import']);
    } else if (newTab === 'profile') {
      setPageStack(['profile']);
    }
  };

  const isFullScreen = currentPage === 'cards';

  const renderPage = () => {
    switch (currentPage) {
      case 'subjects':
        return <SubjectsPage onSelectSubject={showTopics} />;
      case 'topics':
        return (
          <TopicsPage
            subject={currentSubject}
            onBack={goBack}
            onSelectTopic={showCards}
          />
        );
      case 'cards':
        return (
          <CardsPage
            topic={currentTopic}
            onBack={goBack}
          />
        );
      case 'import':
        return <ImportPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <SubjectsPage onSelectSubject={showTopics} />;
    }
  };

  return (
    <>
      {renderPage()}
      {!isFullScreen && <BottomNav activeTab={tab} onTabChange={switchTab} />}
    </>
  );
}

export default App;
