/**
 * keywords.js — Listes de mots-clés de GTA 6 Spoiler Shield.
 *
 * Ce fichier est VOLONTAIREMENT séparé de la logique : modifiez-le librement.
 * Les termes sont écrits « naturellement » (accents, majuscules, espaces) :
 * matcher.js les normalise de la même façon que le texte des pages.
 *
 * Les variantes de « GTA 6 » (GTA6, GTA VI, G.T.A. 6, GTA-6, #GTA6,
 * Grand Theft Auto Six…) sont toutes ramenées à un même jeton par la
 * normalisation : inutile de les lister toutes ici.
 */
(function () {
  'use strict';
  const root = typeof self !== 'undefined' ? self : globalThis;
  const G = (root.G6S = root.G6S || {});

  G.DEFAULT_SETTINGS = {
    enabled: true,
    mode: 'extreme', // 'extreme' | 'intermediate'
    customKeywords: [],
    // Délai (en secondes) du compte à rebours avant d'afficher un contenu masqué
    // (bouton « Afficher quand même »). 0 = affichage immédiat. Réglable dans la popup.
    revealDelay: 5,
    // Thème de la popup : 'vicecity' (clair) | 'dark' (noir et rouge). Sans effet sur l'écran noir anti-spoil.
    theme: 'vicecity',
  };

  G.KEYWORDS = {
    // ── Termes du jeu ───────────────────────────────────────────────────
    game: [
      'GTA 6', 'GTA VI', 'GTA6', 'GTAVI',
      'Grand Theft Auto 6', 'Grand Theft Auto VI', 'GrandTheftAutoVI', 'Grand Theft Auto',
      'Rockstar Games', 'Rockstar',
      '#GTA6', '#GTAVI',
    ],

    // ── Personnages ─────────────────────────────────────────────────────
    characters: {
      // Prénoms courants : bloquent seuls en mode extrême uniquement.
      // En mode intermédiaire ils ne comptent JAMAIS seuls (il faut un autre
      // terme GTA : jeu, lieu ou personnage « spécifique »).
      ambiguous: ['Jason', 'Lucia'],
      // Noms propres propres au jeu : comptent comme des termes GTA à part entière.
      specific: [
        'Jason Duval', 'Lucia Caminos', 'Cal Hampton', 'Boobie Ike',
        "Dre'Quan Priest", 'Dre Quan Priest', 'DreQuan Priest',
        'Real Dimez', 'Raul Bautista', 'Brian Heder',
      ],
    },

    // ── Lieux ───────────────────────────────────────────────────────────
    places: [
      'Leonida', 'Vice City', 'Leonida Keys', 'Grassrivers', 'Grass Rivers',
      'Port Gellhorn', 'Ambrosia', 'Mount Kalaga', 'Ocean Beach', 'Little Cuba',
    ],

    // ── Termes de spoil, par langue ─────────────────────────────────────
    // « strong » = formulations qui sont des spoils à elles seules
    // (fin secrète, boss final, plot twist…). « normal » = mots généraux.
    //
    // POUR AJOUTER UNE LANGUE : copiez un bloc, changez la clé (ex. « nl »),
    // remplissez strong/normal. Rien d'autre à modifier.
    spoilTerms: {
      fr: {
        strong: [
          'fin secrète', 'choix final', 'dernier choix', 'dernière mission',
          'boss final', 'twist', 'retournement', 'spoil', 'spoils',
          'divulgâcheur', 'divulgâcheurs',
        ],
        normal: [
          'fin', 'fins', 'fin du jeu', 'mort', 'meurt', 'décès', 'deces', 'tué', 'tue',
          'révélation', 'trahison',
        ],
      },
      en: {
        strong: [
          'secret ending', 'final choice', 'last mission', 'final mission',
          'final boss', 'plot twist', 'spoiler', 'spoilers',
        ],
        normal: [
          'ending', 'endings', 'ends', 'end game', 'dies', 'death', 'dead',
          'killed', 'betrayal', 'reveal',
        ],
      },
      es: {
        strong: ['elección final', 'última misión', 'spoiler'],
        normal: ['final', 'muere', 'muerte', 'muerto', 'giro', 'traición', 'revelación'],
      },
      it: {
        strong: ['scelta finale', 'ultima missione', 'colpo di scena'],
        normal: ['finale', 'muore', 'morte', 'morto', 'tradimento', 'rivelazione'],
      },
      de: {
        strong: ['letzte Mission', 'Endkampf'],
        normal: ['Ende', 'stirbt', 'Tod', 'tot', 'Wendung', 'Verrat', 'Enthüllung'],
      },
      pt: {
        strong: ['escolha final', 'última missão', 'reviravolta'],
        normal: ['final', 'morre', 'morte', 'morto', 'traição', 'revelação'],
      },
    },
  };
})();
