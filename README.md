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
- seleccionar un modo específico para Catán: Ciudades y Caballeros;
- controlar puntos de victoria, ciudades, metrópolis y caballeros activos;
- comparar automáticamente la fuerza bárbara con la defensa de la isla.

## Modos de juego

- **Puntos con tope:** suma o descuenta puntajes por ronda y finaliza al alcanzar el límite configurado.
- **Acumulativo / Carioca:** acumula puntajes por ronda y ordena la clasificación de menor a mayor.
- **Catán: Ciudades y Caballeros:** comienza con 3 puntos y 1 ciudad por jugador, usa una meta de 13 puntos y calcula automáticamente fuerza bárbara y defensa.

## Publicar gratis con GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube `index.html` y `.nojekyll` a la raíz del repositorio.
3. En el repositorio, entra a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Elige la rama **main**, la carpeta **/(root)** y presiona **Save**.

GitHub mostrará la dirección pública cuando la página quede publicada.

No requiere instalación, paquetes, base de datos ni servidor. Toda la aplicación está dentro de `index.html`.
