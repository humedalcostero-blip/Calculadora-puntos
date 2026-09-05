# Auditoría y mejoras · A la mesa

Fecha: 5 de septiembre de 2026. Se revisó la calculadora original y se implementó una nueva versión. La copia original se conserva en el espacio de trabajo de origen, fuera de este paquete para GitHub.

## Hallazgos y correcciones

| Prioridad | Hallazgo en la versión original | Solución aplicada |
| --- | --- | --- |
| Alta | En Catán, «Ciudades» ya incluía las metrópolis, pero la fuerza bárbara sumaba ciudades + metrópolis. | Cada ciudad cuenta una sola vez. Una metrópolis conserva sus 2 puntos adicionales sin añadir otra unidad de ataque. |
| Alta | El estado solo vivía en memoria: recargar perdía toda la partida. | Guardado automático de partidas y borradores, recuperación al abrir y copias JSON exportables. Los errores de almacenamiento se muestran y no se presentan como éxito. |
| Alta | Se podían guardar rondas completamente vacías; los participantes sin anotación se convertían silenciosamente en cero. | Se requiere una anotación por participante; el cero debe ser explícito. En UNO, los participantes distintos del ganador sí reciben cero según la modalidad elegida. |
| Media | La validación admitía decimales en objetivos y carecía de límites superiores consistentes. | Enteros y límites explícitos, comprobación de copias importadas, normalización numérica y límites para evitar cálculos científicos desproporcionados. |
| Media | El orden de ingreso desempataba visualmente, otorgando puestos distintos a puntajes idénticos. | Puestos compartidos; en 7 Wonders, primero se compara el puntaje y luego las monedas. Si ambos empatan, se comparte victoria. |
| Media | Se mostraban juntos quienes cruzaban el tope, sin distinguir al primero de la clasificación. | Alcanzar la meta y ganar se tratan por separado. La clasificación decide el resultado de rondas; en Catán se confirma al ganador en su turno. |
| Media | Capitán del Puerto aparecía disponible fuera de su escenario. | Se activa expresamente en la configuración. |
| Media | Sin límite global de tres metrópolis ni límites de piezas y caballeros. | Validación por jugador y partida, protección de logros exclusivos y máximos de componentes. Los poblados efectivos pueden incluir ciudades degradadas por ataques cuando no quedan piezas de poblado; se respeta el máximo combinado de nueve construcciones. |
| Media | Solo se podía deshacer la última ronda; no editar rondas anteriores ni corregir fichas con deshacer. | Edición y eliminación de cualquier ronda; 40 cambios de deshacer/rehacer durante la sesión. |
| Media | Controles y textos pequeños, cabecera de gran tamaño y muchos pasos para puntuar una ronda en celular. | Interfaz adaptable desde 320 px, anotación directa de la mesa, acción principal persistente, ventanas inferiores, etiquetas y controles táctiles. |
| Media | Ventanas personalizadas sin gestión completa del foco. | Diálogos nativos, cierre con Escape, foco de retorno y controles etiquetados. |
| Baja | Un único HTML de aproximadamente 84 KB mezclaba estilos, estado, cálculos y eventos, sin pruebas. | Motor de puntuación independiente, interfaz separada y suite de regresión sin dependencias de producción. |
| Baja | Instrucciones de publicación mencionaban `.nojekyll`, pero el archivo era `nojekyll.txt`. | Se incluye `.nojekyll` real y una salida estática preparada para publicar. |

El cálculo de ciencia de la versión original ya buscaba todas las asignaciones de comodines. Se conservó este enfoque correcto y se añadieron pruebas y límites. Mayor Ejército ya estaba excluido del total de Ciudades y Caballeros: se preservó ese comportamiento, no se atribuye como un error corregido.

## Funciones incluidas

