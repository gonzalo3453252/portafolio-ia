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

1. Entra al repositorio en GitHub y abre `src/main/resources/static/archivos/semana-XX/`.
2. **Add file → Upload files** y sube tus archivos con estos nombres exactos:
   - `presentacion.pptx` (o `presentacion.pdf`)
   - `informe.docx` (o `informe.pdf`)
   - `laboratorio.ipynb`
3. **Commit changes**. En ~1 minuto aparecen solos en la semana correspondiente.

Si una semana no tiene archivos, la página muestra una versión de demostración.

> El panel `#creador` guarda los cambios solo en tu navegador; no sirve para publicar archivos a los demás.

## (Opcional) Ejecutar en tu PC con Java

```bash
mvn spring-boot:run
```
Luego abre `http://localhost:8080`.
