# 🚀 Deployment Guide - AI Task Manager

## Крок 1: Створення GitHub репозиторію

1. **Перейдіть на GitHub.com та створіть новий репозиторій:**
   - Repository name: `ai-task-manager`
   - Description: `AI-powered task management application with PWA support`
   - Public repository
   - НЕ додавайте README, .gitignore, або license (вони вже є)

2. **Скопіюйте URL репозиторію** (буде виглядати як `https://github.com/YOUR_USERNAME/ai-task-manager.git`)

## Крок 2: Push коду до GitHub

Виконайте команди в терміналі з папки `ai-task-manager`:

```bash
# Видаліть старий remote (якщо є)
git remote remove origin

# Додайте правильний remote з вашим username
git remote add origin https://github.com/YOUR_USERNAME/ai-task-manager.git

# Push код
git push -u origin main
```

## Крок 3: Налаштування GitHub Pages

1. **Перейдіть до Settings вашого репозиторію**
2. **Знайдіть секцію "Pages" в лівому меню**
3. **Налаштуйте Source:**
   - Source: `GitHub Actions`
   - Це дозволить використовувати наш workflow файл

## Крок 4: Додавання Secrets

В Settings → Secrets and variables → Actions додайте:

- **`VITE_OPENROUTER_API_KEY`**: Ваш OpenRouter API ключ
- **`VITE_SITE_URL`**: `https://YOUR_USERNAME.github.io/ai-task-manager`

## Крок 5: Запуск деплойменту

1. **Після push коду** GitHub Actions автоматично запустить workflow
2. **Перевірте вкладку "Actions"** в репозиторії для статусу деплойменту
3. **Після успішного деплою** сайт буде доступний за адресою:
   ```
   https://YOUR_USERNAME.github.io/ai-task-manager/
   ```

## 🔧 Альтернативний варіант - Netlify Deploy

Якщо GitHub Pages не працює:

1. **Зареєструйтесь на Netlify.com**
2. **Підключіть GitHub репозиторій**
3. **Налаштування build:**
   - Build command: `npm run build:prod`
   - Publish directory: `dist`
   - Base directory: `ai-task-manager`

4. **Environment variables:**
   - `VITE_OPENROUTER_API_KEY`: ваш API ключ
   - `VITE_SITE_URL`: URL Netlify сайту

## 📱 Тестування PWA

Після деплойменту:
1. Відкрийте сайт на мобільному пристрої
2. Перевірте можливість "Add to Home Screen"
3. Протестуйте offline функціональність

## 🎯 Готово!

Ваш AI Task Manager тепер доступний публічно з усіма production оптимізаціями:
- ✅ PWA підтримка
- ✅ Offline режим
- ✅ Code splitting
- ✅ Performance monitoring
- ✅ Error boundaries
- ✅ Toast notifications
