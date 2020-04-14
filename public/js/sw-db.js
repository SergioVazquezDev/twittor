// Utilidades para grabar PouchDB
const db = new PouchDB('mensajes'); // instancia de nuestra BBDD Mensajes

function guardarMensaje( mensaje ) {
    mensaje._id = new Date().toISOString(); // recordemos que necesitamos un id ;)
    return db.put( mensaje ).then( () => { // guardar en BBDD - OJO que retornamos todo
        self.registration.sync.register('nuevo-post'); // registramos tarea asincrona (hay algo que tienes que hacer cuando tengas internet)
        // Creamos una nueva respuesta ficticia, indicando que se grabó en modo offline
        const newResp = { ok: true, offline: true };
        return new Response( JSON.stringify(newResp) ); // retornamos la nueva respuesta al frontend
    });
}


// Postear mensajes a la API
function postearMensajes() {
    const posteos = []; // coleccion de promesas de posteos pendientes
    return db.allDocs({ include_docs: true }).then( docs => { // Primero debemos barrer todos los docs que tengamos en la BBDD local
        docs.rows.forEach( row => { // Iteramos los documentos de cada row
            const doc = row.doc;
            const fetchPom =  fetch('api', { // disparamos el Fetch como metodo POST
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify( doc )
                }).then( res => {
                    return db.remove( doc ); // si fue exitoso, lo borramos de la BBDD
                });
            posteos.push( fetchPom ); // almecenamos fechPom dentro de todos los posteos
        }); // fin del foreach
        return Promise.all( posteos ); // esperamos a que todas las promesas terminen
    });
}

