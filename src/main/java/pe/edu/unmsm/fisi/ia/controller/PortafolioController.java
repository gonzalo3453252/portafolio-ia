package pe.edu.unmsm.fisi.ia.controller;

import pe.edu.unmsm.fisi.ia.model.SemanaTeorica;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controlador de solo lectura (GET) para visitantes.
 * Los visitantes solo pueden visualizar y descargar los archivos del curso.
 * Cualquier adición o cambio de PPT, Word o Colab se realiza únicamente
 * por el creador mediante commits en el repositorio de GitHub.
 */
@RestController
@RequestMapping("/api")
public class PortafolioController {

    @GetMapping("/curso")
    public Map<String, Object> obtenerDatosCurso() {
        return Map.of(
            "universidad", "Universidad Nacional Mayor de San Marcos",
            "facultad", "Facultad de Ingeniería de Sistemas e Informática",
            "escuela", "EP Ingeniería de Sistemas",
            "curso", "Inteligencia Artificial",
            "codigo", "201230703",
            "docente", "Dr. Hugo Froilán Vega Huerta",
            "autor", "Gonzalo Manuel Calero Falcón",
            "modoPublico", "SOLO_LECTURA_Y_DESCARGA"
        );
    }

    @GetMapping("/semanas")
    public List<SemanaTeorica> listarSemanasTeoricas() {
        return List.of(
            new SemanaTeorica(1, 1, "Unidad I", "Fundamentos de la Inteligencia Artificial",
                List.of("1.1 Conceptos e historia", "1.2 Áreas de aplicación", "1.3 Aprendizaje automático", "1.4 Niveles de la IA"),
                "/archivos/semana-01/Semana01_Fundamentos_IA.pptx",
                "/archivos/semana-01/Informe_Semana01_IA.doc",
                "/archivos/semana-01/Lab01_Sistemas_vs_IA.ipynb"),
            new SemanaTeorica(2, 1, "Unidad I", "Agentes Inteligentes",
                List.of("2.1 Conceptos, Tipos y Arquitectura", "2.4 Diseño de un Agente Racional PEAS", "2.5 Aplicaciones"),
                "/archivos/semana-02/Semana02_Agentes_Inteligentes.pptx",
                "/archivos/semana-02/Informe_Semana02_Agentes.doc",
                "/archivos/semana-02/Lab02_Agente_Reactivo_PEAS.ipynb"),
            new SemanaTeorica(3, 2, "Unidad II", "Búsquedas en Espacios de Estados",
                List.of("3.1 Problemas como búsqueda", "3.2 Espacios de estados", "3.3 Búsqueda ciega", "3.4 Búsqueda informada A*"),
                "/archivos/semana-03/Semana03_Busquedas_Espacio_Estados.pptx",
                "/archivos/semana-03/Informe_Semana03_Busqueda_AStar.doc",
                "/archivos/semana-03/Lab03_Algoritmo_A_Estrella.ipynb")
        );
    }
}
