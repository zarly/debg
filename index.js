'use strict';

var fs = require('fs'),
    cp = require('child_process');

var debg = {};

/**
 * Аналог стандартного require, но при каждом запросе, если файл изменился - загружает новую версию. Очень удобно для отладки без перезапуска сервера.
 *
 * @param {string} addr
 * @returns {*}
 */
debg.live_require = function (addr) {
    var absoluteAddr = require.resolve(addr);
    delete require.cache[absoluteAddr];
    return require(absoluteAddr);
};

debg.stack = function () {
    return (new Error()).stack.split('\n').slice(2).map(function (o) {
        return o.substring(7);
    }).join('\n');
};

/**
 * Пишет простой лог в глобальный файл debg.log
 *
 * @param {string} text
 */
debg.log = function () {
    var text = Array.prototype.slice.call(arguments, 0).map(function (o) { return debg.dump(o); }).join(' ');

    var indent = '';
    for(var i=0; i<debg.log.indent; i++) {
        indent += debg.log.indent_text;
    }

    var date = new Date();
    var msec = date.getMilliseconds().toString();
    msec = (msec.length === 2) ? ('0' + msec) : (msec.length === 1) ? ('00' + msec) : msec;

    var appendix = '\n[pid=' + process.pid + ', ' + date.toLocaleTimeString() + '.' + msec + ']    ';

    var forWrite = appendix + indent + text.toString().replace(/(\n)/ig, appendix);
    fs.appendFileSync(debg.log.filename, forWrite);
};

/**
 * Размер отступа при логированиии
 *
 * @type {number}
 */
debg.log.indent = 0;

/**
 * Текст отступа при логировании
 * @type {string}
 */
debg.log.indent_text = ':   ';

debg.log.enter = function () {
    var res = debg.log.apply(this, arguments);
    debg.log.indent++;
    return res;
};

debg.log.exit = function () {
    debg.log.indent--;
    return debg.log.apply(this, arguments);
};

/**
 * Преобразует циклический объект в строку
 *
 * @param {*} obj
 * @returns {string}
 */
debg.dump = function (obj) {
    var res;
    var cache = [];
    try {
        if ('string' === typeof obj) {
            res = obj;
        } else if ('function' === typeof obj) {
            res = obj.toSource();
        } else {
            res = JSON.stringify.call(this, obj, function (key, value) {
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        return '[circular]';
                    }
                    cache.push(value);
                }
                return value;
            });
        }
    } catch (e) {
        res = '[error]';
    }
    return res;
};

/**
 * Отлаживать текущий процесс в node-inspector
 *
 * @param {string} text
 */
debg.make_debugable = function () {
    if (debg.make_debugable.isEnabled === true) {
        debg.log('Make debugable already enabled');
        return;
    } else {
        debg.log('Making debugable');
        debg.make_debugable.isEnabled = true;
    }

    cp.exec('kill -s USR1 ' + process.pid, function (error, stdout, stderr) {
        console.log('make_debugable kill', error, stdout, stderr);

        cp.exec('node-inspector --web-port 8090', function (error, stdout, stderr) {
            console.log('make_debugable inspector', error, stdout, stderr);

        });

        cp.exec('google-chrome http://127.0.0.1:8090/debug?port=5858', function (error, stdout, stderr) {
            console.log('make_debugable open', error, stdout, stderr);

        });
    });
};

/**
 * Адрес файла лога для функции log
 *
 * @type {string}
 */
debg.log.filename = process.cwd() + '/debg.log';

module.exports = debg;
