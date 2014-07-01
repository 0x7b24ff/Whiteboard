// app.js

(function () {

    var // CodeMirror modes
        modes = [
            { name: 'GitHub Flavored Markdown', mime: 'text/x-gfm', mode: 'gfm' },
            { name: 'C/C++', mime: 'text/x-csrc', mode: 'clike' },
            { name: 'CSS', mime: 'text/css', mode: 'css' },
            { name: 'diff', mime: 'text/x-diff', mode: 'diff' },
            { name: 'Go', mime: 'text/x-go', mode: 'go' },
            { name: 'HTML', mime: 'text/html', mode: 'htmlmixed' },
            { name: 'HTTP', mime: 'message/http', mode: 'http' },
            { name: 'JavaScript', mime: 'text/javascript', mode: 'javascript' },
            { name: 'LESS', mime: 'text/x-less', mode: 'less' },
            { name: 'Lua', mime: 'text/x-lua', mode: 'lua' },
            { name: 'Markdown', mime: 'text/x-markdown', mode: 'markdown' },
            { name: 'Nginx', mime: 'text/x-nginx-conf', mode: 'nginx' },
            { name: 'PHP', mime: 'text/x-php', mode: 'php' },
            { name: 'Plain Text', mime: 'text/plain', mode: 'null' },
            { name: 'Python', mime: 'text/x-python', mode: 'python' },
            { name: 'Shell', mime: 'text/x-sh', mode: 'shell' },
            { name: 'SQL', mime: 'text/x-sql', mode: 'sql' },
            { name: 'XML', mime: 'application/xml', mode: 'xml' },
            { name: 'YAML', mime: 'text/x-yaml', mode: 'yaml' }
        ],
        // CodeMirror themes
        themes = [
            'default',
            '3024-day',
            '3024-night',
            'ambiance-mobile',
            'ambiance',
            'base16-dark',
            'base16-light',
            'blackboard',
            'cobalt',
            'eclipse',
            'elegant',
            'erlang-dark',
            'lesser-dark',
            'mbo',
            'midnight',
            'monokai',
            'neat',
            'night',
            'paraiso-dark',
            'paraiso-light',
            'rubyblue',
            'solarized',
            'the-matrix',
            'tomorrow-night-eighties',
            'twilight',
            'vibrant-ink',
            'xq-dark',
            'xq-light'
        ],
        // State: Changing
        _changing = false
    ;

    // UI

    $(document).on('focus', 'a, button', function () {
        $(this).blur();
    });

    $(document).on('keypress', function (event ) {

        if ( !( event.which === 115 && event.ctrlKey ) &&
            event.which !== 19
        ) {
            return true;
        }

        event.preventDefault();
        return false;

    });

    // Mode list

    for ( var i = 0; i < modes.length; i++ ) {
        $('#mode-list').append(
            '<li><a href="javascript:;" data-value="' + modes[i].mode + '">' + modes[i].name + '</a></li>'
        );
    }

    $('#mode-list > li:first').addClass('active');

    $('#mode-list > li > a').on('click', function () {
        window.editor.setOption('mode', $(this).attr('data-value') );
        $('#mode-list > li').removeClass('active');
        $(this).parent().addClass('active');
    });

    // Theme list

    for ( var i = 0; i < themes.length; i++ ) {
        $('#theme-list').append(
            '<li><a href="javascript:;" data-value="' + themes[i] + '">' + themes[i] + '</a></li>'
        );
    }

    $('#theme-list > li:first').addClass('active');

    $('#theme-list > li > a').on('click', function () {
        window.editor.setOption('theme', $(this).attr('data-value') );
        $('#theme-list > li').removeClass('active');
        $(this).parent().addClass('active');
    });

    // Editor

    window.editor = CodeMirror.fromTextArea(
        document.getElementById('content'),
        {
            mode: 'gfm',
            theme: 'default',
            indentUnit: 4,
            indentWithTabs: true,
            lineNumbers: true,
            undoDepth: 100,
            autofocus: true
        }
    );

    window.editor.on('change', function ( editor, obj ) {

        editor.setSize('100%', ( editor.lineCount() + 1 ) * editor.defaultTextHeight() );

        if ( _changing ) {
            return;
        }

        obj.sid = window.sid;
        window.socket.emit('report', obj );

    });

    // Socket.IO

    window.socket = io.connect('http://' + window.location.host );

    window.socket.on('connect', function () {
        window.sid = window.socket.socket.sessionid;
    });

    window.socket.on('publish', function ( data ) {
        if ( data.sid !== window.sid ) {
            change( data );
        }
    });

    // Data change

    function change( obj ) {

        _changing = true;
        window.editor.replaceRange( obj.text.join('\n'), obj.from, obj.to );
        _changing = false;

        if ( obj.next ) {
            change( obj.next );
        }

    }

})();
