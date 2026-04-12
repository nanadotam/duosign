export function ThemeScript() {
  const script = `
    (function() {
      try {
        var saved = localStorage.getItem('duosign-theme');
        if (saved === 'light' || saved === 'dark') {
          document.documentElement.setAttribute('data-theme', saved);
          return;
        }
        // No saved pref — try browser preference first
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          document.documentElement.setAttribute('data-theme', 'light');
          return;
        }
        // Fall back to time of day: 7am–8pm → light, otherwise dark
        var h = new Date().getHours();
        document.documentElement.setAttribute('data-theme', (h >= 7 && h < 20) ? 'light' : 'dark');
      } catch(e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
