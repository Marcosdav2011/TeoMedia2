<template>
  <q-page class="help-page">
    <section class="help-hero">
      <div class="help-hero__body">
        <p class="help-hero__eyebrow">
          <q-icon name="mmm-guide" size="16px" />
          {{ t('teo-help-eyebrow') }}
        </p>
        <h1>{{ t('teo-help-title') }}</h1>
        <p class="help-hero__subtitle">{{ t('teo-help-subtitle') }}</p>
        <div class="help-hero__chips">
          <span class="help-chip">{{ appVersion }}</span>
          <span class="help-chip">{{
            t('teo-help-updated', { date: updatedLabel })
          }}</span>
          <span v-if="locale !== 'es'" class="help-chip">
            {{ t('teo-help-language-note') }}
          </span>
        </div>
      </div>
      <div class="help-hero__actions">
        <q-btn
          color="primary"
          icon="print"
          :label="t('teo-help-save-pdf')"
          no-caps
          unelevated
          @click="printManual"
        />
        <p class="help-hero__hint">{{ t('teo-help-save-pdf-hint') }}</p>
      </div>
    </section>

    <div class="help-layout">
      <aside class="help-toc">
        <p class="help-toc__title">{{ t('teo-help-toc') }}</p>
        <button
          v-for="(section, index) in toc"
          :key="section.id"
          class="help-toc__item"
          type="button"
          @click="goToSection(section.id)"
        >
          <span class="help-toc__number">{{ index + 1 }}</span>
          <span>{{ section.label }}</span>
        </button>
      </aside>

      <div class="help-content">
        <section id="que-es" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-guide" />
            <h2>1. Qué es TM2</h2>
          </header>
          <p>
            TM2 es una aplicación de escritorio para Windows que ayuda a
            presentar la reunión. Todo se controla desde la
            <strong>ventana principal</strong>; lo que ve la audiencia se
            muestra en las <strong>pantallas de salida</strong>.
          </p>
          <ul class="help-list">
            <li>
              Descarga y organiza los archivos multimedia de la reunión (videos,
              imágenes, canciones y PDF) para la fecha y el idioma de la
              congregación.
            </li>
            <li>
              Los muestra en una o dos pantallas externas (proyector o monitor)
              y mantiene el texto del año cuando no hay nada proyectado.
            </li>
            <li>
              Permite usar una cámara en vivo, con encuadre, escenas y captura
              de imagen.
            </li>
            <li>
              Puede mostrar la ventana de otra aplicación o una pantalla
              completa a la audiencia.
            </li>
            <li>
              Incluye cronómetro de la reunión, monitor para el orador y control
              remoto por red local para una tableta.
            </li>
            <li>
              Se integra con OBS Studio, Zoom, música de fondo, grabación y
              atajos de teclado.
            </li>
          </ul>
        </section>

        <section id="instalacion" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-download" />
            <h2>2. Instalación y datos</h2>
          </header>
          <table class="help-table">
            <thead>
              <tr>
                <th>Formato</th>
                <th>Cómo se usa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Portable</td>
                <td>
                  Se ejecuta directamente, sin instalar. Ideal para probar o
                  llevar en USB.
                </td>
              </tr>
              <tr>
                <td>Instalador</td>
                <td>
                  Se instala en el equipo y crea accesos directos en el menú
                  Inicio y el escritorio.
                </td>
              </tr>
            </tbody>
          </table>
          <h3>Dónde se guardan los datos</h3>
          <ul class="help-list">
            <li>
              <strong>Versión portable:</strong> junto al <code>.exe</code> se
              crean <code>TM2 - User Data</code> (perfiles, ajustes, caché y
              datos de la congregación) y
              <code>TM2 - Temporary Files</code> (archivos temporales).
            </li>
            <li>
              <strong>Versión instalada:</strong> los datos están en
              <code>%APPDATA%\TM2</code>.
            </li>
          </ul>
          <div class="help-note">
            <q-icon name="mmm-info" />
            <p>
              Para hacer una copia de seguridad de la versión portable, copia
              solo la carpeta <code>TM2 - User Data</code>. No hace falta copiar
              el <code>.exe</code>.
            </p>
          </div>
          <h3>Al abrir TM2</h3>
          <ul class="help-list">
            <li>
              <strong>Solo puede haber una instancia abierta.</strong> Si se
              abre TM2 dos veces, la segunda se cierra sola.
            </li>
            <li>
              La versión portable no se actualiza sola: descarga la nueva
              versión y usa la misma carpeta de datos.
            </li>
            <li>
              La versión instalada sí puede buscar actualizaciones desde
              Ajustes.
            </li>
            <li>
              Si Windows pregunta por permisos de cámara, micrófono o firewall,
              acepta para que TM2 pueda usar esas funciones.
            </li>
          </ul>
        </section>

        <section id="ventana" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-window" />
            <h2>3. La ventana principal</h2>
          </header>
          <p>Arriba está la cabecera de TM2:</p>
          <ul class="help-list">
            <li><strong>Logo TM2:</strong> abre el cuadro «Acerca de».</li>
            <li>
              <strong>Perfil de la congregación:</strong> muestra el perfil
              activo. Al pulsarlo se cambia de perfil, se crea uno nuevo o se
              exportan los ajustes.
            </li>
            <li>
              <strong>Pantalla de salida:</strong> indica la pantalla externa
              que se está usando y permite elegirla o identificarla.
            </li>
            <li>
              <strong>Pestañas:</strong> Reunión · Cámaras · Sitio web · Ajustes
              · Ayuda. En <strong>modo solo cámaras</strong> se ocultan Reunión
              y Sitio web, y aparece la etiqueta «Solo cámaras».
            </li>
          </ul>
          <p>
            Debajo de las pestañas, dentro de la cabecera, está la
            <strong>isla de acciones</strong> con accesos rápidos:
          </p>
          <div class="help-grid help-grid--chips">
            <span class="help-action-chip">Descargas</span>
            <span class="help-action-chip">Música</span>
            <span class="help-action-chip">Subtítulos</span>
            <span class="help-action-chip">OBS Studio</span>
            <span class="help-action-chip">Grabación</span>
            <span class="help-action-chip">Cronómetro</span>
            <span class="help-action-chip">Pantalla</span>
            <span class="help-action-chip">Escenas de cámara</span>
            <span class="help-action-chip">Zoom</span>
          </div>
          <div class="help-note">
            <q-icon name="mmm-info" />
            <p>
              La isla de acciones solo se muestra si está activada la
              presentación de multimedia o el botón de música. Si no puedes
              cambiar de página ni de perfil, detén primero la reproducción.
            </p>
          </div>
        </section>

        <section id="pantallas" class="help-section">
          <header class="help-section__header">
            <q-icon
              class="help-section__icon"
              name="mmm-media-display-active"
            />
            <h2>4. Pantallas de salida</h2>
          </header>
          <p>
            TM2 usa una <strong>pantalla multimedia principal</strong> y, si hay
            una segunda pantalla externa conectada, una
            <strong>segunda salida</strong>.
          </p>
          <ul class="help-list">
            <li>
              <strong>Multimedia y texto del año:</strong> se muestran en la
              pantalla multimedia y se reflejan también en la segunda salida.
            </li>
            <li>
              <strong>La cámara:</strong> se muestra únicamente en la pantalla
              de cámara elegida.
            </li>
            <li>
              <strong>El monitor del orador:</strong> cronómetro, avisos y hora
              se muestran en su propia pantalla.
            </li>
          </ul>
          <p>
            La pantalla que se usa se elige en la cabecera →
            <strong>Pantalla de salida</strong>. Las funciones de cada pantalla
            se asignan en el panel de presentación (isla de acciones → botón de
            pantalla), en <strong>Asignación de pantallas</strong>.
          </p>
          <figure class="help-figure">
            <img
              alt="Panel de configuración de la presentación con la asignación de pantallas"
              class="help-figure__image help-figure__image--popup"
              :src="asset('04-pantallas.png')"
            />
            <figcaption>
              Panel de pantalla: tipo de ventana, pantalla de salida, vista
              previa y fondo personalizado.
            </figcaption>
          </figure>
          <h3>Elegir y probar una pantalla</h3>
          <ol class="help-steps">
            <li>
              Conecta el proyector o monitor y espera a que Windows lo
              reconozca.
            </li>
            <li>Abre <strong>Pantalla de salida</strong>.</li>
            <li>Elige la pantalla para la salida multimedia.</li>
            <li>
              Usa <strong>Identificar pantalla</strong> para ver un número
              grande en cada pantalla y saber cuál es cuál.
            </li>
            <li>
              En <strong>Cámaras</strong>, usa
              <strong>Probar salida</strong> para reproducir un clip corto y
              confirmar que la pantalla está bien conectada.
              <strong>Detener prueba</strong> lo corta.
            </li>
          </ol>
          <p>
            La ventana de salida puede estar en
            <strong>pantalla completa</strong> o <strong>en ventana</strong>,
            según lo elijas en el panel de pantalla.
          </p>
        </section>

        <section id="reunion" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-calendar-month" />
            <h2>5. La página Reunión</h2>
          </header>
          <figure class="help-figure">
            <img
              alt="Página Reunión con el calendario y la lista de multimedia"
              class="help-figure__image"
              :src="asset('01-reunion.png')"
            />
            <figcaption>
              Página Reunión: cabecera, isla de acciones y secciones del día con
              sus archivos.
            </figcaption>
          </figure>
          <h3>Elegir la fecha</h3>
          <p>
            En el calendario lateral se elige el día. TM2 muestra las secciones
            de esa reunión (partes de entre semana y de fin de semana) con sus
            archivos.
          </p>
          <h3>Descargar los archivos</h3>
          <p>
            Al abrir una fecha, TM2 descarga automáticamente el multimedia que
            falte. El estado se ve en la isla de acciones →
            <strong>Descargas</strong>. Si falta un archivo, el propio elemento
            ofrece volver a descargarlo o localizarlo; si no hay conexión, TM2
            lo avisa y mantiene lo que ya estaba descargado.
          </p>
          <h3>Añadir archivos propios</h3>
          <ul class="help-list">
            <li>
              Con <strong>Añadir archivos multimedia</strong> puedes agregar
              contenido de JW.org (canción, video, publicación, Biblia de
              estudio, Biblia) o del equipo (carpeta de medios públicos, videos
              remotos, archivos sueltos).
            </li>
            <li>
              También puedes arrastrar archivos desde el Explorador de Windows a
              la lista.
            </li>
            <li>
              Si hay una carpeta vigilada configurada, lo que se copie allí se
              importa automáticamente en el día correspondiente.
            </li>
          </ul>
          <h3>Reproducir</h3>
          <p>
            Cada elemento tiene un botón de reproducción cuando el archivo está
            disponible. Al reproducirlo, se envía a la pantalla multimedia y a
            la segunda salida.
          </p>
          <ul class="help-list">
            <li>
              Para reproducir toda una sección o varios elementos, selecciónalos
              y usa las acciones de selección.
            </li>
            <li>
              <strong>Detener</strong> corta la reproducción y devuelve la
              pantalla al texto del año o al fondo.
            </li>
            <li>
              No se puede cambiar de página ni de perfil mientras hay multimedia
              reproduciéndose.
            </li>
          </ul>
          <h3>Opciones de cada elemento</h3>
          <p>
            En el menú de opciones (tres puntos) de cada archivo puedes mover el
            orden, ocultar el elemento, cambiar su nombre o etiqueta, repetirlo,
            ajustar la velocidad, elegir solo un clip, reproducir un video con
            audio alternativo, eliminarlo, localizarlo o restablecer su zoom y
            duración.
          </p>
          <h3>Texto del año y fondo</h3>
          <p>
            Cuando no hay multimedia reproduciéndose, la salida muestra el texto
            del año. En Ajustes se puede previsualizar el texto del año
            siguiente y restaurar el actual. El fondo personalizado, si está
            configurado, se muestra en la misma capa.
          </p>
        </section>

        <section id="camaras" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-video" />
            <h2>6. Cámaras y captura</h2>
          </header>
          <p>
            Abre la pestaña <strong>Cámaras</strong>. La página
            <strong>Cámaras y pantallas</strong> tiene tres bloques: control de
            la cámara, captura de ventanas y escenas.
          </p>
          <figure class="help-figure">
            <img
              alt="Página Cámaras y pantallas con la vista previa de la cámara"
              class="help-figure__image"
              :src="asset('02-camaras.png')"
            />
            <figcaption>
              Vista previa de la cámara, selección de dispositivo, disposición y
              pantalla de salida.
            </figcaption>
          </figure>
          <h3>Control de la cámara</h3>
          <ol class="help-steps">
            <li>
              Pulsa <strong>Detectar cámaras</strong> la primera vez para
              conceder acceso.
            </li>
            <li>Elige la cámara en la lista.</li>
            <li>
              Verás la <strong>vista previa</strong> en la ventana principal.
            </li>
            <li>
              Elige la <strong>disposición</strong>: pantalla completa, cámara
              pequeña sobre el texto o mitad cámara y mitad texto.
            </li>
            <li>
              Ajusta el <strong>zoom</strong> y arrastra la vista previa para
              encuadrar. <strong>Restablecer encuadre</strong> vuelve al
              encuadre original.
            </li>
            <li>
              Elige la <strong>pantalla de la cámara</strong> (solo las
              pantallas externas aparecen aquí).
            </li>
            <li>
              Pulsa <strong>Mostrar cámara en pantalla</strong>. La vista previa
              local se pausa; <strong>Detener cámara</strong> la quita de la
              pantalla.
            </li>
          </ol>
          <p>
            Cuando termina un archivo multimedia proyectado, la cámara vuelve
            automáticamente a su pantalla si estaba activa.
            <strong>Guardar captura</strong> guarda una imagen PNG de la vista
            previa actual.
          </p>
          <h3>Escenas de cámara</h3>
          <p>
            Una escena guarda la cámara, la disposición, el zoom y el encuadre.
            Elige la configuración, escribe un nombre y pulsa
            <strong>Guardar escena</strong>. Para activarla, usa su botón de
            reproducción; también puedes actualizarla con la configuración
            actual o eliminarla. Las escenas están disponibles además en la isla
            de acciones → <strong>Escenas de cámara</strong>.
          </p>
          <figure class="help-figure">
            <img
              alt="Sección de escenas de cámara y captura de ventanas"
              class="help-figure__image"
              :src="asset('03-camaras-escenas.png')"
            />
            <figcaption>
              Pantalla de salida, escenas de cámara y botones para mostrar la
              cámara, guardar la captura o mostrar la presentación.
            </figcaption>
          </figure>
          <h3>Captura de ventanas y pantallas</h3>
          <p>
            Sirve para mostrar a la audiencia otra aplicación, por ejemplo una
            presentación o una videollamada.
          </p>
          <ol class="help-steps">
            <li>Abre la aplicación que quieres compartir.</li>
            <li>
              En <strong>Captura de ventanas</strong>, pulsa
              <strong>Actualizar lista</strong>.
            </li>
            <li>
              Elige la <strong>ventana o pantalla</strong> y la
              <strong>pantalla de captura</strong>.
            </li>
            <li>
              Pulsa <strong>Mostrar captura en pantalla</strong>;
              <strong>Detener captura</strong> la corta.
            </li>
          </ol>
          <p>
            Mientras la captura está activa, la cámara y la pantalla de
            multimedia se pausan. Si la ventana compartida se cierra o se
            desconecta su pantalla, la captura se detiene y TM2 lo avisa.
          </p>
          <div class="help-note help-note--warning">
            <q-icon name="mmm-warning" />
            <p>
              No elijas como origen la propia salida de TM2 ni su segunda
              salida: la imagen se reflejaría en bucle.
            </p>
          </div>
          <h3>Modo solo cámaras</h3>
          <p>
            En Ajustes → General puedes activar
            <strong>Modo solo cámaras (sin multimedia de reunión)</strong>. TM2
            abre directamente la página Cámaras y oculta Reunión, las descargas
            y Sitio web. Cámaras, pantallas de salida, Ajustes y Ayuda siguen
            disponibles.
          </p>
          <h3>Permisos de cámara en Windows</h3>
          <ol class="help-steps">
            <li>
              Comprueba que otra aplicación no la esté usando (Zoom, Teams,
              OBS…).
            </li>
            <li>
              En Windows, revisa
              <strong>Configuración → Privacidad → Cámara</strong>
              y permite el acceso a las aplicaciones de escritorio.
            </li>
            <li>Vuelve a TM2 y pulsa <strong>Detectar cámaras</strong>.</li>
            <li>Si sigue sin funcionar, reinicia TM2.</li>
          </ol>
        </section>

        <section id="cronometro" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-alarm" />
            <h2>7. Cronómetro y monitor del orador</h2>
          </header>
          <p>
            El cronómetro sirve para medir las partes de la reunión y avisar al
            presidente. Pulsa <strong>Cronómetro</strong> en la isla de acciones
            para abrir su panel.
          </p>
          <figure class="help-figure">
            <img
              alt="Panel del cronómetro con los ajustes de la reunión"
              class="help-figure__image help-figure__image--popup"
              :src="asset('05-timer.png')"
            />
            <figcaption>
              Panel del cronómetro: tipo de ventana, número de partes y partes
              personalizadas.
            </figcaption>
          </figure>
          <ul class="help-list">
            <li>
              Tipo de ventana: <strong>Pantalla completa</strong> o
              <strong>En ventana</strong>.
            </li>
            <li>Pantalla donde se muestra el cronómetro.</li>
            <li>
              Número de partes de las secciones (por ejemplo, AYFM y LAC) y hora
              de fin personalizada.
            </li>
            <li>Partes personalizadas con nombre y duración.</li>
            <li>
              Controles: iniciar, pausar, avanzar de parte, aviso de mano
              levantada, exportar informe PDF y restablecer todos los tiempos.
            </li>
          </ul>
          <h3>Monitor del orador</h3>
          <p>
            En el mismo panel, la sección <strong>Monitor del orador</strong>
            permite escribir un texto de aviso y pulsar
            <strong>Mostrar aviso</strong>; el aviso aparece en la pantalla del
            cronómetro y <strong>Quitar aviso</strong> lo borra. También puedes
            activar <strong>Mostrar la hora en una esquina</strong>.
          </p>
          <figure class="help-figure">
            <img
              alt="Monitor del orador con aviso y reloj"
              class="help-figure__image help-figure__image--popup"
              :src="asset('06-monitor.png')"
            />
            <figcaption>
              Controles del cronómetro, aviso de mano levantada, informe PDF y
              restablecer tiempos.
            </figcaption>
          </figure>
          <p>
            Asigna la pantalla del monitor del orador en el panel de
            presentación (isla de acciones → Pantalla) →
            <strong>Asignación de pantallas</strong>.
          </p>
          <h3>Control remoto por red local</h3>
          <ol class="help-steps">
            <li>
              En Ajustes → <strong>Cronómetro de la reunión</strong>, activa
              <strong>Control remoto del cronómetro</strong>. Puedes cambiar el
              puerto (por defecto <code>8787</code>).
            </li>
            <li>Conecta la computadora y la tableta a la misma red.</li>
            <li>
              Abre el panel del cronómetro: verás una o varias direcciones web.
            </li>
            <li>Copia una dirección y ábrela en el navegador de la tableta.</li>
            <li>
              La tableta muestra la misma pantalla del cronómetro, con el aviso
              y el reloj.
            </li>
          </ol>
          <p>
            Si el control remoto no arranca, comprueba el puerto (puede estar
            ocupado por otro programa) y permite TM2 en el firewall de Windows.
          </p>
        </section>

        <section id="sitio-web" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-open-web" />
            <h2>8. Presentar un sitio web</h2>
          </header>
          <p>
            La pestaña <strong>Sitio web</strong> abre una ventana aparte con
            una página de JW.org para la audiencia.
          </p>
          <ul class="help-list">
            <li>Puedes acercar y alejar, retroceder, avanzar y actualizar.</li>
            <li>
              <strong>Empezar duplicación</strong> refleja la navegación en la
              salida; <strong>Detener duplicación</strong> la corta.
            </li>
          </ul>
          <p>
            Es útil para mostrar artículos o videos del sitio sin salir de TM2.
          </p>
        </section>

        <section id="ajustes" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-settings" />
            <h2>9. Ajustes y perfiles</h2>
          </header>
          <figure class="help-figure">
            <img
              alt="Página de Ajustes con las secciones de configuración"
              class="help-figure__image"
              :src="asset('07-ajustes.png')"
            />
            <figcaption>
              Ajustes → Archivos multimedia y reproducción, con las opciones
              principales de presentación.
            </figcaption>
          </figure>
          <ul class="help-list">
            <li>
              <strong>General:</strong> idioma de la aplicación, formato de
              fecha, modo oscuro, modo solo cámaras e inicio automático.
            </li>
            <li>
              <strong>Reuniones de congregación:</strong> nombre, idioma, días y
              horas de reunión, programa.
            </li>
            <li>
              <strong>Archivos multimedia y reproducción:</strong> activación de
              la reproducción, calidad de descarga, carpetas y vista previa.
            </li>
            <li>
              <strong>Cronómetro de la reunión:</strong> modo, colores, cuenta
              atrás, control remoto y pantalla del monitor.
            </li>
            <li>
              <strong>Integraciones:</strong> OBS Studio, Zoom, grabación,
              música y atajos.
            </li>
            <li>
              <strong>Interfaz y atajos:</strong> atajos globales y de la
              interfaz.
            </li>
            <li>
              <strong>Avanzado:</strong> actualizaciones, aceleración por
              hardware, caché y diagnóstico.
            </li>
          </ul>
          <div class="help-note help-note--warning">
            <q-icon name="mmm-warning" />
            <p>
              <strong>El ajuste más importante:</strong> Ajustes → Archivos
              multimedia y reproducción →
              <strong>Activar reproducción de archivos multimedia</strong>. Si
              está desactivado no aparecen los botones de reproducción y la
              página Reunión muestra un aviso amarillo. En la mayoría de los
              Salones del Reino debe estar activado.
            </p>
          </div>
          <h3>Perfiles</h3>
          <p>
            Cada perfil guarda su propia congregación, idioma, horario, carpetas
            y ajustes. Pulsa el nombre del perfil en la cabecera para cambiar,
            crear o exportar un perfil. No se puede cambiar de perfil mientras
            se reproduce multimedia.
          </p>
        </section>

        <section id="flujo" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-check" />
            <h2>10. Flujo recomendado para una reunión</h2>
          </header>
          <div class="help-flow">
            <div class="help-flow__block">
              <h3>Antes de la reunión</h3>
              <ol class="help-steps">
                <li>
                  Abre TM2 y comprueba que el perfil correcto está activo.
                </li>
                <li>Conecta el proyector y la segunda pantalla, si se usa.</li>
                <li>
                  Abre <strong>Pantalla de salida</strong>, asigna las pantallas
                  y pulsa <strong>Identificar pantalla</strong>.
                </li>
                <li>
                  En <strong>Cámaras</strong>, elige cámara, disposición y
                  encuadre; guarda o activa la escena.
                </li>
                <li>
                  En <strong>Reunión</strong>, elige la fecha y espera a que
                  terminen las descargas.
                </li>
                <li>
                  Reproduce un archivo de prueba y comprueba la salida.
                  <strong>Detener</strong>.
                </li>
                <li>Comprueba que el texto del año se ve en la salida.</li>
                <li>
                  Si se usa cronómetro, elige la pantalla del monitor del orador
                  y activa el control remoto para la tableta.
                </li>
                <li>
                  Si se usa Zoom u OBS, comprueba la conexión en la isla de
                  acciones.
                </li>
              </ol>
            </div>
            <div class="help-flow__block">
              <h3>Durante la reunión</h3>
              <ol class="help-steps">
                <li>Reproduce cada archivo cuando corresponda.</li>
                <li>
                  Para la cámara, pulsa
                  <strong>Mostrar cámara en pantalla</strong>; para volver al
                  texto, <strong>Detener cámara</strong>.
                </li>
                <li>
                  Para mostrar otra aplicación, usa
                  <strong>Captura de ventanas</strong> y
                  <strong>Detener captura</strong> al terminar.
                </li>
                <li>
                  Usa el cronómetro por partes y envía avisos al monitor del
                  orador si hace falta.
                </li>
                <li>
                  Detén la reproducción antes de cambiar de página o de perfil.
                </li>
              </ol>
            </div>
            <div class="help-flow__block">
              <h3>Después de la reunión</h3>
              <ol class="help-steps">
                <li>Detén la reproducción y la cámara.</li>
                <li>Detén la grabación si estaba activa.</li>
                <li>Exporta el informe del cronómetro si se necesita.</li>
                <li>Cierra TM2 con el botón de cerrar de la ventana.</li>
              </ol>
            </div>
          </div>
        </section>

        <section id="problemas" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-warning" />
            <h2>11. Solución de problemas</h2>
          </header>
          <q-list class="help-faq">
            <q-expansion-item
              v-for="item in troubleshooting"
              :key="item.question"
              class="help-faq__item"
              expand-separator
              :label="item.question"
            >
              <div class="help-faq__answer">
                <p v-for="line in item.answer" :key="line">{{ line }}</p>
              </div>
            </q-expansion-item>
          </q-list>
        </section>

        <section id="rutas" class="help-section">
          <header class="help-section__header">
            <q-icon class="help-section__icon" name="mmm-folder-open" />
            <h2>12. Rutas y nombres</h2>
          </header>
          <dl class="help-paths">
            <div>
              <dt>Carpeta de datos portable</dt>
              <dd><code>TM2 - User Data</code>, junto al ejecutable.</dd>
            </div>
            <div>
              <dt>Carpeta temporal portable</dt>
              <dd><code>TM2 - Temporary Files</code>, junto al ejecutable.</dd>
            </div>
            <div>
              <dt>Carpeta de datos instalada</dt>
              <dd><code>%APPDATA%\TM2</code>.</dd>
            </div>
            <div>
              <dt>Ajuste de reproducción</dt>
              <dd>
                Archivos multimedia y reproducción → Activar reproducción de
                archivos multimedia.
              </dd>
            </div>
            <div>
              <dt>Pantallas</dt>
              <dd>Cabecera → Pantalla de salida.</dd>
            </div>
            <div>
              <dt>Cámara y captura</dt>
              <dd>Pestaña Cámaras.</dd>
            </div>
            <div>
              <dt>Cronómetro y monitor</dt>
              <dd>Isla de acciones → Cronómetro.</dd>
            </div>
            <div>
              <dt>Página de reunión</dt>
              <dd>Pestaña Reunión.</dd>
            </div>
            <div>
              <dt>Sitio web</dt>
              <dd>Pestaña Sitio web.</dd>
            </div>
          </dl>
          <p class="help-footer-note">
            {{ t('teo-help-footer-note', { version: appVersion }) }}
          </p>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();

