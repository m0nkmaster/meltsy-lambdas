'use strict';
console.log('Loading event');

var index = require('./index')

index.handler(null,null,function(e,r){

  console.log(JSON.stringify(r))

})
