const Razorpay = require('razorpay')

const key_id = process.env.KEY_ID
const key_secret = process.env.KEY_SECTRET

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECTRET,
  });

  module.exports={instance,key_id,key_secret}