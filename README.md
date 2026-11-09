# Portafolio Académico — Inteligencia Artificial (UNMSM - FISI)

**Autor:** Gonzalo Manuel Calero Falcón  
**Cátedra:** Dr. Hugo Froilán Vega Huerta  
**Asignatura:** Inteligencia Artificial (Código: 201230703) — EP Ingeniería de Sistemas

## Cómo funciona

El sitio es **estático**: todo vive en `src/main/resources/static/index.html` y la carpeta `archivos/`.
Se publica gratis con **GitHub Pages** (workflow en `.github/workflows/pages.yml`) cada vez que haces un commit en `main`.

- **Visitantes:** solo ven el contenido del portafolio (semanas, informes, PPT, labs, sílabo). No hay ningún botón de administración.
- **Creador:** entra a `https://TU-SITIO/#creador` para abrir el panel interno. Los cambios que hagas ahí se guardan solo en tu navegador; para publicarlos usa "Exportar index.html" y sube ese archivo a GitHub.

## Cómo actualizar contenido

1. Entra a tu repositorio en GitHub.
2. Navega a `src/main/resources/static/archivos/semana-XX/`.
3. **Add file → Upload files**, sube el archivo y pulsa **Commit changes**.
4. En ~1 minuto el sitio se actualiza solo.

## (Opcional) Ejecutar en tu PC con Java

```bash
mvn spring-boot:run
```
Luego abre `http://localhost:8080`.
