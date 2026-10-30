# Manual de TM2

**Versión descrita:** 26.10.2-beta.5  
**Fecha:** 30 de octubre de 2026  
**Tipo de documento:** manual integrado en la pestaña **Ayuda** de TM2 (con capturas de pantalla) y disponible como PDF en `MANUAL-TM2.pdf`.

Este manual explica cómo funciona TM2 tal como está hoy: la ventana principal, las
pantallas de salida, la página de la reunión, las cámaras, la captura de ventanas,
el cronómetro con su monitor del orador y los ajustes que más se usan en el Salón
del Reino.

---

## 1. Qué es TM2

TM2 es una aplicación de escritorio para Windows que ayuda a presentar la reunión:

- Descarga y organiza los archivos multimedia de la reunión (videos, imágenes,
  canciones, PDF) para la fecha y el idioma de la congregación.
- Los muestra en una o dos pantallas externas (proyector o monitor).
- Muestra el texto del año cuando no hay nada proyectado.
- Permite usar una cámara en vivo, con encuadre, escenas y captura de imagen.
- Puede mostrar la ventana de otra aplicación o una pantalla completa a la
  audiencia.
- Incluye cronómetro de la reunión, monitor para el orador y control remoto por
  red local para una tableta.
- Se integra con OBS Studio, Zoom, música de fondo, grabación y atajos.

Todo se controla desde la **ventana principal**. Lo que ve la audiencia se muestra
en las **pantallas de salida**.

---

## 2. Instalación y datos

TM2 se entrega de dos formas:

| Formato    | Archivo                           | Cómo se usa                                                               |
| ---------- | --------------------------------- | ------------------------------------------------------------------------- |
| Portable   | `TM2-26.10.2-beta.5-portable.exe` | Se ejecuta directamente, sin instalar. Ideal para probar o llevar en USB. |
| Instalador | `TM2-26.10.2-beta.5-x64.exe`      | Se instala en el equipo y crea accesos directos.                          |

### Dónde se guardan los datos

**Versión portable:** junto al `.exe` se crean estas carpetas:

- `TM2 - User Data` → perfiles, ajustes, caché de multimedia y datos de la
  congregación.
- `TM2 - Temporary Files` → archivos temporales.

**Versión instalada:** los datos están en `%APPDATA%\TM2`.

> Para hacer una copia de seguridad de la versión portable, copia la carpeta
> `TM2 - User Data`. No hace falta copiar el `.exe`.

### Cosas importantes al abrir TM2

- **Solo puede haber una instancia abierta.** Si se abre TM2 dos veces, la segunda
  se cierra sola. Cierra la que esté abierta antes de abrir otra.
- La versión **portable no se actualiza sola**. Para actualizar, descarga la nueva
  versión y usa la misma carpeta de datos.
- La versión **instalada** sí puede buscar actualizaciones desde Ajustes.
- Si Windows pregunta por permisos de cámara, micrófono o firewall, acepta para
  que TM2 pueda usar las funciones correspondientes.

---

## 3. La ventana principal

Arriba está la cabecera de TM2:

- **Logo TM2:** abre el cuadro «Acerca de».
- **Perfil de la congregación:** muestra el nombre del perfil activo. Al pulsarlo
  se cambia de perfil, se crea uno nuevo o se exportan los ajustes de un perfil.
- **Pantalla de salida:** indica la pantalla externa que se está usando y permite
  elegirla o identificarla.
- **Pestañas:** Reunión · Cámaras · Sitio web · Ajustes.
  - En **modo solo cámaras** se ocultan Reunión y Sitio web; solo quedan Cámaras y
    Ajustes, y se muestra una etiqueta «Solo cámaras».

Debajo de la cabecera, cuando corresponde, aparece un botón de aviso si algo
necesita atención (por ejemplo, si la reproducción de multimedia está desactivada).

Debajo de las pestañas, dentro de la cabecera, está la **isla de acciones**, con
accesos rápidos:

- **Descargas:** progreso y estado de las descargas.
- **Música:** música de fondo antes y después de la reunión.
- **Subtítulos:** control de subtítulos durante la reproducción.
- **OBS Studio:** conexión y escenas.
- **Grabación:** iniciar y detener la grabación de la reunión.
- **Cronómetro:** abre el panel del cronómetro y sus controles.
- **Pantalla:** abre el panel de pantallas de salida, asignación de pantallas y
  prueba de salida.
