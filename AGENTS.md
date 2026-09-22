# Instrucciones del portafolio

## Publicación de cambios

- Todo cambio solicitado para este portafolio debe quedar listo para publicar: ejecutar `npm run build`, `npm run test:e2e` y `git diff --check` antes de entregarlo.
- Cuando el usuario autorice la publicación, incluir el cambio en un commit enfocado, ejecutar `git push origin main` y verificar que GitHub Pages termine correctamente y que la versión pública refleje el cambio antes de pedir que se refresque Chrome.
- No incluir artefactos generados o temporales en los commits, incluidos `.playwright-cli/`, `dist/` y `test-results/`.
- La autorización de publicación es necesaria para cada cambio o conjunto de cambios; una instrucción local no puede sustituir esa confirmación explícita.
