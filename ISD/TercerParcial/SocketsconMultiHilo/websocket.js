const path = require('path');
const http = require('http');
const fs = require('fs');
const readline = require('readline');
const {WebSocketServer} = require('ws');

const PUERTO = 7000;

const servidorHttp = http.createServer((req, res) => {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
        if (err){
            return res.end('No se pudo cargar el archivo index.html');
        }
        res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
        res.end(data);
    });
});

const wss = new WebSocketServer({server: servidorHttp});
const clientes = new Set();

wss.on('connection', (socket) => {
    clientes.add(socket);
    console.log(`Cliente conectado. Total de clientes: ${clientes.size}`);

    socket.on('close', () => {
        clientes.delete(socket);
        console.log(`Cliente desconectado. Total de clientes: ${clientes.size}`);
    });
});

//vamos a crear una multidifucion bajo el mismo nombre 
function broadcast(mensaje){
    console.log(`[broadcast] Enviado desde : ${clientes.size} a cliente(s): ${mensaje}`);   
    const payload = JSON.stringify({tipo: 'cupo_lleno', mensaje, fecha: new Date().toISOString()});
    for (const socket of clientes){
        if(socket.readyState === socket.OPEN){
            socket.send(payload);
        }
    }
}


servidorHttp.listen(PUERTO, () => {
    console.log(`Servidor escuchando en el puerto ${PUERTO}`);
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
}); 

rl.on('line', (linea) => {
    const [comando, ...resto] = linea.trim().split(' ');
    if (comando === 'lleno'){
        const taller = resto.join(' ');
        broadcast(`El taller ${taller} está lleno`);
    }   
});

    