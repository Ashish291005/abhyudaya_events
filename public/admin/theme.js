// Apply the saved admin theme (or the device preference) before the page paints.
(function () {
  var t = null;
  try { t = localStorage.getItem('ae_admin_theme'); } catch (e) {}
  if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
})();
