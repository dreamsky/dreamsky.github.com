/*
 * websocket server
 */

var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs')

    app.listen(8088);

function handler(req, res) {
    fs.readFile(__dirname + '/s.html',
        function(err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading s.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

var connected = 0;

io.sockets.on('connection', function(socket) {
    console.log('opened connection:' + socket.id);
    connected++;

    socket.broadcast.emit('count', {connect_count: connected});

    socket.on('message', function(data) {
        socket.broadcast.emit('message', data);
    });

    socket.on('disconnect', function(){
        io.sockets.emit('user disconnected.........');
    });

});