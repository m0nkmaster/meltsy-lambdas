var assert = require('assert')
var nock = require('nock')
var index = require('../index')

describe('Meltsy redirect', function(){
  describe('Calling Etsy API is correct', function(){
    beforeEach(function(){
      var scope = nock('https://openapi.etsy.com/v2')
        .post('/oauth/request_token?scope=transactions_r')
        .replyWithFile(200, __dirname + '/mocks/api/etsy-request-token')
    })

    //https://openapi.etsy.com/v2/oauth/request_token?scope=transactions_r

    it('should make the correct call to Etsy request token URI', (done) => {
      console.log('Tests running')

      index.handler(null,null,function(e,r){
        assert.true(scope.isDone());
        done()
      })

    })
  })

})
