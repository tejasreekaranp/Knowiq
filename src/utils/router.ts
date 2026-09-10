// Client-side lightweight URL router with HTML5 History API synchronization
// Supports direct URL access, refresh, back/forward navigation without external dependencies

export type AppRoute = 
  | { type: 'home' }
  | { type: 'course-details'; courseId: string }
  | { type: 'learning'; courseId: string; subtopicId: string }
  | { type: 'tab'; tab: 'home' | 'learn-space' | 'spaced-revision' | 'badges' };

export const parseCurrentRoute = (): AppRoute => {
  if (typeof window === 'undefined') return { type: 'home' };

  const pathname = window.location.pathname;

  // 1. /course/:courseId/learn/:subtopicId
  const learnMatch = pathname.match(/^\/course\/([^/]+)\/learn\/([^/]+)/);
  if (learnMatch) {
    return {
      type: 'learning',
      courseId: decodeURIComponent(learnMatch[1]),
      subtopicId: decodeURIComponent(learnMatch[2]),
    };
  }

  // 2. /learn/:subtopicId (shorthand learning route)
  const shortLearnMatch = pathname.match(/^\/learn\/([^/]+)/);
  if (shortLearnMatch) {
    return {
      type: 'learning',
      courseId: '',
      subtopicId: decodeURIComponent(shortLearnMatch[1]),
    };
  }

  // 3. /course/:courseId
  const courseMatch = pathname.match(/^\/course\/([^/]+)/);
  if (courseMatch) {
    return {
      type: 'course-details',
      courseId: decodeURIComponent(courseMatch[1]),
    };
  }

  // 4. Tab routes: /learn-space, /spaced-revision, /badges
  if (pathname.startsWith('/learn-space')) {
    return { type: 'tab', tab: 'learn-space' };
  }
  if (pathname.startsWith('/spaced-revision')) {
    return { type: 'tab', tab: 'spaced-revision' };
  }
  if (pathname.startsWith('/badges')) {
    return { type: 'tab', tab: 'badges' };
  }

  // Default: home
  return { type: 'home' };
};

export const navigateTo = (path: string, replace = false) => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path) return;

  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }

  // Dispatch custom event for reactive state synchronization
  window.dispatchEvent(new Event('app-route-change'));
};
