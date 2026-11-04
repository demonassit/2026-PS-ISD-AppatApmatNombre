// un hilo sirve para poder programar o automatizar un proceso
// multples hilos sirven para porder programar procesos en paralelo o en serie dependiendo de la necesidad 
// los sockets utilizan hilos para poder comunicar y realizar procesos entre el cliente y servidor.

const net = require('net');

const PORT = 5000;

//definir la creacion del servidor
const clientes = new Map();

let siguienteid = 1;


const servidor = net.createServer((socket) => {
    const id = siguienteid++;
    clientes.set(id, socket);
    console.log(`Cliente conectado con id #${id} conectado a Aqui tu Aplicación (${clientes.size}) conectados en total`);
    socket.write(`Bienvenido al servidor, tu id es #${id}\n`);

    socket.on('data', (datos) =>{
        const mensaje = datos.toString().trim();
        console.log(`Cliente ${id} dice ${mensaje}`);
        socket.write(`Eco del servidor: ${mensaje}\n`);
    });

    socket.on('close', () =>{
        clientes.delete(id);
        console.log(`Cliente ${id} desconectado. (${clientes.size}) conectados en total`);
    });

});

servidor.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});