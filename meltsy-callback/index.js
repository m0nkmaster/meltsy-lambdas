var oauth = require('oauth')
var AWS = require('aws-sdk')
var config = require('./config/etsy.json')

// Ensure AWS is requesting the nearest region
AWS.config.update({
  region: 'eu-west-1'
})

//Setup oauth
var api = new oauth.OAuth(
  'https://openapi.etsy.com/v2/oauth/request_token?scope=transactions_r',
  'https://openapi.etsy.com/v2/oauth/access_token',
  config.consumerkey,
  config.consumersecret,
  '1.0A',
  null,
  'HMAC-SHA1'
)

// the function that will be executed by Lambda
exports.handler = function (event, context) {

  // retrieve temp secret from Dynamo
  var db = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: 'meltsy-oauth',
    Key : {
      Id: 'meltsy'
    }
  }

  db.get(params, function (err, data) {
    if (err) {
      console.error('Unable to query. Error:', JSON.stringify(err, null, 2))
      context.succeed([err,{msg:"Unable to query"}])
    } else {
      console.log('DB Ok:', JSON.stringify(data))

      // all necessary tokens found, so request for "permanent" access token
      //getOAuthAccessToken= function(oauth_token, oauth_token_secret, oauth_verifier,  callback)
      api.getOAuthAccessToken(event.oauth_token, data.Item.secret, event.oauth_verifier, function (error, oauthToken, oauthTokenSecret, results) {
        if (error) {
          console.log('Access token fail:', error)
          context.succeed(error)
        } else {
          // Store permanent access_token and secret in DynamoDB
          var updateParams = {
            TableName: 'meltsy-oauth',
            Item: {
              Id: 'meltsy',
              authToken: oauthToken,
              authSecret: oauthTokenSecret,
              oauthtoken: event.oauth_token,
              verifier: event.oauth_verifier
            }
          }
          db.put(updateParams, function (err2, data) {
            if (err2) {
              context.succeed(err2)
            } else {
              context.succeed({message:"successfully retrieved and saved access tokens"})
            }
          })
        }
      })
    }
  })
}
