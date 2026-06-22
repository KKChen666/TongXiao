import { useState, useCallback } from 'react';

const STORAGE_KEY = 'tongxiao_reviews';
const INTERVALS = [1, 2, 4, 7, 15, 30];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function useEbbinghaus() {
  const [records, setRecords] = useState(loadRecords);

  const recordReview = useCallback((cardId, correct) => {
    setRecords(prev => {
      const next = { ...prev };
      const existing = next[cardId];
      const today = getToday();

      if (correct) {
        const level = existing ? existing.level + 1 : 0;
        const intervalIdx = Math.min(level, INTERVALS.length - 1);
        next[cardId] = {
          level,
          nextReview: addDays(today, INTERVALS[intervalIdx]),
          lastReview: today,
          totalCorrect: (existing?.totalCorrect || 0) + 1,
          totalWrong: existing?.totalWrong || 0,
        };
      } else {
        next[cardId] = {
          level: 0,
          nextReview: addDays(today, INTERVALS[0]),
          lastReview: today,
          totalCorrect: existing?.totalCorrect || 0,
          totalWrong: (existing?.totalWrong || 0) + 1,
        };
      }
      saveRecords(next);
      return next;
    });
  }, []);

  const getDueCards = useCallback((cards) => {
    const today = getToday();
    return cards.filter(card => {
      const record = records[card.id];
      if (!record) return false;
      return record.nextReview <= today;
    });
  }, [records]);

  const getReviewCount = useCallback((cards) => {
    return getDueCards(cards).length;
  }, [getDueCards]);

  const getCardStatus = useCallback((cardId) => {
    const record = records[cardId];
    if (!record) return { status: 'new', label: '新', color: 'primary' };
    const today = getToday();
    if (record.nextReview <= today) {
      return { status: 'due', label: '待复习', color: 'warning' };
    }
    return { status: 'scheduled', label: '已掌握', color: 'success' };
  }, [records]);

  const getTotalReviewed = useCallback(() => {
    return Object.keys(records).length;
  }, [records]);

  const getRetentionStats = useCallback(() => {
    const byLevel = {};
    const totalCards = Object.keys(records).length;

    Object.values(records).forEach(r => {
      const level = r.level ?? 0;
      if (!byLevel[level]) byLevel[level] = { correct: 0, wrong: 0, cardCount: 0 };
      byLevel[level].correct += r.totalCorrect || 0;
      byLevel[level].wrong += r.totalWrong || 0;
      byLevel[level].cardCount += 1;
    });

    const retentionCurve = INTERVALS.map((days, idx) => {
      const stats = byLevel[idx];
      const attempts = stats ? stats.correct + stats.wrong : 0;
      const retention = attempts > 0
        ? Math.round((stats.correct / attempts) * 100)
        : null;
      const cardCount = stats?.cardCount || 0;
      const predictedForget = retention !== null
        ? Math.round(cardCount * (1 - retention / 100))
        : 0;

      return {
        day: days,
        label: idx === 0 ? '首次' : `${days}天`,
        retention,
        cardCount,
        predictedForget,
      };
    });

    const totalPredictedForget = retentionCurve.reduce((sum, r) => sum + r.predictedForget, 0);

    return { retentionCurve, totalCards, totalPredictedForget };
  }, [records]);

  const getStreak = useCallback(() => {
    const toReviewToday = Object.values(records).filter(r => r.nextReview <= getToday()).length;
    return toReviewToday;
  }, [records]);

  return {
    records,
    recordReview,
    getDueCards,
    getReviewCount,
    getCardStatus,
    getTotalReviewed,
    getStreak,
    getRetentionStats,
  };
}
