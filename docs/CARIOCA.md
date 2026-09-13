# Carioca con objetivos por ronda

Actualización del 13 de septiembre de 2026.

## Secuencia inicial de esta mesa

| Ronda | Combinación |
| --- | --- |
| 1 | Dos tríos |
| 2 | Un trío y una escala |
| 3 | Dos escalas |
| 4 | Tres tríos |
| 5 | Dos tríos y una escala |
| 6 | Un trío y dos escalas |
| 7 | Tres escalas |
| 8 | Cuatro tríos |
| 9 | Escala sucia |
| 10 | Escala real |

Esta variante de diez rondas fue solicitada por el usuario. No se presenta como una regla universal de Carioca.

Un trío son tres cartas del mismo valor. Una escala ordinaria son cuatro cartas consecutivas de una misma pinta. La Escala sucia usa una secuencia del as al rey que permite mezclar pintas; la Escala real exige una sola pinta. Todas las descripciones son editables antes de comenzar.

## Preparar una partida

1. Elige Carioca.
2. Selecciona diez rondas, siete rondas o una secuencia personalizada.
3. Abre «Ver y personalizar las rondas» para consultar o editar nombres y descripciones. Las flechas cambian el orden y el botón de eliminar quita una ronda. También puedes agregar objetivos, hasta un máximo de 50.
4. Al cambiar a la opción de siete o diez rondas, se restablece esa secuencia inicial. Elige «Secuencia personalizada» para conservar y adaptar la lista actual.
5. Comienza la partida. Las rondas y sus descripciones quedan guardadas con ella.

La opción corta contiene las primeras siete rondas y termina en Tres escalas. En las partidas guiadas gana siempre el menor puntaje y no hay una meta de puntos que cierre antes de completar los objetivos.

## Anotar y corregir

Sobre los campos de puntaje aparece un encabezado como «Ronda 9 de 10 · Escala sucia» y una explicación. Escribir puntos solo prepara el borrador: el objetivo avanza al pulsar «Guardar ronda».

La lista «Rondas de esta partida» muestra los objetivos guardados, el actual y los pendientes. El historial y la ventana de edición conservan el número, el nombre y la descripción de cada objetivo.

Si eliminas una ronda guardada, ese objetivo vuelve a quedar pendiente. Los objetivos de las otras rondas no se renumeran ni se reasignan. La siguiente anotación completa el primer objetivo pendiente; después continúa por los que falten. Deshacer y rehacer recuperan también el avance y el resultado.

Al guardar el último objetivo aparece automáticamente el resultado. Quienes empatan en el menor puntaje comparten la victoria. Puedes deshacer la última anotación o utilizar «Corregir resultado» para editar el historial.

## Guardado y partidas anteriores

Las copias JSON conservan toda la secuencia, las descripciones y la relación de cada anotación con su objetivo. El CSV incluye número, objetivo y descripción junto a los puntos.

Las partidas antiguas sin objetivos muestran un aviso y mantienen sus reglas, límites y puntuaciones. No se les asigna una secuencia automáticamente. Al jugar una revancha puedes conservar la configuración anterior o elegir una secuencia para la nueva partida.

Los puntos se siguen ingresando manualmente. Esta actualización no asigna valores a cartas ni introduce reglas sobre comodines, bonificaciones o penalizaciones.

## Fuentes y variante elegida

- [PlayCarioca: siete rondas](https://playcarioca.cl/rules).
- [SIP Red de Colegios: nueve rondas](https://adisfrutar.sip.cl/n%C3%BAmeros/5-a-iv-medio).
- La inserción de Escala sucia antes de Escala real y sus definiciones iniciales corresponden a la variante solicitada para esta calculadora.

## Comprobaciones

Se añadieron 11 pruebas de Carioca a las 23 de puntuación existentes. Las 34 pasan. Cubren secuencias, avance, edición, eliminación sin reasignación, cierre, empates, conservación de copias, validación y compatibilidad con partidas anteriores.

También se comprobaron los flujos con un DOM simulado: cambiar variantes, editar descripciones, agregar y reordenar objetivos, anotar, corregir, deshacer y rehacer, cerrar la partida y reutilizar una configuración antigua. Estas comprobaciones no constituyen una prueba visual en un teléfono físico.
