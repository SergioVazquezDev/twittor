// imports
importScripts('js/sw-utils.js'); // importamos sw-utils.js (appShell)

// Declaramos las constantes para el manejo de cache
const STATIC_CACHE    = 'static-v5';
const DYNAMIC_CACHE   = 'dynamic-v3';
const INMUTABLE_CACHE = 'inmutable-v1';

// Declaramos nuestro AppShell (todo lo necesario para mi aplicación)
const APP_SHELL = [
    // '/', // esto va a servir en desarrollo, pero no en PROD
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js', // aqui está el core de mi aplicacion
    'js/sw-utils.js' // utils con funciones para el sw
];

// Aqui estarían las fuentes y librerias de terceros (todo lo que no se va a modificar)
const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
    'css/animate.css',
    'js/libs/jquery.js'
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


// Implementaremos la estrategia del dynamic cache (cache with network fallback)
// Las fuentes de google, y fontawesome se dercargan mediante una primera peticion. 
// Si no guardo en cache dichas peticiones, tendré un error. Las guardaremos en cache dinamico
self.addEventListener( 'fetch', e => {
    const respuesta = caches.match( e.request ).then( res => {
        if ( res ) {
            return res;
        } else {
            return fetch( e.request ).then( newRes => {
                // Llamamos a la funcion que hicimos en sw-utils.js
                return actualizaCacheDinamico( DYNAMIC_CACHE, e.request, newRes );
            });
        }
    });

    e.respondWith( respuesta );
});


