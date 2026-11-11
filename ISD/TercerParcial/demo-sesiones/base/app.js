// La aplicación de la demo. server.js la arranca; las pruebas la arrancan con otras configuraciones.
// Lo que dice "(en clase)" lo programamos juntos, paso por paso. Mientras no esté, esa ruta responde 501.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');

const NOMBRE_COOKIE = 'connect.sid';

//Tenemos que determinar donde se deben de almacenar las sesiones para la aplicación si es LocalStorage, utilizamos MemoryStore (sigfnica que se guarda en navegador) y si la queremos guardar en MSQL debemos de obtenerla y mantenerla durante su ciclo de vida

function todasLasSesiones(almacen){
  return new Promise((resolve, reject)=>{
    const promesa = almacen.all((error, sesiones)=> (error ? reject(error) : resolve(sesiones)));
    if (promesa && typeof promesa.then === 'function') promesa.then(resolve, reject);
  });
}

//vamos a conectarnos a la aplicacion
function crearApp(config, pool){
  const app = express();
  app.use(express.json());
  const usuarios = crearModeloUsuarios(pool);

  //necesito crear una sesión a partir del tipo, rol y privilegio del usuario
  //opcion 1 manejorlo desde mysql, significa que debo de tener una tabla de sesiones
  //opcion 2 manejorlo desde memoria 

  const almacen = config.almacen === 'memoria'
    ? new session.MemoryStore()
    : new MySQLStore({ createDatabaseTable: false, clearExpired: false }, pool);
  app.locals.almacen = almacen;
  
  //conocer el id de la sesión
  const idCorto = (id) => (id ? `${id.slice(0, 8)}...` : null);

  //en el uso de middleware como existe el intercambio de la sesion para tener un seguimiento del usuario, rol, privilegio, etc, se utiliza el atributo roling para poder extener su uso

  function requiereSesion(req, res, next){
    return pendiente(1)(req, res, next);
  }

  function requiereRol(rol){
    return pendiente(3);
  }

  app.get('/api/config', (req, res) => res.json(config));

  //vamos a generar un contador en la sesion, sirve para saver que la sesion existe antes de entrar
  app.post('/api/visita', (req, res) =>{
    if(!req.session) return pendiente(1)(req, res);
    req.session.visitas = (req.session.visitas || 0)+1;
    res.json({visitas : req.session.visitas, sesion : idCorto(req.sessionID)});
  });

  //ruta para iniciar sesion
  app.post('/api/login', pendiente(2));

  //ruta para cerrar sesion 
  app.get('/api/sesion', pendiente(2));

  app.get('/api/sesion', requiereSesion, (req, res) =>{
    const desde = config.rolling ? req.session.ultimoUso : req.session.creada;
    res.json({
      usuario : req.session.usuario,
      sesion : idCorto(req.sessionID),
      expiraEnSegundos : Math.max(0, Math.round((desde + config.maxAgeMs - Date.now())/1000)),
    });
  });

  app.get('/api/perfil', requiereSesion, (req, res)=>{
    req.session.visitas = (req.session.visitas || 0)+1;
    res.json({mensaje : `Hola ${req.session.usuario.nombre}`, rol : req.session.usuario.rol, visitas: req.session.visitas});
  });

  app.get('/api/admin/reporte', requiereSesion, requiereRol('admin'), (req, res)=>{
    res.json({reporte : 'Talleres para administrador'});
  });
}
