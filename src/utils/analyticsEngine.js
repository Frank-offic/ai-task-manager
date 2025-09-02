import { differenceInDays, parseISO, startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';

// Calculate productivity score based on task completion and timing
export function calculateProductivityScore(tasks, timeframe = 30) {
  const now = new Date();
  const startDate = new Date(now.getTime() - timeframe * 24 * 60 * 60 * 1000);
  
  const relevantTasks = tasks.filter(task => {
    const createdAt = parseISO(task.createdAt);
    return createdAt >= startDate;
  });

  if (relevantTasks.length === 0) return 0;

  const completedTasks = relevantTasks.filter(task => task.completed);
  const completionRate = completedTasks.length / relevantTasks.length;
  
  // Factor in on-time completion
  const onTimeCompletions = completedTasks.filter(task => {
    if (!task.dueDate) return true; // No deadline = on time
    const completedDate = task.completedAt ? parseISO(task.completedAt) : parseISO(task.createdAt);
    const dueDate = parseISO(task.dueDate);
    return completedDate <= dueDate;
  });
  
  const onTimeRate = completedTasks.length > 0 ? onTimeCompletions.length / completedTasks.length : 1;
  
  // Priority weighting
  const priorityWeights = { high: 3, medium: 2, low: 1 };
  const weightedCompleted = completedTasks.reduce((sum, task) => sum + priorityWeights[task.priority], 0);
  const weightedTotal = relevantTasks.reduce((sum, task) => sum + priorityWeights[task.priority], 0);
  const priorityScore = weightedTotal > 0 ? weightedCompleted / weightedTotal : 0;
  
  // Combined score (0-100)
  return Math.round((completionRate * 0.4 + onTimeRate * 0.3 + priorityScore * 0.3) * 100);
}

// Identify patterns in user behavior and task completion
export function identifyPatterns(tasks, projects) {
  const patterns = [];
  
  // Most productive days of week
  const dayStats = {};
  const completedTasks = tasks.filter(task => task.completed && task.completedAt);
  
  completedTasks.forEach(task => {
    const day = format(parseISO(task.completedAt), 'EEEE');
    dayStats[day] = (dayStats[day] || 0) + 1;
  });
  
  const mostProductiveDay = Object.entries(dayStats).reduce((a, b) => 
    dayStats[a[0]] > dayStats[b[0]] ? a : b, ['Monday', 0]
  );
  
  if (mostProductiveDay[1] > 0) {
    patterns.push({
      type: 'productivity_day',
      title: 'Найпродуктивніший день',
      description: `Ви найчастіше завершуєте завдання у ${mostProductiveDay[0]} (${mostProductiveDay[1]} завдань)`,
      confidence: Math.min(mostProductiveDay[1] / completedTasks.length * 100, 95),
      actionable: `Плануйте важливі завдання на ${mostProductiveDay[0]}`
    });
  }
  
  // Project completion patterns
  const projectStats = projects.map(project => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const completed = projectTasks.filter(task => task.completed).length;
    const total = projectTasks.length;
    
    return {
      project,
      completionRate: total > 0 ? completed / total : 0,
      totalTasks: total,
      completedTasks: completed
    };
  }).filter(stat => stat.totalTasks > 0);
  
  const bestProject = projectStats.reduce((best, current) => 
    current.completionRate > best.completionRate ? current : best, 
    { completionRate: 0 }
  );
  
  if (bestProject.completionRate > 0.7 && bestProject.totalTasks >= 3) {
    patterns.push({
      type: 'project_success',
      title: 'Успішний проект',
      description: `Проект "${bestProject.project.name}" має найвищий рівень завершення (${Math.round(bestProject.completionRate * 100)}%)`,
      confidence: Math.min(bestProject.totalTasks * 10, 90),
      actionable: 'Застосуйте підходи з цього проекту до інших'
    });
  }
  
  // Overdue task patterns
  const overdueTasks = tasks.filter(task => 
    !task.completed && task.dueDate && parseISO(task.dueDate) < new Date()
  );
  
  if (overdueTasks.length > 0) {
    const overdueByPriority = overdueTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    
    const mostOverduePriority = Object.entries(overdueByPriority).reduce((a, b) => 
      a[1] > b[1] ? a : b
    );
    
    patterns.push({
      type: 'overdue_pattern',
      title: 'Прострочені завдання',
      description: `У вас ${overdueTasks.length} прострочених завдань, більшість з пріоритетом "${mostOverduePriority[0]}"`,
      confidence: 85,
      actionable: 'Розгляньте можливість перегляду дедлайнів або пріоритетів'
    });
  }
  
  return patterns;
}

