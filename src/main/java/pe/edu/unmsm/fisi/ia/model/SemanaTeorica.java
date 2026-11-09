package pe.edu.unmsm.fisi.ia.model;

import java.util.List;

public record SemanaTeorica(
    int numeroSemana,
    int unidad,
    String nombreUnidad,
    String titulo,
    List<String> subtemas,
    String rutaPpt,
    String rutaWord,
    String rutaColab
) {}
