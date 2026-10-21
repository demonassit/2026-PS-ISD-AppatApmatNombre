// Interfaz de la calculadora. Toda la lógica de cálculo vive en subneteo.js.

(function () {
  'use strict';
  const S = window.Subneteo;
  const $ = (id) => document.getElementById(id);

  // Evita que un nombre escrito por el usuario se interprete como HTML
  function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  const formatoMiles = (n) => n.toLocaleString('es-MX');

  function mostrarError(destino, error) {
    destino.innerHTML = `<div class="error">⚠ ${escapar(error.message)}</div>`;
  }

  // IP en binario con los bits de red en azul y los de host en naranja
  function binarioColoreado(ip, prefijo) {
    const bits = S.ipABinario(ip).replace(/\./g, '');
    let html = '';
    for (let i = 0; i < 32; i++) {
      if (i > 0 && i % 8 === 0) html += '.';
      html += `<span class="${i < prefijo ? 'bits-red' : 'bits-host'}">${bits[i]}</span>`;
    }
    return html;
  }

  function tarjetaRedBase(ip, prefijo) {
    const clase = S.claseDeRed(ip);
    return `
      <div class="tarjeta">
        <h3>Red base ${escapar(ip)}/${prefijo}</h3>
        <dl class="datos">
          <div><dt>Clase (histórica)</dt><dd>${clase.clase}${clase.prefijoPorDefecto ? ` · /${clase.prefijoPorDefecto} por defecto` : ''}</dd></div>
          <div><dt>Tipo</dt><dd>${S.esPrivada(ip) ? 'Privada (RFC 1918)' : 'Pública'}</dd></div>
          <div><dt>Máscara</dt><dd>${S.prefijoAMascara(prefijo)}</dd></div>
          <div><dt>Direcciones en total</dt><dd>${formatoMiles(2 ** (32 - prefijo))}</dd></div>
        </dl>
        <p class="binario">IP&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${binarioColoreado(ip, prefijo)}</p>
        <p class="binario">Máscara ${binarioColoreado(S.prefijoAMascara(prefijo), prefijo)}</p>
        <p class="leyenda"><span class="bits-red">Azul</span> = bits de red · <span class="bits-host">naranja</span> = bits de host</p>
      </div>`;
  }

  function tablaSubredes(subredes, conSolicitados) {
    const filas = subredes.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapar(s.nombre)}</td>
        ${conSolicitados ? `<td>${formatoMiles(s.hostsSolicitados)}</td>` : ''}
        <td class="ip">${s.red}/${s.prefijo}</td>
        <td class="ip">${s.mascara}</td>
        <td class="ip">${s.primerHost}</td>
        <td class="ip">${s.ultimoHost}</td>
        <td class="ip">${s.broadcast}</td>
        <td>${formatoMiles(s.hosts)}</td>
      </tr>`).join('');
    return `
      <div class="tabla-envoltura">
        <table class="resultado">
          <thead><tr>
            <th>#</th><th>Subred</th>${conSolicitados ? '<th>Hosts pedidos</th>' : ''}
            <th>Red</th><th>Máscara</th><th>Primer host</th><th>Último host</th><th>Broadcast</th><th>Hosts útiles</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>`;
  }

  // ---------- Pestañas ----------

  document.querySelectorAll('.pestana').forEach((boton) => {
    boton.addEventListener('click', () => activarPanel(boton.dataset.panel));
  });

  function activarPanel(id) {
    document.querySelectorAll('.pestana').forEach((b) => b.classList.toggle('activa', b.dataset.panel === id));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('activo', p.id === id));
  }

  // ---------- Conversor ----------

  $('form-binario').addEventListener('submit', (e) => {
    e.preventDefault();
    const destino = $('bin-resultado');
    try {
      const entrada = $('bin-entrada').value.trim();
      const octetos = entrada.includes('.')
        ? S.enteroAIp(S.ipAEntero(entrada)).split('.').map(Number)
        : [Number(entrada)];
      if (octetos.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
        throw new Error('Escribe un número entre 0 y 255 o una IP válida');
      }
      destino.innerHTML = octetos.map((o) => {
        const pasos = S.pasosDecimalABinario(o);
        return `
          <div class="tarjeta">
            <h3>${o} → <span class="binario">${S.octetoABinario(o)}</span></h3>
            <table class="pasos">
              <tr><th>Peso</th>${pasos.map((p) => `<th>${p.peso}</th>`).join('')}</tr>
              <tr><td>Bit</td>${pasos.map((p) => `<td>${p.bit}</td>`).join('')}</tr>
              <tr><td>Resto</td>${pasos.map((p) => `<td>${p.resto}</td>`).join('')}</tr>
            </table>
            <p class="leyenda">Si el número (o lo que resta) alcanza para el peso, se pone 1 y se resta; si no, se pone 0.</p>
          </div>`;
      }).join('');
    } catch (err) {
      mostrarError(destino, err);
    }
  });

  // ---------- FLSM ----------

  $('form-flsm').addEventListener('submit', (e) => {
    e.preventDefault();
    const destino = $('flsm-resultado');
    try {
      const ip = $('flsm-red').value.trim();
      const prefijo = S.leerPrefijo($('flsm-prefijo').value);
      const cantidad = Number($('flsm-cantidad').value);
      const r = S.subnetearFLSM(ip, prefijo, { [$('flsm-modo').value]: cantidad });
      destino.innerHTML = tarjetaRedBase(ip, prefijo) + `
        <div class="tarjeta">
          <h3>Resultado</h3>
          <dl class="datos">
            <div><dt>Bits prestados</dt><dd>${r.bitsPrestados} (2^${r.bitsPrestados} = ${r.totalSubredes} subredes)</dd></div>
            <div><dt>Nuevo prefijo</dt><dd>/${r.nuevoPrefijo} · ${S.prefijoAMascara(r.nuevoPrefijo)}</dd></div>
            <div><dt>Hosts útiles por subred</dt><dd>2^${32 - r.nuevoPrefijo} − 2 = ${formatoMiles(r.hostsPorSubred)}</dd></div>
            <div><dt>Salto entre subredes</dt><dd>${formatoMiles(r.subredes[0].tamanoBloque)} direcciones</dd></div>
          </dl>
        </div>
        <div class="tarjeta">${tablaSubredes(r.subredes, false)}</div>`;
    } catch (err) {
      mostrarError(destino, err);
    }
  });

  // ---------- VLSM ----------Tarea

  // ---------- ¿A qué red pertenece? ----------

  $('form-ip').addEventListener('submit', (e) => {
    e.preventDefault();
    const destino = $('ip-resultado');
    try {
      const ip = $('ip-dir').value.trim();
      const prefijo = S.leerPrefijo($('ip-prefijo').value);
      const s = S.analizarIp(ip, prefijo);
      destino.innerHTML = `
        <div class="tarjeta">
          <h3>${escapar(ip)}/${prefijo}</h3>
          <p class="binario">IP&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${binarioColoreado(ip, prefijo)}</p>
          <p class="binario">Máscara ${binarioColoreado(s.mascara, prefijo)}</p>
          <p class="binario">Red&nbsp;&nbsp;&nbsp;&nbsp;${binarioColoreado(s.red, prefijo)} &nbsp;(IP AND máscara)</p>
          <dl class="datos">
            <div><dt>Red</dt><dd>${s.red}/${prefijo}</dd></div>
            <div><dt>Primer host</dt><dd>${s.primerHost}</dd></div>
            <div><dt>Último host</dt><dd>${s.ultimoHost}</dd></div>
            <div><dt>Broadcast</dt><dd>${s.broadcast}</dd></div>
            <div><dt>Hosts útiles</dt><dd>${formatoMiles(s.hosts)}</dd></div>
          </dl>
        </div>`;
    } catch (err) {
      mostrarError(destino, err);
    }
  });

  // ---------- Ejercicios de la hoja ----------

  const ejercicios = {
    1: () => {
      $('vlsm-red').value = '192.168.50.0';
      $('vlsm-prefijo').value = '/24';
      cargarFilas([['Laboratorio de Cómputo', 60], ['Sala de Maestros', 25], ['Control Escolar', 12],
        ['Biblioteca', 5], ['Enlace R1-R2', 2], ['Enlace R2-R3', 2]]);
      activarPanel('panel-vlsm');
      $('form-vlsm').requestSubmit();
    },
    2: () => {
      $('vlsm-red').value = '172.20.0.0';
      $('vlsm-prefijo').value = '/16';
      cargarFilas([['Campus Norte', 2000], ['Campus Sur', 1000], ['Administración', 500],
        ['WiFi Visitantes', 200], ['Enlace Norte-Sur', 2]]);
      activarPanel('panel-vlsm');
      $('form-vlsm').requestSubmit();
    },
    3: () => {
      $('flsm-red').value = '10.0.0.0';
      $('flsm-prefijo').value = '/8';
      $('flsm-modo').value = 'subredes';
      $('flsm-cantidad').value = 16;
      activarPanel('panel-flsm');
      $('form-flsm').requestSubmit();
    },
  };

  function cargarFilas(lista) {
    $('vlsm-filas').innerHTML = '';
    lista.forEach(([nombre, hosts]) => agregarFila(nombre, hosts));
  }

  document.querySelectorAll('[data-ejemplo]').forEach((b) => {
    b.addEventListener('click', () => ejercicios[b.dataset.ejemplo]());
  });

  // Estado inicial: filas del ejercicio 1 y conversión de ejemplo
  cargarFilas([['Laboratorio de Cómputo', 60], ['Sala de Maestros', 25], ['Control Escolar', 12],
    ['Biblioteca', 5], ['Enlace R1-R2', 2], ['Enlace R2-R3', 2]]);
  $('form-binario').requestSubmit();

  // index.html#ejercicio=2 abre directamente ese ejercicio (útil para proyectar en clase)
  const enlace = location.hash.match(/ejercicio=(\d)/);
  if (enlace && ejercicios[enlace[1]]) ejercicios[enlace[1]]();
})();