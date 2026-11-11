/**
 * theme-init.js — Applique le thème de la popup AVANT le premier affichage
 * (évite un flash de mauvais thème). Chargé de façon synchrone dans <head>.
 * Le thème est mémorisé dans le localStorage de la popup par popup.js ;
 * la source de vérité reste chrome.storage.sync (clé « theme »).
 */
(function () {
  'use strict';
  var theme = 'sunset'; // thème par défaut
  try { theme = localStorage.getItem('g6s-theme') || theme; } catch (e) { /* ignoré */ }
  // Thèmes disponibles : à garder en phase avec THEMES dans popup.js
  var themes = ['sunset', 'sunset-dark', 'vicecity', 'dark'];
  document.documentElement.setAttribute('data-theme', themes.indexOf(theme) >= 0 ? theme : themes[0]);
})();
