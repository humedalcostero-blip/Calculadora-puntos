# Contador de Puntos por Rondas

Aplicación web autónoma para:

- agregar de 2 a 12 participantes;
- elegir entre una partida con puntaje tope o una partida acumulativa;
- ingresar puntos positivos, negativos o cero en cada ronda;
- elegir por participante si los puntos de la ronda se suman o se descuentan;
- ver clasificación, avance e historial;
- deshacer la última ronda;
- recibir un aviso cuando alguien alcanza o supera el tope;
- jugar sin límite automático y ver quién tiene el menor puntaje acumulado;
- usar una calculadora especializada de Catán con meta de victoria configurable;
- calcular automáticamente los puntos de cada jugador a partir de poblados, ciudades, cartas o fichas de victoria y bonificaciones;
- activar módulos para Navegantes, Ciudades y Caballeros y otros escenarios o expansiones;
- controlar metrópolis, Defensor de Catán, Mercader, misiones y caballeros activos;
- comparar automáticamente la fuerza bárbara con la defensa de la isla cuando se juega Ciudades y Caballeros;
- revisar una tabla compacta con la clasificación completa en los tres modos y abrir la ficha de cada jugador para actualizarla sin recorrer una página extensa.

## Modos de juego

- **Puntos con tope:** muestra un resumen de todos los jugadores; permite seleccionar uno, sumar o descontar su puntuación y preparar los valores antes de guardar la ronda completa. Finaliza al alcanzar el límite configurado.
- **Acumulativo / Carioca:** utiliza el mismo resumen y ficha individual por jugador, acumula los puntajes por ronda y ordena la clasificación de menor a mayor.
- **Calculadora de Catán:** permite elegir cualquier meta de victoria. La pantalla principal muestra un resumen ordenado de todos los jugadores; al seleccionar uno, se abre una ficha individual para editar sus datos y regresar al resumen ya actualizado. Catán base incluye poblados (1 PV), ciudades (2 PV), cartas o fichas de victoria, Gran Carretera/Ruta Comercial, Mayor Ejército y Capitán del Puerto (2 PV). Navegantes habilita puntos especiales de escenario; Ciudades y Caballeros agrega metrópolis, Defensor de Catán, Mercader, caballeros activos, fuerza bárbara y defensa de la isla. También incluye un ajuste manual para otras expansiones y reglas especiales.

En Ciudades y Caballeros, el campo **Ciudades** debe incluir las ciudades que tienen metrópolis; el campo **Metrópolis** suma los 2 PV adicionales y la fuerza bárbara extra correspondiente.

## Publicar gratis con GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube `index.html` y `.nojekyll` a la raíz del repositorio.
3. En el repositorio, entra a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Elige la rama **main**, la carpeta **/(root)** y presiona **Save**.

GitHub mostrará la dirección pública cuando la página quede publicada.

No requiere instalación, paquetes, base de datos ni servidor. Toda la aplicación está dentro de `index.html`.