- Ocho modos: puntos con meta, Carioca, puntuación libre, Catán, 7 Wonders, UNO, dominó y juego personalizado.
- Mayor o menor puntaje, meta y número de rondas donde corresponde.
- Juegos personalizados por rondas o hasta 16 categorías, con multiplicadores positivos o negativos y hasta 12 configuraciones reutilizables.
- Catán con Navegantes, Ciudades y Caballeros, Capitán del Puerto y escenarios; defensa ponderada, resolución de ataques, pérdida de ciudades, puntos de Defensor y transferencia de logros.
- 7 Wonders con tesorería, conflictos, ciencia optimizada, puntos de cartas y ajustes para expansiones.
- Ayudante de UNO que suma números, acciones y comodines clásicos y asigna el total al ganador de la mano.
- Hasta 30 partidas locales, edición de nombres, revancha, historial, copias JSON y resultados CSV compatibles con hojas de cálculo.
- Protección de archivos importados, nombres escapados al generar HTML y protección de celdas CSV frente a fórmulas inyectadas.
- Detección de cambios desde otra pestaña: no se sobrescribe silenciosamente una versión distinta.
- Modo claro y oscuro; aplicación estática sin fuentes externas, rastreadores ni dependencias de producción.
- Manifiesto y caché para uso sin conexión tras la primera carga completa en un servidor compatible.

## Validación realizada

Se ejecutaron correctamente 23 pruebas de regresión con el ejecutor de Node. Cubren cálculos base y expansiones de Catán, el ejemplo de ataque de las reglas oficiales, igualdad de fuerzas, defensa con empates, ciencia, monedas, conflictos, clasificación, rondas negativas, metas, categorías, UNO, validación y copias. Una de ellas compara 625 combinaciones científicas con una enumeración recursiva independiente.

Se realizaron también comprobaciones de flujos con un DOM simulado: inicio de los ocho modos, anotación, edición de rondas, deshacer/rehacer, fichas de Catán y 7 Wonders, categorías multiplicadas, validación de puntos faltantes, guardado de borradores, nombres con HTML y navegación. Se comprobaron identificadores únicos y correspondencia de etiquetas con controles.

Se verificó la sintaxis de los archivos y la generación de la versión estática. El servidor local respondió HTTP 200. Estas comprobaciones no sustituyen una inspección visual ni una prueba en un teléfono físico; no se ejecutaron pruebas visuales en navegador, lector de pantalla o instalación real en iOS/Android. Tampoco se verificó la persistencia de caché sin conexión en un dispositivo real.

## Alcance de las reglas

La aplicación lleva la puntuación a partir de lo que se ingresa. No reconoce cartas ni reconstruye el tablero. Los puntos de cartas y condiciones de rutas/logros deben comprobarse en la mesa. Carioca y dominó son marcadores configurables para distintas variantes; no interpretan automáticamente sus cartas, cierres o fichas.

7 Wonders corresponde al juego clásico de 3–7 participantes, no a Duel o Architects. Los efectos especiales de expansiones que alteran reglas de ciencia o puntuación se anotan como ajustes ya calculados. No se anuncia soporte automático integral de todas las expansiones.

Las partidas se guardan por navegador y dirección del sitio; no se sincronizan entre personas ni dispositivos. Las copias JSON permiten moverlas. Deshacer/rehacer se conserva durante la sesión, no tras recargar; las rondas anteriores continúan siendo editables. El modo sin conexión requiere primera carga completa y soporte de service workers; una página privada puede requerir iniciar sesión de nuevo al volver a conectarse.

## Fuentes de reglas

- [CATAN: Cities & Knights, reglas oficiales, pp. 11–12](https://www.catan.com/sites/default/files/2021-06/catan_c_k_2020_rule_book_200708.pdf): fuerza bárbara, caballeros, pérdida de ciudades, Defensor, Mercader y victoria en el turno.
- [7 Wonders, reglamento oficial en español, p. 8](https://cdn.svc.asmodee.net/production-rprod/storage/downloads/games/7wonders/es/sev-sp02-rules-1598889214fO8Tb.pdf): tesorería, conflictos, ciencia y desempates.
- [Mattel: UNO Deluxe, puntuación clásica y variante alternativa](https://service.mattel.com/instruction_sheets/M2062-0920.pdf): cartas numéricas, acciones de 20 puntos, comodines de 50 y meta de 500.
