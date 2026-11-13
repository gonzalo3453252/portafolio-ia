/* =============================================================================
   DIAPOSITIVAS DE EJEMPLO  (features/demo-slides.js)
   Genera las diapositivas de muestra que se ven cuando una semana todavía no tiene un PPT real.
   Cada diapositiva es un objeto simple; quien las dibuja es demo-viewers.js (vista previa) y
   downloads.js (descarga).

   Forma de una diapositiva:
     { isCover, title, subtitle }                          → portada
     { section, title, subtitle, bullets: [texto] }        → contenido
     { section, title, subtitle, code: "texto" }           → código

   Depende de: state.js (appState), units-and-topics.js (parseTopic, topicTitle).
   Expone: buildSlidesForWeek.
   ============================================================================= */
"use strict";

const DEMO_SLIDES_MIN_BEFORE_LAB = 10;   // cantidad mínima antes de la diapositiva de laboratorio
const DEMO_SLIDES_TOTAL = 12;            // tope de diapositivas del ejemplo

/** Diapositiva de un tópico de la semana. */
function buildTopicSlide(parsedTopic, index) {
  return {
    section: `TÓPICO ${parsedTopic.code}`,
    title: parsedTopic.title,
    subtitle: `Fundamentación teórica y análisis conceptual (Parte ${index + 1}):`,
    bullets: [
      parsedTopic.desc,
      "Formalización matemática, propiedades estructurales y criterios de diseño en sistemas inteligentes.",
      "Estudio comparativo de casos reales analizados durante la sesión de clase."
    ]
  };
}

/** Diapositiva de relleno para semanas con pocos tópicos. */
function buildFillerSlide(week) {
  return {
    section: "ANÁLISIS APLICADO",
    title: "Arquitectura y Modelado Computacional",
    subtitle: `Esquema metodológico aplicado en la Semana ${week.week}:`,
    bullets: [
      "Definición de variables de entrada, representación del espacio de hipótesis y métricas de desempeño.",
      "Validación experimental de resultados frente a sistemas de información convencionales.",
      "Interpretabilidad y escalabilidad de la solución propuesta."
    ]
  };
}

/** Portada, agenda e introducción: las tres primeras diapositivas. */
function buildOpeningSlides(week) {
  return [
    {
      isCover: true,
      title: week.title.toUpperCase(),
      subtitle: `Semana ${week.week}: ${week.subtitleSlide || week.unitName}`
    },
    {
      section: "AGENDA DE LA SESIÓN",
      title: "Contenido Temático de la Semana " + week.week,
      subtitle: week.unitName,
      bullets: week.topics.map(topicTitle)
    },
    {
      section: "INTRODUCCIÓN Y CONTEXTO",
      title: "Panorama General de la Sesión",
      subtitle: "Propósito académico en Ingeniería de Sistemas:",
      bullets: [
        week.summary,
        `Modalidad evaluativa de la sesión: ${week.evaluation}.`,
        `Cátedra: ${appState.profName} — EP Ingeniería de Sistemas (FISI UNMSM).`
      ]
    }
  ];
}

/** Diapositiva de laboratorio (código) y de conclusiones: las dos últimas. */
function buildClosingSlides(week) {
  return [
    {
      section: "EXPERIMENTACIÓN EN LABORATORIO",
      title: "Implementación Verificada en Python",
      subtitle: `Cuaderno asociado: ${week.colabLabel}`,
      code: week.codeSnippet
    },
    {
      section: "CONCLUSIONES Y REFERENCIAS",
      title: "Síntesis Final y Bibliografía Oficial",
      subtitle: "Referencias bibliográficas de la sesión:",
      bullets: [
        `Se consolidaron los fundamentos teóricos y prácticos de "${week.title}".`,
        "Russell, S., & Norvig, P. (2021). Artificial Intelligence: A Modern Approach (4th ed.). Pearson.",
        "Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning. MIT Press."
      ]
    }
  ];
}

/**
 * Las diapositivas de ejemplo de una semana (máximo 12): portada, agenda, introducción, un tópico por
 * diapositiva, relleno si hacen falta más, laboratorio y conclusiones.
 */
function buildSlidesForWeek(week) {
  const slides = buildOpeningSlides(week);
  week.topics.forEach((topic, index) => {
    slides.push(buildTopicSlide(parseTopic(topic, week.week, index), index));
  });
  while (slides.length < DEMO_SLIDES_MIN_BEFORE_LAB) slides.push(buildFillerSlide(week));
  slides.push(...buildClosingSlides(week));
  return slides.slice(0, DEMO_SLIDES_TOTAL);
}