- **Escenas de cámara:** acceso rápido a las escenas guardadas.
- **Zoom:** administrador de reuniones de Zoom (si está configurado).

> La isla de acciones solo se muestra si está activada la presentación de
> multimedia o el botón de música.

---

## 4. Pantallas de salida

TM2 usa una **pantalla multimedia principal** y, si hay una segunda pantalla
externa conectada, una **segunda salida**.

- **Multimedia y texto del año** se muestran en la pantalla multimedia y se
  reflejan también en la segunda salida.
- **La cámara** se muestra únicamente en la pantalla de cámara elegida.
- El **monitor del orador** (cronómetro y avisos) se muestra en la pantalla del
  monitor del orador.

La pantalla que se usa se elige en la cabecera → **Pantalla de salida**. Las
funciones de cada pantalla se asignan en el panel de presentación (isla de
acciones → botón de pantalla), en **Asignación de pantallas**:

- **Pantalla multimedia** → texto del año y archivos multimedia.
- **Pantalla de la cámara** → cámara en vivo.
- **Pantalla del monitor del orador** → cronómetro, avisos y hora.

Esas asignaciones se mantienen fijas.

### Elegir y probar una pantalla

1. Conecta el proyector o monitor y espera a que Windows lo reconozca.
2. Abre **Pantalla de salida**.
3. Elige la pantalla para la salida multimedia.
4. Usa **Identificar pantalla** para ver un número grande en cada pantalla y saber
   cuál es cuál.
5. En **Cámaras**, usa **Probar salida** para reproducir un clip corto y confirmar
   que la pantalla está bien conectada. **Detener prueba** lo corta.

La ventana de salida puede estar en **pantalla completa** o **en ventana**, según
lo elijas en el panel de pantalla.

---

## 5. La página Reunión

Es la página principal para preparar y presentar la reunión.

### Elegir la fecha

En el calendario lateral se elige el día. TM2 muestra las secciones de esa reunión
(partes de entre semana y de fin de semana) con sus archivos.

### Descargar los archivos

Al abrir una fecha, TM2 descarga automáticamente el multimedia que falte. El estado
se ve en la isla de acciones → **Descargas**.

- Si falta un archivo, el propio elemento ofrece volver a descargarlo o localizarlo.
- Si no hay conexión, TM2 lo avisa y mantiene lo que ya estaba descargado.

### Añadir archivos propios

Con **Añadir archivos multimedia** (en la cabecera de la página Reunión) puedes
agregar:

- De JW.org: canción, video, publicación, Biblia de estudio, Biblia.
- Del equipo: archivos de la carpeta de medios públicos (PT), videos remotos,
  archivos sueltos.
- También puedes **arrastrar archivos** desde el Explorador de Windows a la lista.
- Si hay una **carpeta vigilada** configurada, lo que se copie allí se importa
  automáticamente en el día correspondiente.

### Reproducir

Cada elemento tiene un botón de reproducción cuando el archivo está disponible.
Al reproducirlo, se envía a la pantalla multimedia y a la segunda salida.

- Para reproducir **toda una sección** o varios elementos, selecciónalos y usa las
  acciones de selección.
- **Detener** corta la reproducción y devuelve la pantalla al texto del año o al
  contenido de fondo.
- No se puede cambiar de página ni de perfil mientras hay multimedia reproduciéndose.
  Detén primero la reproducción.

### Opciones de cada elemento

En el menú de opciones (tres puntos) de cada archivo puedes:

- Moverlo arriba o abajo y restablecer el orden.
- Ocultarlo de la lista o de la selección.
- Cambiar su etiqueta o nombre.
- Repetirlo continuamente o dejar de repetirlo.
- Ajustar la velocidad de reproducción.
- Elegir solo un clip del archivo.
- Reproducir un video con audio alternativo (video silenciado + audio de otro
  archivo).
- Eliminar el archivo o localizarlo si se ha movido.
- Restablecer zoom y duración de imágenes.

### Texto del año y fondo

Cuando no hay multimedia reproduciéndose, la salida muestra el **texto del año**.
En Ajustes se puede previsualizar el texto del año del año siguiente y restaurar el
actual. El fondo personalizado, si está configurado, se muestra en la misma capa.

---

