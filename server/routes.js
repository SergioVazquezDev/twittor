// Routes.js - Módulo de rutas
const express = require('express');
const router = express.Router();
const push = require('./push'); // importamos el fichero push

const mensajes = [
  {
    _id: 'XXX',
    user: 'spiderman',
    mensaje: 'Hola Mundo'
  }
];


// Get mensajes
router.get('/', function (req, res) {
  // res.json('Obteniendo mensajes');
  res.json( mensajes );
});


// Post mensaje
router.post('/', function (req, res) {
  const mensaje = {
    mensaje: req.body.mensaje,
    user: req.body.user
  };

  mensajes.push( mensaje );

  // PODRIAMOS LLAMAR A SENDPUSH DESDE AQUI PARA 
  // NOTIFICAR A TODOS QUE SE AÑADIO UN NUEVO MENSAJE

  console.log(mensajes);
  res.json({
    ok: true,
    mensaje // mensaje: mensaje
  });
});


// Almacenar la suscripción /subscribe 
// (esta persona se subscribio y este es su dispositivo)
router.post('/subscribe', (req, res) => {
  const suscripcion = req.body;
  console.log(suscripcion);
  
  push.addSubscription( suscripcion ); // este metodo recibe la subscripción
  res.json('subscribe');
});

// Almacenar la suscripción /key publico 
// (mandamos el key publico a los clientes, para que estos lo procesen y mandarnos despues la subscripcion)
router.get('/key', (req, res) => {
  const key = push.getKey(); // para no mezclar las push con las keys, lo sacamos al fichero push.js
  res.send(key); // no es res.json(key), con send, ya que no es un json, sino un arrayBuffer
});


// Envar una notificación PUSH a las personas que nosotros queramos
// (nos permitira mandar mensajes a las personas que queramos mediante Postman)
// Normalmente esto no se maneja como un REST, ES ALGO que se controla del lado del server
router.post('/push', (req, res) => {
  // Cuando llamemos al servicio push, extraemos la informacion que viene en el post
  const post = {
    titulo: req.body.titulo,
    cuerpo: req.body.cuerpo,
    usuario: req.body.usuario
  };

  push.sendPush( post ); // llamamos a sendPush enviando los datos del post
  res.json( post );
});


module.exports = router;