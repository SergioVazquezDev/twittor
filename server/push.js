//web-push nos va a permitir poder generar rapidamente las keys para poder enviar las push

const fs = require('fs'); // nor permite grabar y crear archivos de texto

const urlsafeBase64 = require('urlsafe-base64'); // libreria para el cifrado de key
const vapid = require('./vapid.json'); // leemos el vapid.json (donde estás las keys)

const webpush = require('web-push'); // añadimos el paquete de web-push

// Configuracion de web-push
webpush.setVapidDetails(
    'mailto:sergio.vazquez.dev@gmail.com',
    vapid.publicKey,
    vapid.privateKey
  );


// Cuando esté en PROD, habria que cambiar este fichero, por guardarlo en BBDD
let suscripciones = require('./subs-db.json'); // arreglo de subscripciones que persistiremos cuando se inicia es servidor, están en este fichero para persistencia (que no se pierda al refrescar)

module.exports.getKey = () => { // modulo que retorna la publicKey del fichero de keys
    return urlsafeBase64.decode( vapid.publicKey ); // ciframos antes de enviar, para enviar cifrada
};

module.exports.addSubscription = ( suscripcion ) => {
    suscripciones.push( suscripcion ); // añadimos la subscripcion
    // cada vez que reciba una subscripcion, la amacenamos en ese archivo, sobreescribiendo el archivo subs-db.json
    fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) ); // grabamos el archivo con nuestras subscripciones
};

// Mandando informacion a traves del push a todas las subscripciones que tenga aqui
module.exports.sendPush = ( post ) => {
    console.log('Mandando PUSHES');
    const notificacionesEnviadas = [];

    suscripciones.forEach( (suscripcion, i) => {
        const pushProm = webpush.sendNotification( suscripcion , JSON.stringify( post ) ) // Mandando la informacion como tal
            .then( console.log( 'Notificacion enviada ') )
            .catch( err => { // gestionar las subscripciones viejas
                console.log('Notificación falló');
                if ( err.statusCode === 410 ) { // GONE, ya no existe
                    suscripciones[i].borrar = true; // asignamos borrar a true la que ya no existe -> no borramos aqui la subscripcion que, estamos iterando ahora!!!
                }
            });
        notificacionesEnviadas.push( pushProm );
    });

    // Una vez que todas las notificaciones terminen, borramos las que ya no interesan
    Promise.all( notificacionesEnviadas ).then( () => {
        suscripciones = suscripciones.filter( subs => !subs.borrar ); // nos quedamos con todas las que no tienen el borrar a true
        fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) ); // reescribimos el fichero con las que no habia que borrar
    });
}

