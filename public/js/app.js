// LOGICA DE LA APP. Está con JQuery, pero podemos usar Angular u otro framework

var url = window.location.href; // Con esto obtenemos todo el url
var swLocation = '/twittor/sw.js'; // Como lo vamos a desplegar en GitHubPages, no es el raid sino /twittor/
var swReg;
// Si existe SW, lo registramos
if ( navigator.serviceWorker ) {
    if ( url.includes('localhost') ) { // si es localhost estoy en desarrollo
        swLocation = '/sw.js';  // desde el raiz
    }

    // es buena practica hacer el registro una vez la pagina está cargada
    window.addEventListener('load', function() {
        navigator.serviceWorker.register( swLocation ).then( function(reg){
            swReg = reg; // le decimos que el registro es el del sw
            swReg.pushManager.getSubscription()  // quiero confirmar si estoy subscrito a las notificaciones o no
                .then( verificaSuscripcion ); // cualquier cosa !undefined, lanzaria la funcion que verifica la subscripcion de notificaciones
        });
    });
}


// Referencias de jQuery

var titulo      = $('#titulo');
var nuevoBtn    = $('#nuevo-btn');
var salirBtn    = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn     = $('#post-btn');
var avatarSel   = $('#seleccion');
var timeline    = $('#timeline');

var modal       = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns  = $('.seleccion-avatar');
var txtMensaje  = $('#txtMensaje');

var btnActivadas    = $('.btn-noti-activadas');
var btnDesactivadas = $('.btn-noti-desactivadas');

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;


// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje) {

    var content =`
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

}


// Globals
function logIn( ingreso ) {

    if ( ingreso ) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');

        titulo.text('Seleccione Personaje');
    }
}


// Seleccion de personaje
avatarBtns.on('click', function() {
    usuario = $(this).data('user');
    titulo.text('@' + usuario);
    logIn(true);
});

// Boton de salir
salirBtn.on('click', function() {
    logIn(false);
});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {
    modal.removeClass('oculto');
    modal.animate({ 
        marginTop: '-=1000px',
        opacity: 1
    }, 200 );
});


// Boton de cancelar mensaje
cancelarBtn.on('click', function() {
    if ( !modal.hasClass('oculto') ) {
        modal.animate({ 
            marginTop: '+=1000px',
            opacity: 0
         }, 200, function() {
             modal.addClass('oculto');
             txtMensaje.val('');
         });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function() {
    var mensaje = txtMensaje.val(); // cogemos el valor de la caja de texto
    if ( mensaje.length === 0 ) { // si no hay nada escrito, cancelamos
        cancelarBtn.click();
        return;
    }

    // para hacer un post, necesitamos un mensaje, y un usuario
    var data = {
        mensaje: mensaje,
        user: usuario
    };

    // Hacemos la peticion fetch - POST
    fetch('api', { // si no ponemos nada será GET, para POST necesitamos esta estructura
        method: 'POST', // tipo POST
        headers: { // Headers
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify( data ) // mandamos data en el body
    })
    .then( res => res.json() ) // then para manejar la respuesta
    .then( res => console.log( 'app.js', res )) // trazo la respuesta
    .catch( err => console.log( 'app.js error:', err )); // capturo errores en caso de que sucedan

    crearMensajeHTML( mensaje, usuario );
});



// Obtener mensajes del servidor
function getMensajes() {
    fetch('api')  // como está corriendo en el mismo hosting, basta con 'api'
        .then( res => res.json() ) // parseamos a json para obtener data
        .then( posts => {
            console.log(posts);
            posts.forEach( post => // iteramos los mensajes del post
                crearMensajeHTML( post.mensaje, post.user )); // mandamos los datos del mensaje al html
        });
}

// Llamamos a la funcion justo despues de ser declarada, para que la ejecute de inmediato y carge los mensajes
getMensajes();


// Detectar cambios de conexión - Si hay algun cambio de conexión lo mostraremos
function isOnline() {
    if ( navigator.onLine ) { // Primero preguntamos si tenemos conexion
        // tenemos conexión :)
        // console.log('online');
        $.mdtoast('Online', { // mostramos por pantalla un toast con ONLINE
            interaction: true,
            interactionTimeout: 1000, // se quitará en 1seg
            actionText: 'OK!'
        });
    } else{
        // No tenemos conexión :(
        $.mdtoast('Offline', { // mostramos por pantalla un toast con OFFLINE
            interaction: true,
            actionText: 'OK', 
            type: 'warning'
            // este mensaje no se ocultará hasta que el usuario pulse sobre OK
        });
    }
}

// EventLintener para estar escuchando los cambios de modo de conexion
window.addEventListener('online', isOnline );
window.addEventListener('offline', isOnline );

// Para estar seguros, lo lanzamos cuando se carga este archivo ;)
isOnline();


// NOTIFICACIONES PUSH

// Funcion que comprueba es estado de los permisos de push, si estan activadas y subcritas. Muestra los botones en funcion del estado
function verificaSuscripcion( activadas ) {
    console.log(activadas);
    if ( activadas ) {
        btnActivadas.removeClass('oculto'); // quitamos la clase de oculto para se se muestre este boton
        btnDesactivadas.addClass('oculto'); // ponemos la clase oculto para que este boton no se muestre
    } else {
        btnActivadas.addClass('oculto'); // ponemos la clase oculto para que este boton no se muestre
        btnDesactivadas.removeClass('oculto'); // quitamos la clase de oculto para se se muestre este boton
    }
}


function enviarNotificacion() {
    const notificationOpts = {
        body: 'Este es el cuerpo de la notificación', // texto mostrado
        icon: 'img/icons/icon-72x72.png' // icono mostrado
    };

    const n = new Notification('Hola Mundo', notificationOpts); // montamos la push con las options
    n.onclick = () => {
        console.log('Click');
    };
}


function notificarme() {
    if ( !window.Notification ) { // comprobamos si soportamos notificaciones
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    if ( Notification.permission === 'granted' ) { // Si se le ha otorgado el permiso de recibir push
        // new Notification('Hola Mundo! - granted');
        enviarNotificacion(); // llamamos a enviarNotificacion

    } else if ( Notification.permission !== 'denied' || Notification.permission === 'default' )  { // si no se ha negado o esta por defecto
        Notification.requestPermission( function( permission ) { // realizamos solicitud al usuario
            console.log( permission );
            if ( permission === 'granted' ) { // si aceptó notificaciones
                // new Notification('Hola Mundo! - pregunta');
                enviarNotificacion(); // llamamos a enviarNotificacionv
            }
        });
    }

}

// notificarme(); // PRUEBA PARA VER SI RECIBIMOS PUSH AL REFRESCAR LA PAGINA :)


// Get Key
function getPublicKey() {
    // fetch('api/key')
    //     .then( res => res.text())
    //     .then( console.log );
    return fetch('api/key')
        .then( res => res.arrayBuffer()) // no nos vale ese formato, tenemos que extraerlo como un arrayBuffer
        // returnar arreglo, pero como un Uint8array
        .then( key => new Uint8Array(key) ); // esto es lo que necesita la subscripción (esto es una fn de JS)
}

// getPublicKey().then( console.log ); // esto ya no va aqui, ahora se lanzará al hacer click en el boton de Notificaciones desactivadas

// Click en btnDesactivadas
btnDesactivadas.on( 'click', function() {
    if ( !swReg ) return console.log('No hay registro de SW'); // si no existe, poco podemos hacer, no hay SW
    getPublicKey().then( function( key ) { // si existe, obtenemos la llave pública
        swReg.pushManager.subscribe({
            userVisibleOnly: true, 
            applicationServerKey: key
        })
        .then( res => res.toJSON() ) // la respuesta la pasamos a json
        .then( suscripcion => {
            // console.log(suscripcion);
            fetch('api/subscribe', { // Cogemos la subscripcion y la pasamos al backend server
                method: 'POST', // Como es un POST, necesitamos especificar method, hearders y body
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( suscripcion )
            })
            .then( verificaSuscripcion ) // si todo es correcto, verificamos subscripcion
            .catch( cancelarSuscripcion ); // si no es correcto, la cancelamos
        });
    });
});



function cancelarSuscripcion() {
    swReg.pushManager.getSubscription().then( subs => { // hacemos referencia a las subscripciones de swReg
        subs.unsubscribe() // hacemos el unsubcribe
            .then( () =>  verificaSuscripcion(false) ); // cambiamos el boton de notificaciones
    });
}

// Cuando pulsamos en activas, las cambiamos el boton cancelando las subscripciones
btnActivadas.on( 'click', function() {
    cancelarSuscripcion();
});
