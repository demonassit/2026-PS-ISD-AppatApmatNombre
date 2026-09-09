/*
Vamos a programar un cliente, mediante el cual vamos a probar la arquitectura cliente-servidor por medio de una petición mediante protocolo http 
utilizando metodo GET a la ruta: /api/talleres

Que tenemos que conectarnos al servicio de la BD

El problema es como apuntar al back

*/

const API_URL = "https://proyectobackcecyt9.onrender.com"; // Cambia esto según la URL de tu backend

async function main() {

    console.log("Cliente Petición Get -> a ${API_URL}/api/talleres");

    const inicio = Date.now();
    const respuesta = await fetch(`${API_URL}/api/talleres`);
    //Nos da el tiempo de ida y vuelta por medio de la petición mediante RTT 
    const duracionMs = Date.now() - inicio;
    //un estatus de error 500 seria una respuesta valida si el servicio de la BD no esta disponible 
    const cuerpo = await respuesta.json();

    console.log("Ciclo de petición - respuesta");
    console.log("Protocolo HTTPS sobre TCP : ${respuesta.url}");
    console.log("Status de recibido: ${respuesta.status} ${respuesta.statusText}");
    console.log("Tiempo de ida y vuelta (RTT): ${duracionMs} ms");
    console.log(JSON.stringify(cuerpo, null, 2));
}

