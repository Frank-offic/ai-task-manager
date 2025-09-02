import { useHotkeys } from 'react-hotkeys-hook';
import useStore from '../store/useStore';

export default function useKeyboardShortcuts({
  onOpenSearch,
  onOpenQuickAdd,
  onOpenProjectSwitcher,
  onSelectAll,
  onEscape
}) {
  const { setViewMode, viewMode } = useStore();

  // Global shortcuts
  useHotkeys('cmd+k, ctrl+k', (e) => {
    e.preventDefault();
    onOpenSearch?.();
  }, { enableOnFormTags: true });

  useHotkeys('cmd+n, ctrl+n', (e) => {
    e.preventDefault();
    onOpenQuickAdd?.();
  }, { enableOnFormTags: true });

  useHotkeys('cmd+p, ctrl+p', (e) => {
    e.preventDefault();
    onOpenProjectSwitcher?.();
  }, { enableOnFormTags: true });

  useHotkeys('cmd+a, ctrl+a', (e) => {
    e.preventDefault();
    onSelectAll?.();
  }, { enableOnFormTags: false });

  useHotkeys('escape', () => {
    onEscape?.();
  }, { enableOnFormTags: true });

  // View switching
  useHotkeys('cmd+1, ctrl+1', (e) => {
    e.preventDefault();
    setViewMode('list');
  });

  useHotkeys('cmd+2, ctrl+2', (e) => {
    e.preventDefault();
    setViewMode('board');
  });

  useHotkeys('cmd+3, ctrl+3', (e) => {
    e.preventDefault();
    setViewMode('calendar');
  });

  // Quick actions
  useHotkeys('cmd+shift+d, ctrl+shift+d', (e) => {
    e.preventDefault();
    // Toggle dark mode (if implemented)
  });

  useHotkeys('cmd+shift+s, ctrl+shift+s', (e) => {
    e.preventDefault();
    // Quick save/sync
  });

  return {
    shortcuts: [
      { key: 'Cmd/Ctrl + K', action: 'Відкрити пошук' },
      { key: 'Cmd/Ctrl + N', action: 'Нове завдання' },
      { key: 'Cmd/Ctrl + P', action: 'Перемикач проектів' },
      { key: 'Cmd/Ctrl + A', action: 'Вибрати все' },
      { key: 'Escape', action: 'Закрити модальні вікна' },
      { key: 'Cmd/Ctrl + 1', action: 'Список завдань' },
      { key: 'Cmd/Ctrl + 2', action: 'Канбан дошка' },
      { key: 'Cmd/Ctrl + 3', action: 'Календар' }
    ]
  };
}
