// imports en este orden: BD, sw-bd, sw-util (siempre se usa el anterior, para usarse, tiene que estar declarado ;) )
importScripts('https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js') // import pouchdb

importScripts('js/sw-db.js');
importScripts('js/sw-utils.js'); // importamos sw-utils.js (appShell)

// Declaramos las constantes para el manejo de cache
const STATIC_CACHE    = 'static-v2';
const DYNAMIC_CACHE   = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';

// Declaramos nuestro AppShell (todo lo necesario para mi aplicación)
const APP_SHELL = [
    '/',  // '/', // esto va a servir en desarrollo, pero no en PROD
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js', // aqui está el core de mi aplicacion
    'js/sw-utils.js', // utils con funciones para el sw
    'js/libs/plugins/mdtoast.min.js', // js para el toast de online / offline
    'js/libs/plugins/mdtoast.min.css' // css para el toast de online / offline
];

// Aqui estarían las fuentes y librerias de terceros (todo lo que no se va a modificar)
const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css', // fontawesome
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js' // referencia al pouchdb
];



self.addEventListener('install', e => {
    // abrimos el cache static y añadimos todo el array
    const cacheStatic = caches.open( STATIC_CACHE ).then(cache => 
        cache.addAll( APP_SHELL )); // añadimos el arreglo de static

    // hacemos lo mismo para el cache inmutable
    const cacheInmutable = caches.open( INMUTABLE_CACHE ).then(cache => 
        cache.addAll( APP_SHELL_INMUTABLE )); // añadimos el arreglo de inmutable  

    e.waitUntil( Promise.all([ cacheStatic, cacheInmutable ])  );
});


self.addEventListener('activate', e => {
    // Controlamos las versiones de los cachés para eliminar versiones anteriores
    const respuesta = caches.keys().then( keys => {

        keys.forEach( key => {
            // control de versiones del static cache
            if (  key !== STATIC_CACHE && key.includes('static') ) {
                return caches.delete(key);
            }
            // control de versiones del dynamic cache
            if (  key !== DYNAMIC_CACHE && key.includes('dynamic') ) {
                return caches.delete(key);
            }
        });
    });

    e.waitUntil( respuesta );
});


// Implementaremos la estrategia del dynamic cache (cache with network update)
// Despues de que recibimos la información del cache la respondemos y tendremos esa respuesta al Client.
// A su vez, actualizamos la cache
// Las fuentes de google, y fontawesome se dercargan mediante una primera peticion. 
// Si no guardo en cache dichas peticiones, tendré un error. Las guardaremos en cache dinamico
self.addEventListener( 'fetch', e => {
    let respuesta;
    // Para las peticiones a nuestra API, vamos a configurar la estrategia Network with cache fallback
    // NO QUEREMOS TENER LA VERSION ANTERIOR EN ESTE CASO, SINO LA MAS ACTUAL
    if ( e.request.url.includes('/api') ) { // Si es una peticion a nuestra api (/api, para forzar la url y no el nombre)
        respuesta = manejoApiMensajes( DYNAMIC_CACHE, e.request ); // delegamos en esta funcion, y el resultado lo seteamos en la respuesta a retornar
    } else {
        respuesta = caches.match( e.request ).then( res => {
            if ( res ) {
                // Llamamos a la funcion que hicimos en sw-utils.js
                actualizaCacheStatico( STATIC_CACHE, e.request, APP_SHELL_INMUTABLE );
                return res;
            } else {
                return fetch( e.request ).then( newRes => {
                    return actualizaCacheDinamico( DYNAMIC_CACHE, e.request, newRes );
                });
            }
        });
    }

    e.respondWith( respuesta );
});


// GESTION DE TAREAS ASINCRONAS
self.addEventListener('sync', e => { // así establecemos una tarea asincrona
    console.log('SW: Sync');
    // Si tenemos varias tareas asincronas, podemos hacer un switch, en este caso, como solo hay una, la controlamos con if
    if ( e.tag === 'nuevo-post' ) { // si la accion es 'nuevo-post'
        // postear a BD cuando hay conexión
        const respuesta = postearMensajes();
        e.waitUntil( respuesta ); // se tiene que esperar a que todos los posteos terminen
    }
});

// ESCUCHAR PUSH (para recibir las push, debemos estar escuchandolas XD)
self.addEventListener('push', e => {
    // console.log(e);
    const data = JSON.parse( e.data.text() );
    // console.log(data);
    const title = data.titulo; // extraemos el titulo
    const options = { // opciones de las push
        body: data.cuerpo, // extraemos el body (que viene en el cuerpo)
        // icon: 'img/icons/icon-72x72.png',
        icon: `img/avatars/${ data.usuario }.jpg`, // añadimos el avatar del heroe (usuario) que lo envía -> usuario = 'thor'
        badge: 'img/favicon.ico', // iconito que acompaña a la push
        image: 'https://vignette.wikia.nocookie.net/marvelcinematicuniverse/images/5/5b/Torre_de_los_Avengers.png/revision/latest?cb=20150626220613&path-prefix=es', // imagen a torre de Avengers
        vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500], // Vibra como Star Wars Imperial March - (https://gearside.com/custom-vibration-patterns-mobile-devices/)
        openUrl: '/', // direccion que queremos que abra al clicar sobre la push
        data: { // aqui podemos poner lo que queramos (cajon de data personalizado)
            // url: 'https://google.com',
            url: '/', // redirigirá a la raiz de la aplicacion
            id: data.usuario
        },
        actions: [ // botones con acciones bajo la notificacion 
            {
                action: 'thor-action', // cualquier tipo de accion (eliminar, crear...)
                title: 'Thor', // lo que aparecerá en el boton
                icon: 'img/avatar/thor.jpg' // icono
            },
            {
                action: 'ironman-action',
                title: 'Ironman',
                icon: 'img/avatar/ironman.jpg'
            }
        ]
    };

    e.waitUntil( self.registration.showNotification( title, options) ); // necesito esperar a que termine el registro del sw
});

// Eventlistener importantes relacionados con las notificaciones

// Al cerrar la notificacion
self.addEventListener('notificationclose', e => {
    console.log('Notificación cerrada', e);
});

// Al hacer click sobre la notificacion
self.addEventListener('notificationclick', e => {
    const notificacion = e.notification;
    const accion = e.action;

    console.log({ notificacion, accion });
    // console.log(notificacion);
    // console.log(accion);
    
    const respuesta = clients.matchAll() // capturamos todos los tabs abiertos de nuestra app
    .then( clientes => {
        let cliente = clientes.find( c => {
            return c.visibilityState === 'visible'; // veo si ese cliente está visible
        });

        if ( cliente !== undefined ) { // si encontré el visible
            cliente.navigate( notificacion.data.url ); // navego a ese tab
            cliente.focus(); // pongo el foco de ese tab en el navegador
        } else {
            clients.openWindow( notificacion.data.url ); // si no tengo ninguno, abrimos la raiz en un nuevo tabs
        }
        return notificacion.close(); // esto cierra la notificacion y hace que desaparezca de la barra de notificaciones
    });

    e.waitUntil( respuesta ); // espero a que todo termine
});
