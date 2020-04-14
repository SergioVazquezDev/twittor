# Twittor

_Un cascarón de chat usando PWAs - Realizado para el curso de PWA_

Mira **Deployment** para conocer como desplegar el proyecto.


### Pre-requisitos 📋

_Que cosas necesitas para instalar el software y como instalarlas_

```
NPM
```

```
Node.js
```


### Instalación 🔧

La carpeta server contiene un pequeño servidor de express listo para ejecutarse y servir la carpeta public en la web.

_Para configurar el entorno de desarrollo local, debes ejecutar:_

_Instalación de dependencias de node_

```
npm install
```

_Despliegue de servidor node en desarrollo_

```
npm run dev
```

_Podemos acceder a nuestro despliegue en local, accedemos a localhost:3000_

_Despliegue de servidor node en producción_

```
npm start
```

## Generacion de keys para notificaciones Push 📌

Usamos [web-push](https://www.npmjs.com/package/web-push) para la generacion de llave públic y privada. 

Para generar un nuevo fichero de claves, debemos ejecutar el comando:

```
npm run generate-vapid
```
_Se generará el fichero vapid.json con la clave privada y pública_

Usamos [urlsafe-base64](https://www.npmjs.com/package/urlsafe-base64) para cifrar la public Key.

## Despliegue 📦

_Para desplegarlo de manera local, necesitamos lanzar en consola el siguente comando:_

```
npm run dev
```
_Podemos acceder a nuestro despliegue en local, accedemos a localhost:3000_


## Despliegue publico en GithubPages - DEMO

[DEMO](https://sergiovazquezdev.github.io/twittor/)