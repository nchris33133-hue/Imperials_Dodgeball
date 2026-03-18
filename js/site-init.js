/* ═══════════════════════════════════════
   SITE INIT — Vienna Imperials
   Bootstrap: load admin UI state, fetch rankings, render
═══════════════════════════════════════ */

updateAdminUI();
loadPlayersFromAPI().then(render);
