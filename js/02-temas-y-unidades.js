/* =============================================================================
   TEMAS Y UNIDADES
   Descripción de cada tema, nombres de las 5 unidades y su información (resultados de aprendizaje, etc.).
   Aquí se editan los textos de las unidades.
   ============================================================================= */

const TOPIC_DESCRIPTIONS = {
  "1.1": "Recorrido desde el Test de Turing (1950) y la Conferencia de Dartmouth (1956) hasta los sistemas cognitivos modernos.",
  "1.2": "Casos de uso en diagnóstico asistido por visión artificial, comprensión del lenguaje humano, robótica autónoma y sistemas expertos.",
  "1.3": "Transición de los algoritmos basados en reglas fijas hacia modelos capaces de descubrir patrones a partir de datos empíricos.",
  "1.4": "Contraste entre IA estrecha (ANI), general (AGI) y superinteligencia (ASI) frente al procesamiento transaccional de los sistemas clásicos.",

  "2.1": "Definición del ciclo de percepción-acción donde el agente captura señales mediante sensores y ejecuta decisiones con actuadores.",
  "2.2": "Comparación estructural entre agentes reactivos simples, con estado interno, orientados a metas y maximizadores de utilidad esperada.",
  "2.3": "Formulación de medidas de rendimiento y clasificación de entornos observables, deterministas, dinámicos, discretos y multiagente.",
  "2.4": "Despliegue de agentes autónomos en navegación vehicular, comercio electrónico automatizado, monitoreo industrial y logística.",

  "3.1": "Abstracción de problemas complejos definiendo estado inicial, función sucesora, test de meta y costo de ruta en grafos.",
  "3.2": "Construcción de árboles de exploración, manejo de la frontera de nodos abiertos y control de estados repetidos en memoria.",
  "3.3": "Análisis de completitud, optimalidad y consumo de memoria entre Búsqueda en Anchura (BFS) y Búsqueda en Profundidad (DFS).",
  "3.4": "Diseño de funciones heurísticas admisibles y consistentes h(n) para hallar caminos de costo mínimo con el algoritmo A*.",

  "4.1": "Formalización de juegos bipersonales de información perfecta donde la ganancia de un jugador equivale a la pérdida del adversario.",
  "4.2": "Propagación recursiva de valores MAX/MIN y poda de subárboles irrelevantes mediante cotas Alfa y Beta para acelerar el cálculo.",
  "4.3": "Construcción de funciones de utilidad en profundidades límite e integración de aprendizaje por refuerzo en tableros complejos.",

  "5.1": "Flujo de preprocesamiento, limpieza de atributos y división estratificada en conjuntos de entrenamiento, validación y prueba.",
  "5.2": "Modelado de variables objetivo discretas (clasificación multiclase o binaria) y estimación de variables continuas (regresión).",
  "5.3": "Diagnóstico de subajuste y sobreajuste (overfitting) aplicando penalización L1/L2 y validación cruzada K-Fold.",
  "5.4": "Fundamentos geométricos y probabilísticos de particiones por ganancia de información, ensambles bagging, hiperplanos SVM y distancias KNN.",
  "5.5": "Entrenamiento de tuberías (pipelines) en Scikit-Learn evaluando matrices de confusión, curvas ROC-AUC, Precision, Recall y F1-Score.",

  "6.1": "Identificación de estructuras subyacentes y distribuciones intrínsecas en repositorios de datos que carecen de variable objetivo.",
  "6.2": "Agrupamiento de perfiles de consumidores, compresión de información visual y detección de transacciones atípicas o fraudulentas.",
  "6.3": "Particionamiento iterativo por centroides (K-Means), agrupamiento por densidad (DBSCAN) y proyección ortogonal de varianza (PCA).",
  "6.4": "Determinación del número óptimo de clústeres mediante la curva del método del codo (inercia) y el índice de cohesión de Silueta.",

  "7.1": "Modelado de toma de decisiones secuenciales mediante estados, acciones, probabilidades de transición y señales de recompensa.",
  "7.2": "Balance entre descubrir nuevas rutas (exploración ε-greedy) y aprovechar el conocimiento adquirido bajo la ecuación de optimalidad de Bellman.",
  "7.3": "Actualización iterativa de valores acción-estado fuera de política (Q-Learning) y dentro de política (SARSA) sin modelo previo del entorno.",
  "7.4": "Simulación en Python de un agente que converge hacia la política óptima superando obstáculos y maximizando el retorno descontado.",

  "9.1": "Aprendizaje automático de representaciones jerárquicas mediante múltiples capas ocultas de procesamiento no lineal.",
  "9.2": "Ventajas de la extracción automática de características en grandes volúmenes de datos frente a la ingeniería manual de atributos.",
  "9.3": "Aceleración matricial sobre GPUs/TPUs y aplicaciones de alto impacto en bioinformática, voz y sistemas de recomendación.",
  "9.4": "Cálculo del paso hacia adelante (forward pass), activaciones ReLU/Sigmoid/Softmax y retropropagación de gradientes (Backpropagation).",
  "9.5": "Monitoreo época por época de la función de pérdida (Loss) y ajuste de hiperparámetros con optimizadores SGD y Adam.",

  "10.1": "Representación tensorial de imágenes digitales (canales RGB) y preservación de la topología espacial mediante campos receptivos locales.",
  "10.2": "Detección automatizada de patologías en radiografías, control de calidad en líneas de manufactura y reconocimiento biométrico.",
  "10.3": "Aplicación de filtros convolucionales (kernels), control de bordes (padding), paso de desplazamiento (stride) y reducción MaxPooling.",
  "10.4": "Evolución de la profundidad y conexiones residuales desde LeNet-5 y AlexNet hasta VGG-16 y ResNet en competencias ImageNet.",
  "10.5": "Implementación de un clasificador visual completo evaluando su exactitud y mapas de activación sobre conjuntos de imágenes.",

  "11.1": "Incapacidad de las redes densas estáticas para capturar el orden cronológico y la dependencia contextual en secuencias de longitud variable.",
  "11.2": "Arquitectura con conexiones de retroalimentación que mantienen un vector de estado oculto compartido a través de los pasos de tiempo.",
  "11.3": "Análisis matemático de la degradación o saturación de gradientes al propagar errores a través de secuencias extensas (BPTT).",
  "11.4": "Regulación del flujo de memoria a largo plazo mediante compuertas de olvido, entrada y salida en celdas LSTM y unidades GRU.",
  "11.5": "Entrenamiento de modelos recurrentes para pronóstico de demanda temporal y modelado secuencial de texto en Python.",

  "12.1": "Modelado de la distribución de probabilidad conjunta de los datos para sintetizar muestras inéditas de texto, código, audio o imagen.",
  "12.2": "Contraste entre estimar fronteras de decisión condicionales P(y|x) y aprender la estructura generativa completa del dominio.",
  "12.3": "Revisión de codificadores variacionales (VAEs), redes adversarias (GANs) y modelado autorregresivo de siguiente token.",
  "12.4": "Cálculo paralelo de dependencias contextuales mediante matrices Query, Key y Value en bloques Multi-Head Self-Attention.",
  "12.5": "Preentrenamiento a gran escala, ajuste fino (fine-tuning), ingeniería de prompts y construcción de agentes conectados vía API.",

  "13.1": "Juego competitivo de suma cero donde el Generador busca sintetizar muestras indistinguibles de las reales frente al Discriminador.",
  "13.2": "Generación fotorrealista de rostros, superresolución de imágenes médicas y traslación de estilos pictóricos entre dominios.",
  "13.3": "Enriquecimiento de conjuntos de datos desbalanceados mediante la creación controlada de ejemplos sintéticos de entrenamiento.",
  "13.5": "Diseño en PyTorch de las redes Generadora y Discriminadora, estabilizando el entrenamiento adversario con funciones de pérdida BCE.",

  "14.1": "Sinergia humano-máquina en procesos de diseño, composición artística y exploración conceptual asistida por modelos multimodales.",
  "14.2": "Síntesis de artes visuales por difusión latente, composición musical algorítmica y estructuración de guiones y narrativa literaria.",
  "14.3": "Análisis de los principios rectores de la Ley N.° 31814 en el Perú y los niveles de riesgo regulados por el EU AI Act europeo.",
  "14.4": "Evaluación de impacto dispar, equidad algorítmica, trazabilidad, protección de datos personales y desafíos futuros de la IA."
};