## 6. Cámaras y pantallas

Abre la pestaña **Cámaras**. Esta página se llama **Cámaras y pantallas** y tiene
tres bloques: control de la cámara, captura de ventanas y escenas.

### Control de la cámara

1. Pulsa **Detectar cámaras** la primera vez para conceder acceso.
2. Elige la cámara en la lista.
3. Verás la **vista previa de la cámara** en la ventana principal.
4. Elige la **disposición de la cámara**:
   - **Pantalla completa** → solo cámara. El texto del año no se ve mientras la
     cámara ocupa toda la pantalla.
   - **Cámara pequeña sobre el texto** → la cámara se superpone al texto del año.
   - **Mitad cámara, mitad texto** → cámara y texto comparten la pantalla.
5. Ajusta el **zoom** con el control y **arrastra la vista previa** para encuadrar.
   **Restablecer encuadre** vuelve al encuadre original.
6. Elige la **pantalla de la cámara** (solo las pantallas externas aparecen aquí;
   la ventana principal no se puede usar como salida).
7. Pulsa **Mostrar cámara en pantalla**. La cámara se envía a la pantalla elegida
   y la vista previa local se pausa.
8. **Detener cámara** la quita de la pantalla.

Cuando termina un archivo multimedia proyectado, la cámara vuelve automáticamente
a la pantalla de cámara si estaba activa.

**Guardar captura** guarda una imagen PNG de la vista previa actual de la cámara.

### Escenas de cámara

Una escena guarda la cámara, la disposición, el zoom y el encuadre:

1. Elige cámara, disposición y encuadre.
2. Escribe un **nombre de la escena**.
3. Pulsa **Guardar escena**.
4. Para activarla, pulsa el botón de reproducción de la escena.
5. Con los botones de la escena puedes **actualizarla** con la configuración actual
   o **eliminarla**.

Las escenas también están disponibles en la isla de acciones → **Escenas de cámara**.
Si la cámara de una escena no está conectada, TM2 lo avisa.

### Captura de ventanas y pantallas

Sirve para mostrar a la audiencia otra aplicación (por ejemplo, una presentación o
una videollamada):

1. Abre la aplicación que quieres compartir.
2. En **Captura de ventanas**, pulsa **Actualizar lista**.
3. Elige la **ventana o pantalla** y la **pantalla de captura** (dónde se verá).
4. Pulsa **Mostrar captura en pantalla**.
5. **Detener captura** la corta.

Mientras la captura está activa, la cámara y la pantalla de multimedia se pausan.
Si la ventana compartida se cierra o se desconecta su pantalla, la captura se
detiene y TM2 lo avisa.

> No elijas como origen la propia salida de TM2 ni su segunda salida: la imagen se
> reflejaría en bucle. TM2 muestra un aviso si lo intentas.

### Modo solo cámaras

En Ajustes → General puedes activar **Modo solo cámaras (sin multimedia de reunión)**.
Al hacerlo:

- TM2 abre directamente la página Cámaras.
- Se ocultan Reunión, las descargas y Sitio web.
- Cámaras, pantallas de salida y Ajustes siguen disponibles.

Es útil para equipos dedicados solo a cámara o transmisión.

### Permisos de cámara en Windows

Si la cámara no aparece o no se abre:

1. Comprueba que otra aplicación no la esté usando (Zoom, Teams, OBS…).
2. En Windows, revisa **Configuración → Privacidad → Cámara** y permite el acceso
   a las aplicaciones de escritorio.
3. Vuelve a TM2 y pulsa **Detectar cámaras**.
4. Si sigue sin funcionar, reinicia TM2.

---

## 7. Cronómetro y monitor del orador

El cronómetro sirve para medir las partes de la reunión y avisar al presidente.

### Abrir el cronómetro

Pulsa **Cronómetro** en la isla de acciones. Se abre el panel con:

- Tipo de ventana: **Pantalla completa** o **En ventana**.
- Pantalla donde se muestra el cronómetro.
- Número de partes de las secciones (por ejemplo, AYFM y LAC).
- Hora de fin personalizada para CBS y WT.
- Partes personalizadas (nombre y duración).
- **Controles del cronómetro**: iniciar, pausar, avanzar de parte, reiniciar.
- **Aviso de mano levantada**.
- **Exportar informe PDF** de los tiempos de la reunión.
- **Restablecer todos los tiempos**.

