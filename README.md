# Jose Navas Portfolio

Landing estática bilingüe del portafolio de Jose Navas. La versión española vive en `/` y la inglesa en `/en/`; ambas comparten renderer, estilos e interacciones progresivas.

## Requisitos

- Node.js 24 LTS o posterior.
- npm compatible con el lockfile.

El entorno de implementación usó Node 26.7.0 y npm 12.0.2; el objetivo de CI sigue siendo Node 24 LTS.

## Comandos

```powershell
npm ci
npm test
npm run build
npm run preview -- --base /portfolio-test/
npm run test:e2e
```

El preview queda disponible en `http://127.0.0.1:4173/portfolio-test/` y reproduce el subdirectorio típico de GitHub Pages.

## Estructura

- `src/content/es.json` y `src/content/en.json`: contenido público y metadatos.
- `src/render.mjs`: documento HTML semántico compartido.
- `src/styles.css`: sistema visual y responsive.
- `src/main.js`: conservación de ancla e imagen ampliable.
- `public/`: recursos aprobados para publicación.
- `evidence-map.json`: trazabilidad privada; está excluido de `dist/` y Git. La prueba correspondiente se omite en un checkout público donde el mapa no existe; las demás pruebas siguen siendo reproducibles.
- `tests/`: contrato de contenido y flujos de navegador.
- `dist/`: artefacto generado; no se edita a mano.

## Actualizar contenido

1. Modificar ES y EN en la misma entrega.
2. Mantener idénticos IDs, valores numéricos y estructura de casos.
3. Registrar cada afirmación verificable en `evidence-map.json` con su fuente exacta.
4. Copiar a `public/` solo recursos saneados y autorizados.
5. Ejecutar las tres comprobaciones: test, build y E2E.

## Privacidad y límites

Los PDFs de casos y CV no se publican en esta versión porque los originales contienen dirección residencial, contexto identificable o datos técnicos internos. La interfaz omite descargas ausentes, sin botones rotos. El caso DNS publica únicamente exports revisados; no incluye GUID ni la IP interna detectada en la evidencia original.

No añadir métricas, testimonios, clientes, certificaciones o enlaces sin una fuente registrada. `evidence-map.json`, Markdown de la bóveda, reportes de QA y rutas del equipo nunca deben entrar en `dist/`.

## GitHub Pages

El build es portable en raíz y subdirectorio. El workflow de Pages se añadirá solo después de confirmar con el propietario la cuenta, el repositorio y la rama. No crear repositorio, commit, push o despliegue desde este proyecto sin autorización explícita.
