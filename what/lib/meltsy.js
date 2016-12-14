var request = require('request')
var promise = require('bluebird')
var purest = require('purest')({request, promise})
var config = require('../config/etsy-provider.json')
var etsy = purest({provider: 'etsy', config})
var etsyConfig = require('../config/etsy-keys.json')
var _ = require('lodash')
var AWS = require('aws-sdk')

function meltsy(){

  this.getUnshipped = function (callback, page, offset, passedItems) {
    passedItems = passedItems || []

    var paginationVars = ''
    if (page > 0 && offset > 0){
      paginationVars = `&page=${page}&offset=${offset}`
    }

    var uri = `shops/MeltingHouse/transactions?limit=100${paginationVars}`
    console.log(uri)
    var eReq = etsy
    .get(uri)
    .oauth({
        consumer_key: etsyConfig.etsy.consumer_key,
        consumer_secret: etsyConfig.etsy.consumer_secret
      })
    .auth(etsyConfig.etsy.access_key, etsyConfig.etsy.access_secret)
    .request()
    .catch((err) => {
      //callback('Error fetching transactions - ' + JSON.stringify(err)) //no data
      console.log('Error fetching transactions')
      // fs.writeFile('fail.json', JSON.stringify(err))
      console.log(err)
      //callback(passedItems)
    })
    .then((result) => {
      console.log('Success getting transactions')
      // return //not sure why this deals with bad requests??

      // if (result[0].body.pagination.effective_page == 1) {
      //fs.writeFile('result.json', result[0])
      // }

      output = result.pop() // for some reason the result contains two copies
      //console.log(output)
      // fs.writeFile('result.json', output.results[0])

      var unshippedItems = output.results
        .map((e) => {e.date = new Date(e.creation_tsz * 1000).toGMTString();return e})
        .filter((e) => {return e.shipped_tsz == null})

      //passedItems = []
      //console.log(passedItems)
      passedItems = passedItems.concat(unshippedItems)

      // console.log('next offet: ' + result[0].body.pagination.next_offset)
      // console.log('next page: ' + result[0].body.pagination.next_page)

      /*
      * @WIP Pagination:
      * http://stackoverflow.com/questions/17242600/how-to-recurse-asynchronously-over-api-callbacks-in-node-js
      */
      if (_.size(unshippedItems) > 0) {
        this.getUnshipped(
          callback,
          output.pagination.next_page,
          output.pagination.next_offset,
          passedItems
        )
          return
      }



      console.log('Doing the array building')
      var newItems = {}
      passedItems.forEach(function(e){
        var itemNameIncVariation
        if (e.variations.length > 0) {
          e.variations.forEach(v => {
            itemIDIncVariation = e.listing_id + '_' + v.formatted_value
            itemNameIncVariation = e.title //.substring(0,100) + '...'
            if (v.formatted_value) {
               itemNameIncVariation += ' (' + v.formatted_value + ')'
            }
            if (!(itemIDIncVariation in newItems)) {
              newItems[itemIDIncVariation] = {}
              newItems[itemIDIncVariation].title = itemNameIncVariation
              newItems[itemIDIncVariation].listing_id = itemIDIncVariation
              newItems[itemIDIncVariation].quantity = 1
            } else {
              newItems[itemIDIncVariation].quantity += 1
            }
          })
        } else {
          if (!(e.listing_id in newItems)) {
            newItems[e.listing_id] = {}
            newItems[e.listing_id].title = e.title //.substring(0,80) + '...'
            newItems[e.listing_id].listing_id = e.listing_id
            newItems[e.listing_id].quantity = 1
          } else {
            newItems[e.listing_id].quantity += 1
          }
        }
      })

      newItems = _.orderBy(newItems, 'quantity', 'desc');

      // console.log(newItems);
      // return the data
      callback(newItems);
    })
  }
}

// expose foobar to other modules
exports.meltsy = new meltsy();