// Suggest optimizations based on current workload and habits
export function suggestOptimizations(workload, habits) {
  const suggestions = [];
  
  // Workload balance suggestions
  if (workload.highPriorityTasks > workload.totalTasks * 0.5) {
    suggestions.push({
      type: 'priority_balance',
      title: 'Збалансуйте пріоритети',
      description: 'Забагато завдань з високим пріоритетом може призвести до стресу',
      impact: 'high',
      effort: 'low',
      action: 'Перегляньте пріоритети та знизьте деякі до середнього рівня'
    });
  }
  
  // Time management suggestions
  if (habits.averageTaskDuration > 120) { // More than 2 hours
    suggestions.push({
      type: 'task_breakdown',
      title: 'Розбийте великі завдання',
      description: 'Великі завдання важче завершувати та відстежувати',
      impact: 'medium',
      effort: 'medium',
      action: 'Розділіть завдання тривалістю понад 2 години на менші частини'
    });
  }
  
  // Deadline management
  if (workload.upcomingDeadlines > 5) {
    suggestions.push({
      type: 'deadline_management',
      title: 'Управління дедлайнами',
      description: 'Багато наближених дедлайнів можуть створити тиск',
      impact: 'high',
      effort: 'medium',
      action: 'Розподіліть завдання з дедлайнами більш рівномірно'
    });
  }
  
  // Project focus suggestions
  if (workload.activeProjects > 3) {
    suggestions.push({
      type: 'project_focus',
      title: 'Сфокусуйтесь на менших проектах',
      description: 'Робота над багатьма проектами одночасно знижує ефективність',
      impact: 'high',
      effort: 'high',
      action: 'Зосередьтесь на 2-3 найважливіших проектах'
    });
  }
  
  return suggestions.sort((a, b) => {
    const impactWeight = { high: 3, medium: 2, low: 1 };
    const effortWeight = { low: 3, medium: 2, high: 1 };
    
    const scoreA = impactWeight[a.impact] + effortWeight[a.effort];
    const scoreB = impactWeight[b.impact] + effortWeight[b.effort];
    
    return scoreB - scoreA;
  });
}

// Predict task completion time based on historical data
export function predictTaskCompletion(task, historicalData) {
  const similarTasks = historicalData.filter(histTask => 
    histTask.completed &&
    histTask.priority === task.priority &&
    histTask.projectId === task.projectId &&
    histTask.actualMinutes
  );
  
  if (similarTasks.length === 0) {
    // Default estimates based on priority
    const defaultEstimates = {
      high: 180, // 3 hours
      medium: 120, // 2 hours
      low: 60 // 1 hour
    };
    return {
      estimatedMinutes: defaultEstimates[task.priority],
      confidence: 'low',
      basedOn: 'default_estimates'
    };
  }
  
  const avgTime = similarTasks.reduce((sum, t) => sum + t.actualMinutes, 0) / similarTasks.length;
  const confidence = Math.min(similarTasks.length * 20, 90);
  
  return {
    estimatedMinutes: Math.round(avgTime),
    confidence: confidence > 70 ? 'high' : confidence > 40 ? 'medium' : 'low',
    basedOn: `${similarTasks.length} similar tasks`,
    range: {
      min: Math.round(avgTime * 0.7),
      max: Math.round(avgTime * 1.3)
    }
  };
}

// Analyze workload balance across time periods
export function analyzeWorkloadBalance(tasks, timeframe = 'week') {
  const now = new Date();
  let startDate, endDate;
  
  if (timeframe === 'week') {
    startDate = startOfWeek(now);
    endDate = endOfWeek(now);
  } else {
    // Default to current week
    startDate = startOfWeek(now);
    endDate = endOfWeek(now);
  }
  
  const relevantTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = parseISO(task.dueDate);
    return isWithinInterval(dueDate, { start: startDate, end: endDate });
  });
  
  // Group by day
  const dailyWorkload = {};
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayKey = format(d, 'yyyy-MM-dd');
    dailyWorkload[dayKey] = {
      date: new Date(d),
      tasks: [],
      totalEstimatedMinutes: 0,
      priorityBreakdown: { high: 0, medium: 0, low: 0 }
    };
  }
  
  relevantTasks.forEach(task => {
    const dayKey = format(parseISO(task.dueDate), 'yyyy-MM-dd');
    if (dailyWorkload[dayKey]) {
      dailyWorkload[dayKey].tasks.push(task);
      dailyWorkload[dayKey].totalEstimatedMinutes += task.estimatedMinutes || 60;
      dailyWorkload[dayKey].priorityBreakdown[task.priority]++;
    }
  });
  
  // Calculate balance metrics
  const workloadValues = Object.values(dailyWorkload).map(day => day.totalEstimatedMinutes);
  const avgWorkload = workloadValues.reduce((sum, val) => sum + val, 0) / workloadValues.length;
  const maxWorkload = Math.max(...workloadValues);
  const minWorkload = Math.min(...workloadValues);
  
  const balance = maxWorkload > 0 ? 1 - ((maxWorkload - minWorkload) / maxWorkload) : 1;
  
  return {
    dailyWorkload,
    metrics: {
      averageDaily: Math.round(avgWorkload),
      maxDaily: maxWorkload,
      minDaily: minWorkload,
      balance: Math.round(balance * 100), // 0-100, higher is more balanced
      totalTasks: relevantTasks.length,
      busiestDay: Object.entries(dailyWorkload).reduce((busiest, [key, day]) => 
        day.totalEstimatedMinutes > busiest.workload 
          ? { date: key, workload: day.totalEstimatedMinutes }
          : busiest,
        { date: null, workload: 0 }
      )
    },
    recommendations: generateWorkloadRecommendations(dailyWorkload, avgWorkload)
  };
}

function generateWorkloadRecommendations(dailyWorkload, avgWorkload) {
  const recommendations = [];
  
  Object.entries(dailyWorkload).forEach(([date, day]) => {
    if (day.totalEstimatedMinutes > avgWorkload * 1.5) {
      recommendations.push({
        type: 'overloaded_day',
        date,
        message: `${format(day.date, 'EEEE')} перевантажений (${Math.round(day.totalEstimatedMinutes / 60)} годин)`,
        suggestion: 'Розгляньте перенесення деяких завдань на інші дні'
      });
    }
    
    if (day.priorityBreakdown.high > 3) {
      recommendations.push({
        type: 'too_many_high_priority',
        date,
        message: `Забагато високопріоритетних завдань на ${format(day.date, 'EEEE')}`,
        suggestion: 'Розподіліть високопріоритетні завдання протягом тижня'
      });
    }
  });
  
  return recommendations;
}
