const express = require('express');
const bodyParser = require('body-parser'); // dependencia necesaria para que node pueda leer lo que vamos a postear en el body
const path = require('path');

const app = express();

const publicPath = path.resolve(__dirname, '../public');
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); // support json encoded bodies (leemos el body y lo pasamos a json)
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


// Enable CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});



// Directorio Público
app.use(express.static(publicPath));

// Rutas 
const routes = require('./routes');
app.use('/api', routes ); // Pasa probar desde postman, GET localhost:3000/api


app.listen(port, (err) => {
    if (err) throw new Error(err);
    console.log(`Servidor corriendo en puerto ${ port }`);
});