const net = require('net');

const PORT = 5000;

const nombre = process.argv[2] || 'Cliente';

const socket = net.connect(PORT, 'localhost', () => {
    console.log(`${nombre} conectado al servidor`);
    socket.write(`Hola desde ${nombre}\n`);
});

socket.on('data', (datos) => {
    const mensaje = datos.toString().trim();
    console.log(`Servidor dice: ${mensaje}`);
});

socket.on('close', () => {
    console.log(`${nombre} desconectado del servidor`);
});