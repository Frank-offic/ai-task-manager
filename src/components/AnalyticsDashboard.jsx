import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import useStore from '../store/useStore';
import { 
  calculateProductivityScore, 
  identifyPatterns, 
  suggestOptimizations, 
  analyzeWorkloadBalance 
} from '../utils/analyticsEngine';
import { format, subDays, parseISO } from 'date-fns';

export default function AnalyticsDashboard({ isOpen, onClose }) {
  const { tasks, projects, labels } = useStore();
  const [timeframe, setTimeframe] = useState(30); // days
  const [activeTab, setActiveTab] = useState('overview');

  const analytics = useMemo(() => {
    const productivityScore = calculateProductivityScore(tasks, timeframe);
    const patterns = identifyPatterns(tasks, projects);
    const workloadAnalysis = analyzeWorkloadBalance(tasks);
    
    // Calculate additional metrics
    const completedTasks = tasks.filter(task => task.completed);
    const activeTasks = tasks.filter(task => !task.completed);
    const overdueTasks = activeTasks.filter(task => 
      task.dueDate && parseISO(task.dueDate) < new Date()
    );
    
    const workload = {
      totalTasks: tasks.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      highPriorityTasks: activeTasks.filter(task => task.priority === 'high').length,
      upcomingDeadlines: activeTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = parseISO(task.dueDate);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return dueDate <= nextWeek;
      }).length,
      activeProjects: projects.filter(project => 
        tasks.some(task => task.projectId === project.id && !task.completed)
      ).length
    };
    
    const habits = {
      averageTaskDuration: completedTasks.reduce((sum, task) => 
        sum + (task.actualMinutes || 60), 0) / Math.max(completedTasks.length, 1)
    };
    
    const optimizations = suggestOptimizations(workload, habits);
    
    return {
      productivityScore,
      patterns,
      workloadAnalysis,
      workload,
      optimizations,
      completionRate: workload.totalTasks > 0 ? (workload.completedTasks / workload.totalTasks * 100) : 0
    };
  }, [tasks, projects, timeframe]);

  const chartData = useMemo(() => {
    // Daily completion data for the last 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => {
        if (!task.completedAt) return false;
        return format(parseISO(task.completedAt), 'yyyy-MM-dd') === dateStr;
      });
      
      dailyData.push({
        date: format(date, 'MMM dd'),
        completed: dayTasks.length,
        high: dayTasks.filter(t => t.priority === 'high').length,
        medium: dayTasks.filter(t => t.priority === 'medium').length,
        low: dayTasks.filter(t => t.priority === 'low').length
      });
    }
    
    // Priority distribution
    const priorityData = [
      { name: 'Високий', value: analytics.workload.highPriorityTasks, color: '#EF4444' },
      { name: 'Середній', value: tasks.filter(t => !t.completed && t.priority === 'medium').length, color: '#F59E0B' },
      { name: 'Низький', value: tasks.filter(t => !t.completed && t.priority === 'low').length, color: '#10B981' }
    ];
    
    // Project progress
    const projectData = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const completed = projectTasks.filter(task => task.completed).length;
      return {
        name: project.name,
        total: projectTasks.length,
        completed,
        progress: projectTasks.length > 0 ? (completed / projectTasks.length * 100) : 0
      };
    }).filter(p => p.total > 0);
    
    return { dailyData, priorityData, projectData };
  }, [tasks, projects, analytics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Аналітика продуктивності</h2>
              <p className="text-gray-400">Аналіз вашої роботи та рекомендації для покращення</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(Number(e.target.value))}
                className="bg-gray-700 text-white p-2 rounded border border-gray-600"
              >
                <option value={7}>Останні 7 днів</option>
                <option value={30}>Останні 30 днів</option>
                <option value={90}>Останні 90 днів</option>
              </select>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-700 p-1 rounded-lg">
            {[
              { key: 'overview', label: 'Огляд', icon: '📊' },
              { key: 'patterns', label: 'Паттерни', icon: '🔍' },
              { key: 'workload', label: 'Навантаження', icon: '⚖️' },
              { key: 'recommendations', label: 'Рекомендації', icon: '💡' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab analytics={analytics} chartData={chartData} />
          )}
          {activeTab === 'patterns' && (
            <PatternsTab patterns={analytics.patterns} />
          )}
          {activeTab === 'workload' && (
            <WorkloadTab workloadAnalysis={analytics.workloadAnalysis} chartData={chartData} />
          )}
          {activeTab === 'recommendations' && (
            <RecommendationsTab optimizations={analytics.optimizations} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ analytics, chartData }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Продуктивність"
          value={`${analytics.productivityScore}%`}
          icon="🎯"
          color={analytics.productivityScore >= 70 ? 'green' : analytics.productivityScore >= 50 ? 'yellow' : 'red'}
        />
        <MetricCard
          title="Завершення"
          value={`${Math.round(analytics.completionRate)}%`}
          icon="✅"
          color="blue"
        />
        <MetricCard
          title="Активні завдання"
          value={analytics.workload.activeTasks}
          icon="⚡"
          color="purple"
        />
        <MetricCard
          title="Прострочені"
          value={analytics.workload.overdueTasks}
          icon="⚠️"
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Completion Chart */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Завершення за днями</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="completed" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Розподіл за пріоритетом</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData.priorityData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {chartData.priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Progress */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Прогрес проектів</h3>
        <div className="space-y-3">
          {chartData.projectData.map(project => (
            <div key={project.name} className="flex items-center gap-4">
              <div className="w-32 text-sm text-gray-300 truncate">{project.name}</div>
              <div className="flex-1 bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <div className="text-sm text-gray-400 w-16 text-right">
                {project.completed}/{project.total}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatternsTab({ patterns }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Виявлені паттерни поведінки</h3>
      {patterns.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🔍</div>
          <p>Недостатньо даних для аналізу паттернів</p>
          <p className="text-sm">Продовжуйте використовувати додаток для отримання інсайтів</p>
        </div>
      ) : (
        patterns.map((pattern, index) => (
          <PatternCard key={index} pattern={pattern} />
        ))
      )}
    </div>
  );
}

function WorkloadTab({ workloadAnalysis, chartData }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Аналіз навантаження</h3>
      
      {/* Workload Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Баланс навантаження"
          value={`${workloadAnalysis.metrics.balance}%`}
          icon="⚖️"
          color={workloadAnalysis.metrics.balance >= 70 ? 'green' : 'yellow'}
        />
        <MetricCard
          title="Середнє на день"
          value={`${Math.round(workloadAnalysis.metrics.averageDaily / 60)}г`}
          icon="⏱️"
          color="blue"
        />
        <MetricCard
          title="Найзавантаженіший день"
          value={workloadAnalysis.metrics.busiestDay.date ? 
            format(new Date(workloadAnalysis.metrics.busiestDay.date), 'EEE') : 'N/A'}
          icon="📅"
          color="purple"
        />
      </div>

      {/* Weekly Workload Chart */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-white mb-4">Навантаження по днях тижня</h4>
        <div className="space-y-2">
          {Object.entries(workloadAnalysis.dailyWorkload).map(([date, day]) => (
            <div key={date} className="flex items-center gap-4">
              <div className="w-20 text-sm text-gray-300">
                {format(day.date, 'EEE dd')}
              </div>
              <div className="flex-1 bg-gray-600 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((day.totalEstimatedMinutes / workloadAnalysis.metrics.maxDaily) * 100, 100)}%` 
                  }}
                />
              </div>
              <div className="text-sm text-gray-400 w-16 text-right">
                {Math.round(day.totalEstimatedMinutes / 60)}г
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {workloadAnalysis.recommendations.length > 0 && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-white mb-3">Рекомендації по навантаженню</h4>
          <div className="space-y-2">
            {workloadAnalysis.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-yellow-600/20 border border-yellow-500/50 rounded-lg">
                <p className="text-yellow-300 text-sm">{rec.message}</p>
                <p className="text-yellow-200 text-xs mt-1">{rec.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationsTab({ optimizations }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Рекомендації для покращення</h3>
      {optimizations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🎉</div>
          <p>Відмінна робота! Немає критичних рекомендацій</p>
          <p className="text-sm">Ваш робочий процес добре збалансований</p>
        </div>
      ) : (
        optimizations.map((optimization, index) => (
          <OptimizationCard key={index} optimization={optimization} />
        ))
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colorClasses = {
    green: 'bg-green-600/20 border-green-500/50 text-green-300',
    yellow: 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300',
    red: 'bg-red-600/20 border-red-500/50 text-red-300',
    blue: 'bg-blue-600/20 border-blue-500/50 text-blue-300',
    purple: 'bg-purple-600/20 border-purple-500/50 text-purple-300'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function PatternCard({ pattern }) {
  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔍</span>
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">{pattern.title}</h4>
          <p className="text-gray-300 text-sm mb-2">{pattern.description}</p>
          <p className="text-blue-300 text-sm">{pattern.actionable}</p>
          <div className="mt-2">
            <span className="text-xs text-gray-400">
              Впевненість: {Math.round(pattern.confidence)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptimizationCard({ optimization }) {
  const impactColors = {
    high: 'text-red-300',
    medium: 'text-yellow-300',
    low: 'text-green-300'
  };

  const effortColors = {
    high: 'bg-red-600/20 border-red-500/50',
    medium: 'bg-yellow-600/20 border-yellow-500/50',
    low: 'bg-green-600/20 border-green-500/50'
  };

  return (
    <div className={`p-4 rounded-lg border ${effortColors[optimization.effort]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">{optimization.title}</h4>
          <p className="text-gray-300 text-sm mb-2">{optimization.description}</p>
          <p className="text-blue-300 text-sm mb-3">{optimization.action}</p>
          <div className="flex gap-4 text-xs">
            <span className={impactColors[optimization.impact]}>
              Вплив: {optimization.impact}
            </span>
            <span className="text-gray-400">
              Зусилля: {optimization.effort}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