### Monitor del orador

En el mismo panel, la sección **Monitor del orador** permite:

- Escribir un **texto del aviso** y pulsar **Mostrar aviso**. El aviso aparece en
  la pantalla del cronómetro. **Quitar aviso** lo borra.
- Activar **Mostrar la hora en una esquina**.

Asigna la pantalla del monitor del orador en el panel de presentación (isla de
acciones → Pantalla) → **Asignación de pantallas → Pantalla del monitor del
orador**.

### Control remoto por red local

Para que el orador vea el cronómetro en una tableta o teléfono:

1. En Ajustes → **Cronómetro de la reunión**, activa **Control remoto del
   cronómetro**. Puedes cambiar el puerto (por defecto `8787`).
2. Conecta la computadora y la tableta a la **misma red**.
3. Abre el panel del cronómetro: verás una o varias direcciones web.
4. Copia una dirección y ábrela en el navegador de la tableta.
5. La tableta muestra la misma pantalla del cronómetro, con el aviso y el reloj.

Si el control remoto no arranca, comprueba el puerto (puede estar ocupado por otro
programa) y permite TM2 en el firewall de Windows.

---

## 8. Presentar un sitio web

La pestaña **Sitio web** abre una ventana aparte con una página de JW.org para la
audiencia.

- Puedes acercar y alejar, retroceder, avanzar y actualizar.
- **Empezar duplicación** refleja la navegación en la salida.
- **Detener duplicación** la corta.

Es útil para mostrar artículos o videos del sitio sin salir de TM2.

---

## 9. Ajustes que conviene conocer

Los ajustes se agrupan en:

- **General** → idioma de la aplicación, formato de fecha, modo oscuro, modo solo
  cámaras, inicio automático.
- **Reuniones de congregación** → nombre, idioma, días y horas de reunión, programa.
- **Archivos multimedia y reproducción** → **Activar reproducción de archivos
  multimedia**, calidad de descarga, carpetas, vista previa.
- **Cronómetro de la reunión** → modo, colores, cuenta atrás, control remoto,
  pantalla del monitor.
- **Integraciones** → OBS Studio, Zoom, grabación, música, atajos.
- **Interfaz y atajos** → atajos de teclado globales y de la interfaz.
- **Avanzado** → actualizaciones, aceleración por hardware, caché, diagnóstico.

### El ajuste más importante: activar la reproducción

**Ajustes → Archivos multimedia y reproducción → Activar reproducción de archivos
multimedia.**

Si este ajuste está desactivado:

- No aparecen los botones de reproducción en la lista de archivos.
- La página Reunión muestra un aviso amarillo con un botón **Ir a Ajustes**.
- La isla de acciones puede no mostrarse si tampoco está activada la música.

Actívalo para presentar imágenes y videos en la pantalla de salida. En la mayoría
de los Salones del Reino debe estar activado.

### Perfiles

Cada perfil guarda su propia congregación, idioma, horario, carpetas y ajustes.

- Pulsa el nombre del perfil en la cabecera para cambiar, crear o exportar un perfil.
- No se puede cambiar de perfil mientras se reproduce multimedia.
- La **Configuración inicial** (asistente) guía la creación de un perfil: nombre,
  idioma, días y horas de reunión, carpetas y, si se quiere, integraciones.

---

## 10. Flujo recomendado para una reunión

Antes de la reunión:

1. Abre TM2 y comprueba que el perfil correcto está activo.
2. Conecta el proyector y la segunda pantalla, si se usa.
3. Abre **Pantalla de salida**, asigna las pantallas y pulsa **Identificar pantalla**.
4. En **Cámaras**, elige la cámara, la disposición y el encuadre; guarda o activa la
   escena.
5. En **Reunión**, elige la fecha y espera a que terminen las descargas.
6. Reproduce un archivo de prueba y comprueba la salida. **Detener**.
7. Comprueba que el **texto del año** se ve en la salida.
8. Si se usa cronómetro, abre el panel, elige la pantalla del monitor del orador y
   activa el control remoto para la tableta.
9. Si se usa Zoom u OBS, comprueba la conexión en la isla de acciones.

Durante la reunión:

1. Reproduce cada archivo cuando corresponda.
2. Para la cámara, pulsa **Mostrar cámara en pantalla**; para volver al texto,
   **Detener cámara**.
