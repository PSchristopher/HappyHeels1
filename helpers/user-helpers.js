
var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const ottp = require('../config/otp')
const { ObjectID } = require('bson')
const { response } = require('../app')
const client = require('twilio')(ottp.accountSID, ottp.authToken)

const Razorpay = require('razorpay');
const razorpayData = require('../config/Razorpay')

module.exports = {
    // signup

    doSignUp: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let uservlid = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            let userphn = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: userData.phone })

            if (uservlid) {
                response.status = true
                response.message = "Your Email Already Exists"
                resolve(response)

            } else if (userphn) {
                response.status = true
                response.message = "Your Mobile  number Already Exists"
                resolve(response)
            }
            else {
                userData.state = true
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    console.log('data:', data);
                    resolve(data)
                })
            }

        })

    },

    // login
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            userData.state = true
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ $and: [{ email: userData.email, state: userData.state }] })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })
            } else {
                resolve({ status: false })
            }
        })
    },

    /*------------------------------- otp logi -------------------------------- */

    otplogin: (Uphone) => {
        console.log(Uphone.phone);
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: Uphone.phone })
            console.log(user, 'ty');
            if (user) {
                response.status = true
                response.user = user
                client.verify.services(ottp.serviceID).verifications
                    .create({
                        to: `+91${Uphone.phone}`,
                        channel: `sms`

                    }).then((data) => {

                    })
                resolve(response)
            } else {
                response.status = false
                response.message = "Entered number is not registered"
                resolve(response)
            }
        })
    },

    /* ----------------------------- otp validation ----------------------------- */
    otp: (otpData, userData) => {
        return new Promise((resolve, reject) => {
            client.verify.services(ottp.serviceID).verificationChecks
                .create({
                    to: `+91${userData.phone}`,
                    code: otpData.otp
                }).then((data) => {
                    if (data.status == 'approved') {
                        resolve({ status: true })
                    } else {
                        resolve({ status: false })
                    }
                })
        })
    },


    /* ------------------------------- add to cat ------------------------------- */
    addToCart: (proID, userID) => {
        return new Promise(async (resolve, reject) => {
            let proObj = {
                item: ObjectID(proID),
                quantity: 1
            }
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userID) })
            if (userCart) {

                let proExist = userCart.products.findIndex(product => product.item == proID)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userID), 'products.item': ObjectID(proID) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve({ status: false })
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userID) },
                        {

                            $push: { products: proObj }

                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
                }
            } else {
                let cartObj = {
                    user: ObjectID(userID),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve({ status: true })
                })
            }
        })

    },


    /* --------------------------- getproducts in cart -------------------------- */

    getCartProducts: (userID) => {

        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userID) }
                },
                {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }

                    }
                }

            ]).toArray()

            resolve(cartItems)
        })
    },

    /* ----------------------------- get cart count ----------------------------- */
    getCartCount: (userID) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userID) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    /* ------------------------ product quandity chhange ------------------------ */

    changeProductQuantity: (details) => {
        console.log(details);
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {


            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectID(details.cart) },
                    {
                        $pull: { products: { item: ObjectID(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectID(details.cart), 'products.item': ObjectID(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }
                ).then((response) => {
                    resolve({ inc: true })
                })
            }

        })
    },

    /* ------------------------- delete product quantity ------------------------ */

    deleteProduct: (detail) => {
        console.log(detail, "ths is detail");
        console.log(detail.cart, "ths is detail");

        return new Promise(async (resolve, reject) => {


            let user = await db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectID(detail.cart) },
                {
                    $pull: { products: { item: ObjectID(detail.product) } }
                }
            ).then((response) => {

                resolve(response)
            })


        })
    },

    /* ------------------------------- place order ------------------------------ */
    getTotalAmount: (userID) => {

        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userID) }
                },
                {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }

                    }
                },
                {
                    $group: {
                        _id: null,
                        //    total:{$sum:{$multiply:['$quantity','$product.price']}}
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.price' }] } }

                    }
                }

            ]).toArray()

            if (total.length != 0) {

                resolve(total[0].total)
            } else {
                resolve()
            }

        })

    },

    /* -------------------------------- subtotal -------------------------------- */
    getSubTotal: (detail) => {

        return new Promise(async (resolve, reject) => {
            let subtotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(detail.user) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }
                , {

                    $match: { item: ObjectID(detail.product) }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        _id: 0, quantity: 1, product: { $arrayElemAt: ["$product", 0] }

                    }
                },
                {
                    $project: {

                        //    total:{$sum:{$multiply:['$quantity','$product.price']}}
                        total: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.price' }] }

                    }
                }

            ]).toArray()
            console.log(subtotal);
            if (subtotal.length != 0) {
                resolve(subtotal[0].total)
            } else {
                resolve()
            }

        })
    },

    /* ---------------------------- subtotal to cart ---------------------------- */


    getCartSubTotal: (userID) => {
        console.log(userID, 'jhgfds');
        return new Promise(async (resolve, reject) => {
            let cartSubTotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectID(userID) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        _id: 0, quantity: 1, product: { $arrayElemAt: ["$product", 0] }
                    }
                }, {
                    $project: {
                        suBtotal: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.price' }] }

                    }
                }
            ]).toArray()
            console.log('cartSubTotal');
            console.log(cartSubTotal);
            console.log('cartSubTotal');
            resolve(cartSubTotal)
        })
    },
    /* --------------------------- getCartProductList to show in orders  list--------------------------- */
    getCartProductList: (userID) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userID) })
           
            resolve(cart.products)

        })
    },
    /* ------------------------------- order place ------------------------------ */
    placeOrder: (order, products, totalPrice) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, totalPrice);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliverDetails: {
                    phone: order.phone,
                    email: order.email,
                    zip: order.zip,
                    state: order.state,
                    city: order.city,
                    streetAddress: order['street-address'],
                    country: order.country,
                    lastName: order.lastName,
                    firstName:order.firstName
                },
                userId:ObjectID(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:totalPrice,
                status:status,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj)
            .then((response)=>{
               
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectID(order.userID)})
                resolve(response.insertedId)
            })

        })
    },
    /* ---------------------------- users order list ---------------------------- */
    getOrderlist:(userID)=>{
        return new Promise(async(resolve,reject)=>{
        //   let  orders =await db.get().collection(collection.ORDER_COLLECTION).findOne({userId:ObjectID(userID)})
         let order = await db.get().collection(collection.ORDER_COLLECTION)
         .aggregate([
            {
                $match:{userId:ObjectID(userID)}
            },
            {
                $unwind:'$products'
            },
           
            {
               $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'products.item',
                foreignField:'_id',
                as:'products'
               } 
            },
            {
                $project:{
                    deliverDetails:1,
                    userId:1,
                    paymentMethod:1,
                    totalAmount:1,
                    status:1,
                    date:1,
                    product:{$arrayElemAt:['$products',0]}
                }
            }
         ]).toArray()
         console.log("order");
         resolve(order);
         console.log("order");
        })
    },
    /* --------------------------- generate razor pay --------------------------- */
    generateRazoepay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
           var options ={
            amount:total*100,
            currency:"INR",
            receipt:""+orderId
           };
           razorpayData.instance.orders.create(options,function(err,order){
            console.log(order);
            resolve(order)
           });
         
        
    })

},
/* ---------------------- razorpay payment verification --------------------- */
verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
     const crypto = require('crypto');
     let hmac = crypto.createHmac('sha256',razorpayData.key_secret)

     hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
   hmac = hmac.digest('hex')
   if(hmac == details['payment[razorpay_signature]']){
    resolve()
   }else{
    reject()
   }
    })
},
/* ------------------------------ change status ----------------------------- */
changePaymentStatus:(orderId)=>{
   return new Promise((resolve,reject)=>{
    db.get().collection(collection.ORDER_COLLECTION)
    .updateOne({_id:ObjectID(orderId)},
    {
        $set:{
            status:'placed'
        }
    }).then(()=>{
        resolve()
    })
   }) 
}

}