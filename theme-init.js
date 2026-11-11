/**
 * theme-init.js — Applique le thème de la popup AVANT le premier affichage
 * (évite un flash de mauvais thème). Chargé de façon synchrone dans <head>.
 * Le thème est mémorisé dans le localStorage de la popup par popup.js ;
 * la source de vérité reste chrome.storage.sync (clé « theme »).
 */
(function () {
  'use strict';
  var theme = 'vicecity';
  try { theme = localStorage.getItem('g6s-theme') || theme; } catch (e) { /* ignoré */ }
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'vicecity');
})();