const appVersion = computed(() => `v${import.meta.env.version ?? ''}`);
const updatedLabel = '30 de octubre de 2026';

const asset = (fileName: string) =>
  `${import.meta.env.BASE_URL}help/${fileName}`;

const toc = [
  { id: 'que-es', label: 'Qué es TM2' },
  { id: 'instalacion', label: 'Instalación y datos' },
  { id: 'ventana', label: 'Ventana principal' },
  { id: 'pantallas', label: 'Pantallas de salida' },
  { id: 'reunion', label: 'Página Reunión' },
  { id: 'camaras', label: 'Cámaras y captura' },
  { id: 'cronometro', label: 'Cronómetro y monitor' },
  { id: 'sitio-web', label: 'Sitio web' },
  { id: 'ajustes', label: 'Ajustes y perfiles' },
  { id: 'flujo', label: 'Flujo de la reunión' },
  { id: 'problemas', label: 'Solución de problemas' },
  { id: 'rutas', label: 'Rutas y nombres' },
];

const troubleshooting = [
  {
    answer: [
      'La reproducción de multimedia está desactivada. Activa Archivos multimedia y reproducción → Activar reproducción de archivos multimedia. El aviso amarillo de la página Reunión lleva directamente a ese ajuste.',
    ],
    question: 'No aparecen los botones de reproducir',
  },
  {
    answer: [
      'Comprueba que la pantalla de salida está conectada y asignada.',
      'Si la cámara está en pantalla completa, el texto del año se oculta a propósito. Cambia a cámara pequeña sobre el texto o mitad cámara y mitad texto, o detén la cámara.',
      'Si la salida está en blanco, abre Pantalla de salida y vuelve a elegir la pantalla. Usa Probar salida para confirmar.',
    ],
    question: 'El texto del año no se ve en la salida',
  },
  {
    answer: [
      'Puede estar en uso por otra aplicación. Ciérrala o elige otra cámara.',
      'Revisa los permisos de cámara de Windows.',
      'Pulsa Detectar cámaras y, si hace falta, reinicia TM2.',
    ],
    question: 'La cámara no se abre',
  },
  {
    answer: [
      'La ventana compartida se cerró o se desconectó su pantalla. Actualiza la lista, elige otra ventana o pantalla y vuelve a iniciar la captura.',
    ],
    question: 'La captura se detuvo',
  },
  {
    answer: [
      'Estás capturando la propia salida de TM2 o su segunda salida. Elige otra ventana u otra pantalla.',
    ],
    question: 'La imagen se repite en bucle al capturar',
  },
  {
    answer: [
      'Comprueba la conexión del monitor o proyector.',
      'En Windows, usa Extender (no Duplicar) para tener dos pantallas.',
      'Abre Pantalla de salida para refrescar la lista.',
    ],
    question: 'No se detecta la segunda pantalla',
  },
  {
    answer: [
      'La computadora y la tableta deben estar en la misma red.',
      'Comprueba el puerto en Ajustes; si está ocupado, elige otro.',
      'Permite TM2 en el firewall de Windows.',
      'Usa la dirección que muestra el panel del cronómetro, no una inventada.',
    ],
    question: 'El control remoto del cronómetro no conecta',
  },
  {
    answer: ['Hay multimedia reproduciéndose. Pulsa Detener primero.'],
    question: 'No puedo cambiar de página ni de perfil',
  },
  {
    answer: [
      'En el propio elemento, usa Localizar archivo multimedia para volver a vincularlo, o elimínalo y vuelve a añadirlo. Si es multimedia de JW.org, TM2 intentará descargarlo de nuevo.',
    ],
    question: 'Un archivo multimedia falta',
  },
  {
    answer: [
      'TM2 intenta recuperarla automáticamente. Si se repite, reinicia TM2. Como último recurso, en Ajustes → Avanzado puedes probar a desactivar la aceleración por hardware.',
    ],
    question: 'La ventana de multimedia se cerró o se reinició',
  },
  {
    answer: [
      'Es normal: la versión portable no usa el actualizador. Descarga la nueva versión y conserva la carpeta TM2 - User Data.',
    ],
    question: 'La versión portable no se actualiza',
  },
  {
    answer: [
      'Puede ocurrir con el asistente de Zoom o con la captura de pantalla. Permite TM2 en el antivirus y vuelve a intentarlo. Si faltan archivos del asistente de Zoom, reinstalar TM2 debería restaurarlos.',
    ],
    question: 'Windows o el antivirus bloquean funciones',
  },
];

