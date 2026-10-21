(function() {
    'use strict';
    const S = window.Subneteo;
    const $ = (id) => document.getElementById(id);

    //funcion que evista que un nombre escrito se intreprete como html
    function escapar(texto){
        return String(texto).replace(/[&<>"']/g, (c)=>({
            '&':'&amp;', '<':'&lt', '>':'"', '"': '&quot', "'": '&#39'
        })[c]);
    }

    const formatoMiles = (n) => n.toLocaleString('es-MX');

    function mostrarError(destino, error){
        destino.innerHTML = `<div class="error">!${escapar(error.message)}</div>`;
    }

    //funcion de IP en Binario con los bits de red de color azul y los de host en naranja
    function binarioColorado(ip, prefijo){
        const bits = S.ipABinario(ip).replace(/\./g, '');
        let html = '';
        for(let i = 0; i < 32; i++){
            if(i > 0 && i % 8 === 0) html+= '.';
            html += `<span class="${i < prefijo ? 'bits-red':'bits-host'}">${bits[i]}</span>`;
        }
        return html;
    }

    function tarjetaRedBase(ip, prefijo){
        const clase = S.claseDeRed(ip);
        return`
        <div class="tarjeta">  
            <h3> Red Base ${escapar(ip)}/${prefijo} </h3>
            <div class="datos">
                <div> <dt> Clase (Historica) </dt> <dd>${clase.clase}${clase.prefijoPorDefecto ? ` ./${clase.prefijoPorDefecto} por defecto`: ''}</dd> </div>
                <div> <dt> Tipo </dt> <dd>${S.esPrivada ? 'Privada ': 'Publica'}</dd> </div>
                <div> <dt> Mascara </dt> <dd>${S.prefijoAMascara}</dd> </div>
                <div> <dt> Direcciones en Total </dt> <dd>${formatoMiles(2**(32-prefijo))}</dd> </div>
            </div>
            <p class="binario">IP;&nbsp;&nbsp;&nbsp;&nbsp${binarioColorado(ip, prefijo)}</p>
            <p class="binario">Mascara${binarioColorado(S.prefijoAMascara(prefijo), prefijo)}</p>
            <p class="leyenda"><span class="bits-red">Azul</span> = bits de red -- <span class="bits-host">naranja</span> = bits de host</p>
        </div>
        `;
    }

    function tablaSubredes(subredes, conSolicitados){
        const filas = subredes.map((s, i) =>`
            <tr>
                <td>${i+1}</td>
                <td>${escapar(S.nombre)}</td>
                ${conSolicitados ? `<td>${formatoMiles(S.hostsSolicitados)}</td>`:''}
                <td class="ip">${s.red}/${s.prefijo}</td>
                <td class="ip">${s.mascara}</td>
                <td class="ip">${s.primerHost}</td>
                <td class="ip">${s.iltimoHost}</td>
                <td class="ip">${s.broadcast}</td>
                <td>${formatoMiles(s.host)}</td>
            </tr>
        `).join('');
        return `
            <div class="tabla-envoltura" >
                <table class="resultado" >
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Subred</th>
                            ${conSolicitados ? '<th>Host Perdidos</th>':''}
                            <th>Red</th>
                            <th>Mascara</th>
                            <th>Primer host</th>
                            <th>Ultimo host</th>
                            <th>Broadcast</th>
                            <th>Host utiles</th>
                        </tr>
                    </thead>
                    <tbody> ${filas} </tbody>
                </table>
            </div>
        `;
    }

    //pestañas

    document.querySelectorAll('.pestana').forEach((boton) => {
        boton.addEventListener('click', () => activarPanel(boton.dataset.panel));
    });

    function activarPanel(id){
        document.querySelectorAll('.pestana').forEach((b) => b.classList.toggle('activa', b.dataset.panel === id));
        document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('activo'), p.id === id);
    }

    //conversores
    $('form-binario').addEventListener('submit', (e)=>{
        e.preventDefault();
        const destino = $('bin-resultado');
        try{
            const entrada = $('bin-entrada').value.trim();
            const octetos = entrada.includes('.') ? S.enteroAIp(S.ipAEntero(entrada)).split('.').map(Number) : [Number(entrada)];
            if(octetos.some((0) => !Number.isInteger(o)  || o < 0 || o > 255)){
                throw new Error('Escribe un numero entre el 0 y el 255 o una IP valida'); 
            }
            destino.innerHTML = octetos.map((o) =>{
                const pasos = S.pasosDecimalABinario(o);
                return `
                    <div  class="tarjeta" >
                        <h3>${o} -> <span class="binario">${S.octetoABinario(o)}</span></h3>
                        <table class="pasos" >
                            <tr>
                                <th>Peso</th>
                                <th>${pasos.map((p) => `<th>${p.peso}</th>`).join('')}</th>
                                <th>Bit</th>
                                <th>${pasos.map((p) => `<th>${p.bit}</th>`).join('')}</th>
                                <th>Resto</th>
                                <th>${pasos.map((p) => `<th>${p.resto}</th>`).join('')}</th>
                            </tr>
                        </table>
                        <p class="leyenda">Si el numero (o lo que resta) alcanza para el peso, se pone 1 y se resta, sino, se pone 0</p>
                    </div>
                `;
            }).join('');
        }catch (err){
            mostrarError(destino, err);
    }
    });


})