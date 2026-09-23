const net = require('net');

const PUERTO =  5000;

const servidor = net.createServer((socket) => {
    const cliente = `${socket.remoteAddress}:${socket.remotePort}`;
    // Aqui el evento de conexion solo se dispara en el momento en que cliente y servidor establecen three-way a traves del handshake (el apreton de manos es el momento en que el cliente realiza una petición, envia IP, Puerto, Datagrama y saluda al servidor, el servidor le responde creando la sesión) 
    console.log(`[TCP] Conexion Establecida con el Cliente ${cliente}`);

    socket.on('data', (datos) => {
        const crudo = datos.toString();
        //TCP es un flujo de bytes entonces nosotros en el socket lo vamos a transformar en cadenas
        console.log(`[TCP] Datos crudos asi crudisimos: ${datos.length} bytes: ${JSON.stringify(crudo)}`);

        const lineas = crudo.split('\n').map((l) => l.trim()).filter(Boolean);

        lineas.forEach((linea) => {
            console.log(`[TCP] Mensaje: "${linea}"`);
            socket.write(`Eco TCP: ${linea}\n`);
        });

    });

    socket.on('close', () => {
        console.log(`[TCP] Conexion Cerrada con el Cliente: ${cliente}`);
    });

    socket.on('error', (error) => {
        console.log(`[TCP] Error con : ${cliente}`, error.message);
    });
});

servidor.listen(PUERTO, () => {
    console.log(`Servidor inicializado en: ${PUERTO}`);
    console.log('Prueba');
});