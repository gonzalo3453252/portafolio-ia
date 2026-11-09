# Portafolio Académico — Inteligencia Artificial (UNMSM - FISI)

**Autor:** Gonzalo Manuel Calero Falcón  
**Cátedra:** Dr. Hugo Froilán Vega Huerta  
**Asignatura:** Inteligencia Artificial (Código: 201230703) — EP Ingeniería de Sistemas

## Cómo funciona

El sitio es **estático**: todo vive en `src/main/resources/static/index.html` y la carpeta `archivos/`.
Se publica gratis con **GitHub Pages** (workflow en `.github/workflows/pages.yml`) cada vez que haces un commit en `main`.

- **Visitantes:** solo ven el contenido del portafolio (semanas, informes, PPT, labs, sílabo). No hay ningún botón de administración.
- **Creador:** entra a `https://TU-SITIO/#creador` para abrir el panel interno. Los cambios que hagas ahí se guardan solo en tu navegador; para publicarlos usa "Exportar index.html" y sube ese archivo a GitHub.

## Cómo subir tus PPT, Word y Colab (solo tú)

Solo quien tiene acceso al repositorio de GitHub puede agregar archivos. Los visitantes solo ven y descargan.

1. Entra al repositorio en GitHub y abre `src/main/resources/static/archivos/semana-XX/` (o usa los botones del panel `#creador`).
2. **Add file → Upload files** y sube tus archivos **con el nombre que quieras**:
   - `.pptx` → Presentación · `.docx` → Informe · `.ipynb` → Laboratorio
   - `.pdf` → Informe si el nombre dice *informe, tarea, reporte, trabajo* o viene de un .docx; si no, ocupa el hueco libre (primero Presentación).
3. **Commit changes**. En 1-2 minutos aparecen solos en la semana correspondiente.

Si una semana no tiene archivos, la página muestra una versión de demostración.
La lista de archivos la genera `scripts/generar-manifiesto.js` automáticamente al publicar.

> El panel `#creador` guarda los cambios solo en tu navegador; no sirve para publicar archivos a los demás.

### Vistas PDF automáticas
Cada `.pptx` / `.docx` que subes genera solo su vista en PDF (carpeta `_vista/` de la semana, mediante el workflow
`Generar vistas PDF…` en la pestaña Actions). La página usa esa vista para mostrar las diapositivas nítidas y completas.
Tarda ~2-3 minutos; mientras tanto se usa el visor de Microsoft. **No borres ni edites la carpeta `_vista`.**

## (Opcional) Ejecutar en tu PC con Java

```bash
mvn spring-boot:run
```
Luego abre `http://localhost:8080`.
