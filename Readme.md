# debg

Small tool for debugging

## Instalation

```
npm install debg
```

## Usage

```js

var debg = require('debg');

debg.live_require('module_name'); // require module without caching

debg.stack(); // Get stack trace

debg.log('some argument', {'some': 'argument'}); // Write log in file debg.log

debg.make_debugable(); // run node_inspector and google-chrome

```