function parseTopicItem(rawTopic, weekNum, idx) {
  const match = String(rawTopic || "").match(/^(\d+\.\d+)\s+(.*)$/);
  const numBadge = String((idx || 0) + 1).padStart(2, "0") + ".";
  if (match) {
    const code = match[1];
    const title = match[2];
    const desc = TOPIC_DESCRIPTIONS[code] || `Análisis conceptual y práctico de ${title.toLowerCase()} en la sesión ${weekNum}.`;
    return { code, numBadge, title, desc };
  }
  return {
    code: `S${weekNum}`,
    numBadge,
    title: rawTopic,
    desc: `Desarrollo conceptual y aplicado de ${String(rawTopic).toLowerCase()}.`
  };
}

const UNITS_INFO = {
  1: {
    unit: 1,
    roman: "Unidad I",
    badge: "UNIDAD I · SEMANAS 01 – 02",
    shortHeader: "UNIDAD I · FUNDAMENTOS DE LA IA Y AGENTES",
    title: "Fundamentos de la IA y Agentes Inteligentes",
    summary: "Orígenes históricos, fundamentos conceptuales y evolución de la Inteligencia Artificial desde Alan Turing y la Conferencia de Dartmouth, junto con el diseño formal de agentes autónomos racionales bajo la especificación PEAS.",
    objective: "Diferenciar los sistemas de información convencionales de los sistemas inteligentes y diseñar arquitecturas de agentes autónomos mediante la especificación PEAS (Performance, Environment, Actuators, Sensors).",
    caption: "Unidad I — Laboratorio de Sistemas Inteligentes y Arquitecturas de Agentes Racionales"
  },
  2: {
    unit: 2,
    roman: "Unidad II",
    badge: "UNIDAD II · SEMANAS 03 – 04",
    shortHeader: "UNIDAD II · BÚSQUEDAS Y JUEGOS DE ESTRATEGIA",
    title: "Búsquedas en Espacios de Estados y Juegos",
    summary: "Resolución de problemas mediante la exploración sistemática de grafos de estados, contrastando las búsquedas ciegas (BFS y DFS) frente al algoritmo heurístico A* y la teoría de juegos adversarios con Minimax y Poda Alfa-Beta.",
    objective: "Implementar algoritmos de búsqueda ciega (BFS, DFS), búsqueda informada (A* con heurísticas admisibles) y árboles de juegos adversarios de suma cero mediante Minimax y Poda Alfa-Beta.",
    caption: "Unidad II — Exploración Heurística de Grafos y Teoría de Juegos Adversarios"
  },
  3: {
    unit: 3,
    roman: "Unidad III",
    badge: "UNIDAD III · SEMANAS 05 – 07",
    shortHeader: "UNIDAD III · MACHINE LEARNING",
    title: "Aprendizaje Supervisado, No Supervisado y Refuerzo",
    summary: "Paradigmas del Aprendizaje Automático para construir modelos predictivos y descriptivos a partir de datos, abarcando clasificación supervisada, agrupamiento latente (K-Means, PCA) y aprendizaje por refuerzo con Q-Learning.",
    objective: "Entrenar y validar modelos supervisados (Random Forest, SVM, Árboles), algoritmos de agrupamiento no supervisado (K-Means, PCA) y políticas óptimas mediante Procesos de Decisión de Markov y Q-Learning.",
    caption: "Unidad III — Modelado Estadístico, Clustering Latente y Optimización de Bellman"
  },
  4: {
    unit: 4,
    roman: "Unidad IV",
    badge: "UNIDAD IV · SEMANAS 09 – 11",
    shortHeader: "UNIDAD IV · DEEP LEARNING Y VISIÓN COMPUTACIONAL",
    title: "Deep Learning, Visión Computacional y Secuencias",
    summary: "Fundamentos del Aprendizaje Profundo mediante redes neuronales artificiales multicapa y retropropagación del error, junto con arquitecturas convolucionales (CNN) para imágenes y recurrentes (LSTM) para series temporales.",
    objective: "Construir y evaluar Redes Neuronales Multicapa (ANN/MLP), Redes Convolucionales (CNN) para reconocimiento visual y Redes Recurrentes con celdas de memoria (RNN/LSTM) para datos secuenciales.",
    caption: "Unidad IV — Arquitecturas Profundas, Visión por Computadora y Modelado Temporal"
  },
  5: {
    unit: 5,
    roman: "Unidad V",
    badge: "UNIDAD V · SEMANAS 12 – 14",
    shortHeader: "UNIDAD V · IA GENERATIVA, MARCO LEGAL Y ÉTICA",
    title: "IA Generativa, Modelos de Lenguaje y Ética",
    summary: "Arquitectura Transformer, mecanismo Self-Attention en Grandes Modelos de Lenguaje (LLM) y Redes Generativas Adversarias (GAN), integrando la auditoría de sesgos y el marco legal de la Ley N.° 31814 y el EU AI Act.",
    objective: "Comprender la arquitectura Transformer (Self-Attention y GPT), implementar esquemas generativos adversarios (GAN) y auditar el impacto ético y normativo bajo la Ley N.° 31814 del Perú y el EU AI Act.",
    caption: "Unidad V — Modelos Fundacionales Transformer, Síntesis Generativa y Gobernanza Algorítmica"
  }
};
