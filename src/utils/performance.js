// Performance monitoring utilities
export const measurePerformance = () => {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        console.log('Navigation timing:', {
          domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
          loadComplete: entry.loadEventEnd - entry.loadEventStart
        });
      }
      
      if (entry.entryType === 'paint') {
        console.log(`${entry.name}: ${entry.startTime}ms`);
      }
    });
  });

  observer.observe({ entryTypes: ['navigation', 'paint'] });

  // Bundle size tracking
  if (import.meta.env.PROD) {
    console.log('Production build loaded');
  }
};

// Memory usage monitoring
export const trackMemoryUsage = () => {
  if (performance.memory) {
    const memory = performance.memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  measurePerformance();
  
  // Track memory usage every 30 seconds in development
  if (import.meta.env.DEV) {
    setInterval(trackMemoryUsage, 30000);
  }
};
