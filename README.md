# A la mesa · Marcador de juegos

Calculadora en español para llevar los puntos de tus juegos desde el celular. Incluye Catán, 7 Wonders, UNO, Carioca, dominó, puntos con meta, puntuación libre y juegos personalizados.

**Esta carpeta está lista para subir a GitHub. No necesitas instalar paquetes ni ejecutar una construcción para publicarla.**

## Subir a GitHub y activar la calculadora

1. Crea un repositorio en GitHub. Para utilizar GitHub Pages con el plan gratuito, elige un repositorio público.
2. Abre el repositorio y elige **Add file → Upload files**. Si está vacío, utiliza el enlace para subir archivos existentes.
3. Sube **todo el contenido de esta carpeta**, conservando `docs/` y `tests/`. `index.html` debe quedar directamente en la raíz del repositorio, no dentro de `para-github/`. Si descargaste el ZIP, descomprímelo primero: subir el ZIP solo no publica la calculadora.
4. Guarda la subida con **Commit changes** en la rama `main`.
5. Entra en **Settings → Pages**.
6. En **Build and deployment → Source**, elige **Deploy from a branch**.
7. Selecciona la rama **main**, la carpeta **/(root)** y pulsa **Save**.
8. Cuando termine la publicación, GitHub mostrará el enlace de tu calculadora en esa misma pantalla.

Incluye el archivo `.nojekyll`, aunque tu explorador lo muestre como oculto. Si no aparece al subir, puedes crearlo desde **Add file → Create new file** con ese nombre exacto. Puede estar vacío o contener una línea de texto.

La dirección suele tener la forma `https://TU-USUARIO.github.io/TU-REPOSITORIO/`. Los recursos utilizan rutas relativas, por lo que funcionan dentro de la carpeta del repositorio.

[Instrucciones oficiales de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Archivos organizados

```text
.
├── index.html             Página principal
├── styles.css             Diseño adaptable y temas claro/oscuro
├── app.js                 Interfaz, partidas y navegación
├── score-engine.js        Cálculos y validaciones
├── icon.svg               Icono de la aplicación
├── manifest.webmanifest   Configuración para pantalla de inicio
├── sw.js                  Caché para uso sin conexión
├── .nojekyll              Publicación estática en GitHub Pages
├── .gitignore             Exclusiones para desarrollo
├── README.md              Esta guía
├── package.json           Comandos de desarrollo opcionales
├── server.cjs             Servidor local opcional
├── build.cjs              Generación opcional de archivos estáticos
├── docs/
│   └── AUDITORIA.md        Hallazgos, mejoras y fuentes de reglas
└── tests/
    └── scoring.test.cjs   Pruebas de cálculo
```

Los archivos de la aplicación permanecen juntos para facilitar las subidas manuales. La documentación y las pruebas están en sus propias carpetas. No se incluyen configuraciones de Sites, credenciales, copias antiguas ni archivos temporales.

## Usar la calculadora

1. Elige un juego, escribe los nombres y revisa las reglas de la partida.
2. Anota los puntos por ronda o toca un jugador para abrir su ficha.
3. Guarda la ronda o los puntos de la ficha.
4. Finaliza la partida para conservar su resultado; puedes corregirlo o jugar una revancha.

En «Tu propio juego» puedes elegir rondas o categorías con multiplicadores positivos o negativos y guardar las reglas para reutilizarlas. Carioca y dominó son marcadores configurables: la mesa acuerda el valor de cartas, fichas y cierres según su variante.

Catán admite 3–6 participantes (5–6 con ampliación), 7 Wonders 3–7, UNO 2–10 y los marcadores genéricos 2–12. El modo 7 Wonders corresponde al juego clásico; no incluye Duel ni Architects. Los efectos especiales de expansiones no interpretados se anotan como ajustes.

## Partidas y copias

- Las partidas y borradores se guardan en el navegador de cada dispositivo. No hay sincronización automática.
- En «Mis partidas» puedes descargar una copia JSON e importarla en otro dispositivo.
- En las opciones de partida puedes exportar los resultados a CSV.
- Deshacer y rehacer conserva hasta 40 cambios durante la sesión. Después de recargar, las rondas anteriores siguen siendo editables desde su historial.
- Si borras los datos del navegador, se eliminan sus partidas locales.
- Al pasar desde la versión privada o local a GitHub Pages, exporta e importa las partidas que quieras trasladar: cada dirección tiene su propio guardado.
- El uso sin conexión requiere una primera carga completa y un navegador compatible. Puedes añadir la aplicación a la pantalla de inicio desde el menú del navegador.

## Desarrollo opcional

La calculadora funciona sin dependencias externas. Con Node instalado:

```text
node server.cjs
```

Abre `http://127.0.0.1:4173` para usarla localmente.

```text
node --test tests/scoring.test.cjs
node build.cjs
```

La primera orden ejecuta las pruebas. La segunda comprueba sintaxis y crea una copia estática en `out/`; no es necesaria para la publicación desde `main` y `/(root)` descrita arriba.

Si modificas los archivos de la aplicación, cambia también el identificador `CACHE` de `sw.js` para que la siguiente carga pueda actualizar los archivos guardados sin conexión. Después de publicar, cierra las pestañas abiertas de la calculadora y vuelve a abrirla.

## Auditoría

Consulta [la auditoría](docs/AUDITORIA.md) para ver las correcciones, las pruebas realizadas, las fuentes oficiales y los límites de validación. El marcador es independiente y no está afiliado a los editores de los juegos.
