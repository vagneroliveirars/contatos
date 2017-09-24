var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var redis = require('redis');

var app = express();

var contato = {};

// Cria Cliente Redis
// Porta e hostname são retirados de configuration -> endpoint do redislabs.com
//var clienteRedis = redis.createClient();
// Porta e hostname são retirados de configuration -> endpoint do redislabs.com
var clienteRedis = redis.createClient(16828, 
	'redis-16828.c14.us-east-1-3.ec2.cloud.redislabs.com', 
	{no_ready_check: true});

clienteRedis.auth('password', function (err) {
    if (err) throw err;
});


clienteRedis.on('connect', function () {
    console.log('Servidor Redis Conectado ...');
});

// Configuração do Renderizador de Páginas (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Captura o caminho '/' na URL
app.get('/', function (req, res) {
    clienteRedis.hgetall('contato', function(err, contato) {
        if (contato) {
            res.render('contatos', {
                contato: contato         
            });
        } else {
            console.log("Contato vazio");
            res.render('contatos', {
                contato: {}         
            });
        }
    });
});

app.post('/contato/remover', function (req, res) {
    clienteRedis.del('contato', function(err, reply) {
        if (err) {
            console.log(err);    
        }
    });
    
    res.redirect('/');
});

app.post('/contato/salvar', function (req, res) {
    contato.nome = req.body.nome;
    contato.email = req.body.email;
    contato.telefone = req.body.telefone;

    clienteRedis.hmset('contato',
        ['nome', contato.nome,
            'email', contato.email,
            'telefone', contato.telefone],
        function (err, reply) {
            if (err) {
                console.log(err);
            }
            console.log(reply);
            res.redirect('/');
        });
});

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function () {
    console.log('Servidor Inicializado na porta', app.get('port'));
});

/*
app.listen(3000);
console.log('Servidor Inicializado na Porta 3000 ...',
    'URL: http://localhost:3000/');
*/

module.exports = app;