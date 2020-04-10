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

