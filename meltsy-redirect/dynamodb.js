var AWS = require('aws-sdk')

exports.handler = (event, context, callback) => {

  AWS.config.update({
    region: "eu-west-1"
  });

  var docClient = new AWS.DynamoDB.DocumentClient();

  console.log("Putting to DB.");

  // var params = {
  //     TableName : "meltsy-oauth",
  //     Item : {
  //       Id: 'meltsy',
  //     }
  // }
  //
  // docClient.put(params, function(err,data) {
  //   if (err) {
  //     callback(err,null)
  //   }else{
  //
  //
  //     callback(null,err)
  //   }
  // });

  var params = {
      TableName : "meltsy-oauth",
      Key : {
        Id: 'meltsy'
      }
  }

  docClient.get(params, function(err, data) {
      if (err) {
          console.error("Unable to scan. Error:", JSON.stringify(err, null));
      } else {
          console.log("Scan succeeded.");
          data.Items.forEach(function(item) {
              console.log(" - ", item);
          });
      }
  });

  var getparams = {
    TableName : "meltsy-oauth",
    Limit : 5
  }



}
