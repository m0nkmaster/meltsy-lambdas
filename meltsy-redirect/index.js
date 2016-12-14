// define libraries you would need
var oauth = require('oauth')
var AWS = require('aws-sdk')
var cuid = require('cuid')
var fs = require('fs')
var config = require('./config/etsy.json')

// ensure AWS is requesting the nearest region
AWS.config.update({
  region: 'eu-west-1'
})
// the function that will be executed by Lambda
exports.handler = function (event, context) {
  // define unique token to identify callback data for which user it is ment
  var idToken = cuid();

  // NOTE: we use your api key as the OAuth consumer key, and your api key's shared secret as the consumer shared secret.

  // define OAuth signature
  var api = new oauth.OAuth(
    'https://openapi.etsy.com/v2/oauth/request_token?scope=transactions_r',
    'https://openapi.etsy.com/v2/oauth/access_token',
    config.consumerkey,
    config.consumersecret,
    '1.0A',
    'https://coyliwulzk.execute-api.eu-west-1.amazonaws.com/prod/oauth-callback',
    'HMAC-SHA1'
  )

  // get request token and redirect users to that URL
  api.getOAuthRequestToken(function (error, oauthToken, oauthTokenSecret, result) {
    if (error) {
      console.log(error)
      //context.fail(error)
    } else {

      // console.log(result)
      // store tokens to be able to map the data correctly
      var db = new AWS.DynamoDB.DocumentClient();
      var params = {
        TableName: 'meltsy-oauth',
        Item: {
          Id: 'meltsy',
          oauthtoken: oauthToken,
          secret: oauthTokenSecret,
          idToken: idToken
        }
      }

      // save tokens to use with the callback
      db.put(params, function (err, data) {
        if (err) {
          console.log('Unable to add item. Error JSON:', JSON.stringify(err, null, 2))
          context.fail(err)
        } else {
          console.log('Added item:', JSON.stringify(data, null, 2), oauthToken)
          // redirect user to correct URL to acknowledge the new share settings
          context.succeed({
            location: result.login_url
          })
        }
      })
    }
  })
}
