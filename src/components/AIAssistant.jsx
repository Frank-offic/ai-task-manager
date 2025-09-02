import React, { useState } from 'react';
import useStore from '../store/useStore';

export default function AIAssistant({ onTasksGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const projects = useStore(state => state.projects);
  const selectedProjectId = useStore(state => state.selectedProjectId);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const callGPT = async (userPrompt) => {
    const projectContext = selectedProject
      ? `Ти працюєш над проектом '${selectedProject.name}'. Опис проекту: ${selectedProject.description || 'немає опису'}.`
      : 'Ти працюєш над завданнями без конкретного проекту.';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        'HTTP-Referer': import.meta.env.VITE_SITE_URL,
        'X-Title': import.meta.env.VITE_SITE_NAME,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `Ти персональний AI асистент для UX/UI дизайнера. ${projectContext}
            Створюй конкретні, actionable завдання у JSON форматі.
            
            ЗАВЖДИ відповідай тільки валідним JSON у такому форматі:
            {
              "tasks": [
                {
                  "title": "Конкретна назва завдання",
                  "description": "Детальний опис що треба зробити",
                  "priority": "high|medium|low"
                }
              ]
            }`
          },
          {
            role: "user",
            content: `Створи 3-5 завдань для: ${userPrompt}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const parseAIResponse = (response) => {
    try {
      // Видалити markdown форматування якщо є
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      return parsed.tasks || [];
    } catch (error) {
      console.error('Parse error:', error);
      // Fallback - створити завдання з тексту
      return [{
        title: `AI завдання: ${prompt}`,
        description: response.substring(0, 200),
        priority: 'medium'
      }];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Перевірити чи є API ключ
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      setError('API ключ не налаштований. Додайте VITE_OPENROUTER_API_KEY в .env файл');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const aiResponse = await callGPT(prompt);
      const tasks = parseAIResponse(aiResponse);
      
      onTasksGenerated(tasks);
      setPrompt('');
      
    } catch (error) {
      console.error('AI Error:', error);
      setError(`Помилка AI: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">🤖</div>
        <div>
          <h2 className="text-xl font-bold text-white">AI Асистент</h2>
          <p className="text-gray-400 text-sm">GPT OSS 120B готовий створити завдання для вас</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Наприклад: 'Створи план редизайну головної сторінки для фінтех стартапу з фокусом на конверсію'"
            className="w-full bg-gray-800/50 border border-gray-600 text-white p-4 rounded-lg h-24 placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            disabled={isGenerating}
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Генерую через GPT...
              </>
            ) : (
              <>
                ✨ Створити AI завдання
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        💡 Чим детальніше опишете проект, тим кращі завдання створить AI
      </div>
    </div>
  );
}