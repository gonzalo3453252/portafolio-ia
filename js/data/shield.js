/* =============================================================================
   ESCUDO DE LA UNIVERSIDAD  (data/shield.js)
   Dibujo vectorial (SVG) del escudo, usado en las diapositivas e informes de ejemplo.

   Depende de: nada.
   Expone: UNMSM_SHIELD_SVG.
   ============================================================================= */
"use strict";

/** Escudo dibujado con SVG (no es el escudo oficial: es una ilustración sencilla). */
const UNMSM_SHIELD_SVG = `<svg viewBox="0 0 120 140" width="54" height="64" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
  <defs>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eab308"/>
      <stop offset="50%" stop-color="#ca8a04"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </linearGradient>
  </defs>
  <path d="M60 6 L106 24 L106 72 C106 104 84 124 60 134 C36 124 14 104 14 72 L14 24 Z" fill="url(#goldGrad)" stroke="#713f12" stroke-width="3"/>
  <path d="M60 14 L98 29 L98 70 C98 97 80 114 60 123 C40 114 22 97 22 70 L22 29 Z" fill="#fef9c3" stroke="#a16207" stroke-width="2"/>
  <path d="M60 20 L92 33 L92 68 C92 91 77 106 60 115 C43 106 28 91 28 68 L28 33 Z" fill="#1e3a8a"/>
  <line x1="60" y1="20" x2="60" y2="115" stroke="#eab308" stroke-width="2.5"/>
  <line x1="28" y1="68" x2="92" y2="68" stroke="#eab308" stroke-width="2.5"/>
  <circle cx="44" cy="46" r="8" fill="#eab308"/>
  <polygon points="76,36 80,46 90,46 82,52 85,62 76,56 67,62 70,52 62,46 72,46" fill="#eab308"/>
  <path d="M36 84 Q44 76 52 84 L52 96 L36 96 Z" fill="#eab308"/>
  <path d="M68 84 Q76 76 84 84 L84 96 L68 96 Z" fill="#eab308"/>
  <circle cx="60" cy="12" r="4" fill="#b91c1c"/>
</svg>`;
