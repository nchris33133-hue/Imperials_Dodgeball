/* ═══════════════════════════════════════
   SITE INIT — Vienna Imperials
   Bootstrap: fetch rankings and render public leaderboard
═══════════════════════════════════════ */

if (players.length) render();
loadPlayersFromAPI().then(render);
