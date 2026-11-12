/* =============================================================================
   DIAPOSITIVAS DE EJEMPLO
   Genera las diapositivas de muestra que se ven cuando una semana todavía no tiene un PPT real.
   ============================================================================= */

// =========================================================================
// GENERADOR DE 12 DIAPOSITIVAS ESTILO UNIVERSIDAD SAN MARCOS
// =========================================================================
function buildSlidesForWeek(w) {
  const parsedTopics = w.topics.map((t, i) => parseTopic(t, w.week, i));
  const slides = [
    {
      isCover: true,
      title: w.title.toUpperCase(),
      subtitle: `Semana ${w.week}: ${w.subtitleSlide || w.unitName}`
    },
    {
      section: "AGENDA DE LA SESIÓN",
      title: "Contenido Temático de la Semana " + w.week,
      subtitle: w.unitName,
      bullets: w.topics.map(topicTitle)
    },
    {
      section: "INTRODUCCIÓN Y CONTEXTO",
      title: "Panorama General de la Sesión",
      subtitle: "Propósito académico en Ingeniería de Sistemas:",
      bullets: [
        w.summary,
        `Modalidad evaluativa de la sesión: ${w.evaluation}.`,
        `Cátedra: ${appState.profName} — EP Ingeniería de Sistemas (FISI UNMSM).`
      ]
    }
  ];

  parsedTopics.forEach((pt, idx) => {
    slides.push({
      section: `TÓPICO ${pt.code}`,
      title: pt.title,
      subtitle: `Fundamentación teórica y análisis conceptual (Parte ${idx + 1}):`,
      bullets: [
        pt.desc,
        "Formalización matemática, propiedades estructurales y criterios de diseño en sistemas inteligentes.",
        "Estudio comparativo de casos reales analizados durante la sesión de clase."
      ]
    });
  });

  while (slides.length < 10) {
    slides.push({
      section: "ANÁLISIS APLICADO",
      title: "Arquitectura y Modelado Computacional",
      subtitle: `Esquema metodológico aplicado en la Semana ${w.week}:`,
      bullets: [
        "Definición de variables de entrada, representación del espacio de hipótesis y métricas de desempeño.",
        "Validación experimental de resultados frente a sistemas de información convencionales.",
        "Interpretabilidad y escalabilidad de la solución propuesta."
      ]
    });
  }

  slides.push({
    section: "EXPERIMENTACIÓN EN LABORATORIO",
    title: "Implementación Verificada en Python",
    subtitle: `Cuaderno asociado: ${w.colabLabel}`,
    code: w.codeSnippet
  });

  slides.push({
    section: "CONCLUSIONES Y REFERENCIAS",
    title: "Síntesis Final y Bibliografía Oficial",
    subtitle: "Referencias bibliográficas de la sesión:",
    bullets: [
      `Se consolidaron los fundamentos teóricos y prácticos de "${w.title}".`,
      "Russell, S., & Norvig, P. (2021). Artificial Intelligence: A Modern Approach (4th ed.). Pearson.",
      "Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning. MIT Press."
    ]
  });

  return slides.slice(0, 12);
}
