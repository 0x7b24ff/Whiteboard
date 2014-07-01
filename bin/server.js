// server.js
//
var fs = require('fs'),
    path = require('path'),
    url = require('url')
;

var webPath = path.resolve( __dirname + '/../web' ) + '/',
    argv = process.argv.slice( 2 ),
    serverPort = ( isNaN( +argv[0] ) ? 8194 : +argv[0] )
;

var server = require('http').createServer(
        function ( req, rsp ) {

            var pathname = url.parse( req.url, true ).pathname,
                pathname = ( pathname[0] === '/' ? pathname.substr( 1 ) : pathname ),
                pathname = ( ! pathname || pathname === '/' ? 'index.html' : pathname ),
                file = webPath + pathname
            ;

            if ( fs.existsSync( file ) &&
                fs.statSync( file ).isFile()
            ) {
                fs.createReadStream( file ).pipe( rsp );
                return;
            }

            rsp.writeHead( 404 );
            rsp.end();

        }
    )
;

server.listen( serverPort );

var io = require('socket.io').listen( server );

io.set('log level', 2 );

var cache = [];

io.sockets.on('connection', function ( socket ) {

    socket.emit('publish', {
        from: {
            ch: 0,
            line: 0
        },
        to: {
            ch: 0,
            line: 0
        },
        text: [
            cache.join('\n')
        ],
        removed: [ '' ]
    });

    socket.on('report', function ( data ) {

        var startLine = data.from.line,
            endLine = data.to.line,
            buffer = cache
                .slice( startLine, endLine + 1 )
                .join('\n'),
            startChar = data.from.ch,
            endChar = data.to.ch,
            newText = data.text
                .join('\n'),
            newLines = (
                    buffer.substring( 0, startChar ) +
                    newText +
                    buffer.substring(
                        endLine > startLine ?
                        buffer.lastIndexOf('\n') + 1 + endChar :
                        endChar
                    )
                ).split('\n'),
            args = [
                    startLine,
                    endLine - startLine + 1
                ].concat( newLines )
        ;

        Array.prototype.splice.apply( cache, args );

        socket.broadcast.emit('publish', data );

    });

});

console.log('Whiteboard server started on port %d', serverPort );