const goToSection = (id: string) => {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const printManual = () => {
  globalThis.print();
};
</script>

<style lang="scss" scoped>
.help-page {
  padding: 24px 28px 56px;
}

.help-hero {
  align-items: flex-start;
  background:
    radial-gradient(
      circle at 82% 12%,
      rgba(94, 234, 212, 0.18),
      transparent 42%
    ),
    linear-gradient(118deg, #081120 0%, #0d1b2e 58%, #0b2530 100%);
  border: 1px solid rgba(94, 234, 212, 0.18);
  border-radius: 20px;
  box-shadow: 0 18px 40px -28px rgba(3, 12, 24, 0.65);
  color: #fff;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: space-between;
  padding: 30px 34px;
}

.help-hero__eyebrow {
  align-items: center;
  color: #99f6e4;
  display: flex;
  font-size: 0.72rem;
  font-weight: 700;
  gap: 8px;
  letter-spacing: 0.14em;
  margin: 0 0 10px;
  text-transform: uppercase;
}

.help-hero h1 {
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  font-weight: 750;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
}

.help-hero__subtitle {
  color: rgba(226, 240, 245, 0.82);
  font-size: 0.95rem;
  line-height: 1.55;
  margin: 0;
  max-width: 620px;
}

.help-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.help-chip {
  background: rgba(94, 234, 212, 0.1);
  border: 1px solid rgba(94, 234, 212, 0.28);
  border-radius: 999px;
  color: #ccfbf1;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 4px 12px;
}

.help-hero__actions {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-hero__hint {
  color: rgba(226, 240, 245, 0.6);
  font-size: 0.7rem;
  margin: 0;
  max-width: 220px;
  text-align: right;
}

.help-layout {
  align-items: flex-start;
  display: grid;
  gap: 28px;
  grid-template-columns: 250px minmax(0, 1fr);
  margin-top: 28px;
}

.help-toc {
  background: #fff;
  border: 1px solid rgba(13, 128, 120, 0.14);
  border-radius: 16px;
  box-shadow: 0 10px 26px -24px rgba(8, 17, 32, 0.4);
  padding: 16px 12px;
  position: sticky;
  top: calc(var(--teo-header-height, 170px) + 16px);
}

.help-toc__title {
  color: #5a6b78;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0 0 8px;
  padding: 0 10px;
  text-transform: uppercase;
}

.help-toc__item {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: #243746;
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: 0.83rem;
  font-weight: 500;
  gap: 10px;
  padding: 7px 10px;
  text-align: left;
  transition: background-color 0.15s ease;
  width: 100%;
}

.help-toc__item:hover {
  background: rgba(13, 128, 120, 0.08);
}

.help-toc__number {
  align-items: center;
  background: rgba(13, 128, 120, 0.1);
  border-radius: 7px;
  color: #0d8078;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.68rem;
  font-weight: 700;
  height: 22px;
  justify-content: center;
  width: 22px;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.help-section {
  background: #fff;
  border: 1px solid rgba(13, 128, 120, 0.12);
  border-radius: 18px;
  box-shadow: 0 14px 30px -30px rgba(8, 17, 32, 0.45);
  padding: 26px 30px 28px;
  scroll-margin-top: calc(var(--teo-header-height, 170px) + 16px);
}

.help-section__header {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.help-section__icon {
  background: rgba(13, 128, 120, 0.1);
  border-radius: 10px;
  color: #0d8078;
  flex: 0 0 auto;
  padding: 7px;
}

.help-section h2 {
  color: #0d1b2e;
  font-size: 1.22rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
}

.help-section h3 {
  color: #0d1b2e;
  font-size: 0.98rem;
  font-weight: 650;
  margin: 22px 0 8px;
}

.help-section p {
  color: #3c4c59;
  line-height: 1.6;
  margin: 0 0 10px;
}

.help-list {
  color: #3c4c59;
  line-height: 1.6;
  margin: 0 0 12px;
  padding-left: 20px;
}

.help-list li {
  margin-bottom: 6px;
}

.help-steps {
  color: #3c4c59;
  line-height: 1.6;
  margin: 0 0 12px;
  padding-left: 22px;
}

.help-steps li {
  margin-bottom: 6px;
}

.help-note {
  align-items: flex-start;
  background: rgba(13, 128, 120, 0.07);
  border-left: 3px solid #0d8078;
  border-radius: 0 10px 10px 0;
  color: #29414e;
  display: flex;
  gap: 10px;
  margin: 14px 0;
  padding: 12px 14px;
}

.help-note .q-icon {
  color: #0d8078;
  flex: 0 0 auto;
  margin-top: 2px;
}

.help-note p {
  margin: 0;
}

.help-note--warning {
  background: rgba(245, 158, 11, 0.09);
  border-left-color: #d97706;
}

.help-note--warning .q-icon {
  color: #d97706;
}

.help-table {
  border-collapse: collapse;
  margin: 4px 0 14px;
  width: 100%;
}

.help-table th,
.help-table td {
  border-bottom: 1px solid rgba(13, 128, 120, 0.12);
  color: #3c4c59;
  line-height: 1.5;
  padding: 9px 12px;
  text-align: left;
  vertical-align: top;
}

.help-table th {
  background: rgba(13, 128, 120, 0.06);
  color: #0d1b2e;
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.help-figure {
  margin: 16px 0 20px;
}

.help-figure__image {
  border: 1px solid rgba(13, 128, 120, 0.16);
  border-radius: 12px;
  display: block;
  height: auto;
  overflow: hidden;
  width: 100%;
}

.help-figure__image--popup {
  margin: 0 auto;
  max-width: 340px;
}

.help-figure figcaption {
  color: #6b7d89;
  font-size: 0.76rem;
  line-height: 1.45;
  margin-top: 7px;
  text-align: center;
}

.help-grid--chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 4px 0 10px;
}

.help-action-chip {
  background: rgba(13, 128, 120, 0.08);
  border: 1px solid rgba(13, 128, 120, 0.16);
  border-radius: 999px;
  color: #0d6b64;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 4px 12px;
}

.help-faq {
  margin-top: 4px;
}

.help-faq__item {
  border-bottom: 1px solid rgba(13, 128, 120, 0.1);
  color: #243746;
}

.help-faq__answer {
  color: #3c4c59;
  line-height: 1.6;
  padding: 0 16px 12px;
}

.help-faq__answer p {
  margin: 0 0 6px;
}

.help-flow {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-flow__block {
  border-left: 3px solid rgba(13, 128, 120, 0.25);
  padding-left: 18px;
}

.help-flow__block h3 {
  margin-top: 14px;
}

.help-paths {
  margin: 4px 0 0;
}

.help-paths div {
  border-bottom: 1px solid rgba(13, 128, 120, 0.1);
  display: grid;
  gap: 10px;
  grid-template-columns: 230px minmax(0, 1fr);
  padding: 10px 0;
}

.help-paths dt {
  color: #0d1b2e;
  font-weight: 650;
}

.help-paths dd {
  color: #3c4c59;
  margin: 0;
}

.help-paths code,
.help-section code {
  background: rgba(13, 128, 120, 0.08);
  border-radius: 5px;
  color: #0d6b64;
  font-size: 0.85em;
  padding: 1px 5px;
}

.help-footer-note {
  border-top: 1px solid rgba(13, 128, 120, 0.12);
  color: #6b7d89;
  font-size: 0.76rem;
  margin-top: 18px;
  padding-top: 12px;
}

@media (max-width: 1100px) {
  .help-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .help-toc {
    position: static;
  }

  .help-paths div {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
}

@media (max-width: 720px) {
  .help-page {
    padding: 14px 12px 36px;
  }

  .help-hero {
    padding: 22px;
  }

  .help-hero__actions {
    align-items: flex-start;
  }

  .help-hero__hint {
    text-align: left;
  }

  .help-section {
    padding: 20px 18px 22px;
  }
}

@media print {
  :global(.q-header),
  :global(.q-page-sticky),
  :global(.help-hero__actions),
  :global(.help-toc) {
    display: none !important;
  }

  :global(.q-notification) {
    display: none !important;
  }

  :global(.app-main-scroll) {
    height: auto !important;
    margin-top: 0 !important;
    overflow: visible !important;
  }

  :global(.app-main-scroll > .q-page) {
    max-width: none !important;
  }

  :global(body),
  :global(#q-app) {
    background: #fff !important;
  }

  .help-page {
    padding: 0;
  }

  .help-hero {
    background: #0d1b2e !important;
    box-shadow: none;
    color: #fff !important;
    margin-bottom: 18px;
    print-color-adjust: exact;
  }

  .help-layout {
    display: block;
    margin-top: 0;
  }

  .help-section {
    border: 1px solid #d5dee3;
    box-shadow: none;
    margin-bottom: 16px;
    padding: 18px 20px;
    print-color-adjust: exact;
    break-inside: auto;
  }

  .help-section__header {
    break-after: avoid;
  }

  .help-figure,
  .help-note,
  .help-table tr,
  .help-faq__item {
    break-inside: avoid;
  }
}
</style>
