import { BookOpenIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const iconMap = {
  1: BookOpenIcon,
  english: BookOpenIcon,
  2: AcademicCapIcon,
  politics: AcademicCapIcon,
};

export function getSubjectIcon(subject) {
  if (!subject) return null;
  const Icon = iconMap[subject.id] || iconMap[subject];
  if (!Icon) return null;
  return Icon;
}

export function getSubjectColor(subject) {
  const colors = {
    1: 'primary',
    english: 'primary',
    2: 'secondary',
    politics: 'secondary',
  };
  return colors[subject.id] || colors[subject] || 'primary';
}
