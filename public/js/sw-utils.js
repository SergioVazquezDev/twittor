// Fichero de utilidades para el SW

// Funcion para guardar  en el cache dinamico
function actualizaCacheDinamico( dynamicCache, req, res ) {
    if ( res.ok ) {
        return caches.open( dynamicCache ).then( cache => {
            cache.put( req, res.clone() );
            return res.clone();
        });
    } else { // Si no viene nada, no hay mucho que hacer, ya que fallo la cache y la red (retornamos lo que venga)
        return res;
    }
}

// Cache with network update
function actualizaCacheStatico( staticCache, req, APP_SHELL_INMUTABLE ) {
    if ( APP_SHELL_INMUTABLE.includes(req.url) ) {
        // No hace falta actualizar el inmutable
        // console.log('existe en inmutable', req.url );
    } else {
        // console.log('actualizando', req.url );
        return fetch( req )
                .then( res => {
                    return actualizaCacheDinamico( staticCache, req, res );
                });
    }
}


// Network with cache fallback / update
function manejoApiMensajes( cacheName, req ) { // tenemos que saber el tipo de cache y la respuesta
    // si viene algo del key o del subcribe...
    if ( (req.url.indexOf('/api/key') >= 0 ) || req.url.indexOf('/api/subscribe') >= 0 ) {
        return fetch( req ); // retornamos la misma peticion, no queremos copia local, esto debe pasar directo a la red
        // OJO!!! Como el cache no maneja el POST, tendremos que manejarlo nosotros
    } else if ( req.clone().method === 'POST' ) { // Si es POST (clonar siempre para evitar que nos diga que ya fue usado)
        // POSTEO de un nuevo mensaje
        if ( self.registration.sync ) { // evaluamos si el sw/navegador dispone de las tareas asincronas
            return req.clone().text().then( body =>{ // OJO que retornamos toda la promesa :)
                // console.log(body);
                const bodyObj = JSON.parse( body ); // parsemos el stream a objeto
                return guardarMensaje( bodyObj ); // guardamos en pouchDB
            });
        } else { // si no lo puedo grabar como tarea async dejo pasar el POST tal como esta, y que la aplicacion lo diga 
            return fetch( req );
        }
    } else {
        return fetch( req ).then( res => { // trata de traer los mensajes más actualizados
            if ( res.ok ) { // si lo hizo OK
                actualizaCacheDinamico( cacheName, req, res.clone() ); // Actualizamos el cache Dinamico
                return res.clone(); // Retornamos con clone por si usamos las res mas adelante
            } else {
                return caches.match( req ); // retornamos lo que tengamos almacenado en cache
            }
        }).catch( err => { // si no tengo conexion a internet
            return caches.match( req ); // retornamos lo que tengamos almacenado en cache
        });
    }
}