3. Para mostrar otra aplicación, usa **Captura de ventanas** y **Detener captura**
   al terminar.
4. Usa el cronómetro por partes y envía avisos al monitor del orador si hace falta.
5. Detén la reproducción antes de cambiar de página o de perfil.

Después de la reunión:

1. Detén la reproducción y la cámara.
2. Detén la grabación si estaba activa.
3. Exporta el informe del cronómetro si se necesita.
4. Cierra TM2 con el botón de cerrar de la ventana.

---

## 11. Solución de problemas

### No aparecen los botones de reproducir

La reproducción de multimedia está desactivada. Activa **Archivos multimedia y
reproducción → Activar reproducción de archivos multimedia**. El aviso amarillo de
la página Reunión lleva directamente a ese ajuste.

### El texto del año no se ve en la salida

- Comprueba que la pantalla de salida está conectada y asignada.
- Si la cámara está en **Pantalla completa**, el texto del año se oculta a propósito.
  Cambia a **Cámara pequeña sobre el texto** o **Mitad cámara, mitad texto**, o
  detén la cámara.
- Si la salida está en blanco, abre **Pantalla de salida** y vuelve a elegir la
  pantalla. Usa **Probar salida** para confirmar.

### La cámara no se abre

- Puede estar en uso por otra aplicación. Ciérrala o elige otra cámara.
- Revisa los permisos de cámara de Windows.
- Pulsa **Detectar cámaras** y, si hace falta, reinicia TM2.

### La captura se detuvo

La ventana compartida se cerró o se desconectó su pantalla. Actualiza la lista,
elige otra ventana o pantalla y vuelve a iniciar la captura.

### La imagen se repite en bucle al capturar

Estás capturando la propia salida de TM2 o su segunda salida. Elige otra ventana u
otra pantalla.

### No se detecta la segunda pantalla

- Comprueba la conexión del monitor o proyector.
- En Windows, usa **Extender** (no **Duplicar**) para tener dos pantallas.
- Abre **Pantalla de salida** para refrescar la lista.

### El control remoto del cronómetro no conecta

- La computadora y la tableta deben estar en la misma red.
- Comprueba el puerto en Ajustes; si está ocupado, elige otro.
- Permite TM2 en el firewall de Windows.
- Usa la dirección que muestra el panel del cronómetro, no una inventada.

### No puedo cambiar de página ni de perfil

Hay multimedia reproduciéndose. Pulsa **Detener** primero.

### Un archivo multimedia falta

En el propio elemento, usa **Localizar archivo multimedia** para volver a vincularlo,
o elimínalo y vuelve a añadirlo. Si es multimedia de JW.org, TM2 intentará
descargarlo de nuevo.

### La ventana de multimedia se cerró o se reinició

TM2 intenta recuperarla automáticamente. Si se repite, reinicia TM2. Como último
recurso, en Ajustes → Avanzado puedes probar a desactivar la aceleración por
hardware.

### La versión portable no se actualiza

Es normal: la versión portable no usa el actualizador. Descarga la nueva versión y
conserva la carpeta `TM2 - User Data`.

### Windows o el antivirus bloquean funciones

Puede ocurrir con el asistente de Zoom o con la captura de pantalla. Permite TM2 en
el antivirus y vuelve a intentarlo. Si faltan archivos del asistente de Zoom,
reinstalar TM2 debería restaurarlos.

---

## 12. Resumen de rutas y nombres

- Carpeta de datos portable: `TM2 - User Data`, junto al ejecutable.
- Carpeta temporal portable: `TM2 - Temporary Files`, junto al ejecutable.
- Carpeta de datos instalada: `%APPDATA%\TM2`.
- Ajuste de reproducción: **Archivos multimedia y reproducción → Activar
  reproducción de archivos multimedia**.
- Pantallas: cabecera → **Pantalla de salida**.
- Cámara y captura: pestaña **Cámaras**.
- Cronómetro y monitor del orador: isla de acciones → **Cronómetro**.
- Página de reunión: pestaña **Reunión**.
- Sitio web: pestaña **Sitio web**.

---

_Este manual describe la versión 26.10.2-beta.5. La aplicación sigue cambiando; si
algo no coincide con lo que ves en pantalla, revisa la versión instalada en
«Acerca de»._
