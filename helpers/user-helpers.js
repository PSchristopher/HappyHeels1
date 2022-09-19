
var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const ottp = require('../config/otp')
const { ObjectID } = require('bson')
const { response } = require('../app')
const client = require('twilio')(ottp.accountSID, ottp.authToken)
const { resolve } = require('path')

const Razorpay = require('razorpay');
const razorpayData = require('../config/Razorpay')

const paypal = require('paypal-rest-sdk');
const paypalData = require('../config/Paypal')
const moment = require('moment')

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET
});

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
                userData.wallet = 0
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
        console.log(userData,"abd");
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

    /* ------------------------ show address in checkout ------------------------ */
    getUserAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userAddress = await db.get().collection(collection.ADDRESS_COLLECTION)
                .aggregate([
                    {
                        $match: { user: userId }
                    },
                    {
                        $unwind: '$address'
                    },
                    {
                        $project: {
                            user: 1,
                            firstName: "$address.firstName",
                            lastName: "$address.lastName",
                            streetAddress: "$address.streetAddress",
                            city: "$address.city",
                            state: "$address.state",
                            zip: "$address.zip",
                            phone: "$address.phone",
                            email: "$address.email"

                        }


                    }
                ]).toArray()

            console.log('purshu sundaran');
            //console.log(userAddress);
            resolve(userAddress)
        })
    },

    /* --------------------------- getCartProductList to show in orders  list--------------------------- */
    getCartProductList: (userID) => {
        console.log(userID, "dfghgfdsdfg");
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userID) })

            resolve(cart.products)

        })
    },
    /* ------------------------------- order place ------------------------------ */
    placeOrder: (products, order, totalPrice, wallet) => {
        console.log('user test');
        console.log(order, "okiuhyg");
        console.log(totalPrice, "jiuhygtf");
        console.log(wallet, "hgtfrd");
        const m = moment();
        m.locale("en-au");

        return new Promise(async (resolve, reject) => {

            let status = order['payment-method'] === 'COD' || 'Wallet' ? 'placed' : 'pending'
            let addressData = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: ObjectID(order.address) })
            console.log(addressData, "idhaanu address");
            let orderObj = {

                deliverDetails: {
                    phone: addressData.address.phone,
                    email: addressData.address.email,
                    zip: addressData.address.zip,
                    state: addressData.address.state,
                    city: addressData.address.city,
                    streetAddress: addressData.address['street-address'],
                    country: addressData.address.country,
                    lastName: addressData.address.lastName,
                    firstName: addressData.address.firstName
                },
                userId: ObjectID(order.user),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: totalPrice,
                status: status,
                date: new Date()

            }
            console.log(order, "pallil poyi");
            if (order.couponcode) {
                orderObj.coupon = {
                    couponId: order.couponcode,
                    offer: order.couponOffer
                }
                db.get().collection(collection.COUPON_COLLECTION).updateOne({ code: order.couponcode },
                    {
                        $push: { user: ObjectID(order.user) }
                    })
            }
            let balance
            if (wallet <= totalPrice) {
                balance = 0
            } else {
                balance = wallet - totalPrice
            }
            console.log(order, "something");
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj)
                .then(async (response) => {
                    await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectID(order.user) },
                        {
                            $set: { wallet: balance }
                        })

                    resolve(response.insertedId)
                })

        })
    },

    /* -------------------------- delete caart products ------------------------- */
    deleteCartProducts: (user) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectID(user) })
            resolve(response)
        })
    },

    /* ------------------------- checkin coupon in cart ------------------------- */
    checkCouponData: (userId) => {
        return new Promise(async (resolve, reject) => {
            let couponData = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId) })
            resolve(couponData)
        })
    },
    /* ---------------- eckin coupon details in coupon collection --------------- */
    checkCouponValue: (code) => {
        return new Promise(async (resolve, reject) => {
            let value = await db.get().collection(collection.COUPON_COLLECTION).findOne({ code: code })
            resolve(value)
        })
    },
    /* ---------------------------- users order list ---------------------------- */
    getAllOrders: (userID) => {

        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: ObjectID(userID) }).sort({ date: -1 }).toArray()
            // console.log(orders, "jhbg");
            // console.log(orders[0].date, "jhbg");
            // for (var i = 0; i < orders.length; i++) {
            //     const date = new Date(orders[i].date)
            //     date.setDate(date.getDate() + 1)
            //     const currentDate = new Date()
            //     console.log(date, "iju");
            //     console.log(currentDate, "jhg");
            //     if (date < currentDate) {
            //         orders.return = "expired"
            //     }
            // }  
            for (var i = 0; i < orders.length; i++) {
                orders[i].date = orders[i].date.toLocaleDateString()
            }


            resolve(orders)
        })
    },
    getDetailedOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: ObjectID(orderId) }
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
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray()

            resolve(orderItems)

        })
    },
    /* ----------------------------- cancel a order ----------------------------- */
    cancelOrder: (orderId, user) => {

        console.log(orderId, "ordernte ID");
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectID(orderId) })

            if (order.paymentMethod != 'COD') {
                console.log(user.wallet, "abc");
                console.log(order.totalAmount, "cba");

                user.wallet = user.wallet + parseInt(order.totalAmount)
                let wallett = await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectID(order.userId) },
                    {
                        $set: { wallet: user.wallet }
                    })
            }
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: ObjectID(orderId) },
                    { $set: { status: "cancelled" } })
                .then(() => {
                    resolve({ status: true })
                })
        })
    },

    /* ------------------------------ return order ------------------------------ */
    returnOrder: (order, user) => {

        return new Promise(async (resolve, reject) => {
            let userDetails = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectID(user._id) })


            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectID(order.orderId) },
                {
                    $set: { status: 'Returned' }
                }).then(async (response) => {
                    let amount = parseInt(order.Amount) + userDetails.wallet
                    console.log(amount, 'amountttttttttttttttttttttttt');
                    let data = await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectID(userDetails._id) },
                        {
                            $set: { wallet: amount }
                        })
                })
            resolve({ status: true })
        })
    },

    /* ---------------------------- GET ORDERProduct ---------------------------- */

    getOrderProduct: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectID(orderId) }).then((data) => {

                resolve(data)
            })
        })
    },

    // getOrderlist:(userID)=>{
    //     return new Promise(async(resolve,reject)=>{
    //     //   let  orders =await db.get().collection(collection.ORDER_COLLECTION).findOne({userId:ObjectID(userID)})
    //      let order = await db.get().collection(collection.ORDER_COLLECTION)
    //      .aggregate([
    //         {
    //             $match:{userId:ObjectID(userID)}
    //         },
    //         {
    //             $unwind:'$products'
    //         },

    //         {
    //            $lookup:{
    //             from:collection.PRODUCT_COLLECTION,
    //             localField:'products.item',
    //             foreignField:'_id',
    //             as:'products'
    //            } 
    //         },
    //         {
    //             $project:{
    //                 deliverDetails:1,
    //                 userId:1,
    //                 paymentMethod:1,
    //                 totalAmount:1,
    //                 status:1,
    //                 date:1,
    //                 product:{$arrayElemAt:['$products',0]}
    //             }
    //         }
    //      ]).toArray()
    //      console.log("order");
    //      resolve(order);
    //      console.log("order");
    //     })
    // },
    /* --------------------------- generate razor pay --------------------------- */
    generateRazoepay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            razorpayData.instance.orders.create(options, function (err, order) {
                console.log(order);
                resolve(order)
            });


        })

    },
    /* ---------------------- razorpay payment verification --------------------- */
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', razorpayData.key_secret)

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },

    /* ----------------------------- paypal payment ----------------------------- */
    generatePayPal: (orderId, totalPrice) => {
        console.log('paypal working');
        return new Promise((resolve, reject) => {
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    return_url: "http://localhost:7000/orders",
                    cancel_url: "http://localhost:7000/check-out"
                },
                "transactions": [
                    {
                        "item_list": {
                            "items": [
                                {
                                    "name": "Red Sox Hat",
                                    "sku": "001",
                                    "price": totalPrice,
                                    "currency": "USD",
                                    "quantity": 1
                                }
                            ]
                        },
                        "amount": {
                            "currency": "USD",
                            "total": totalPrice
                        },
                        "description": "Hat for the best team ever"
                    }
                ]
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    console.log("paypal int. err stp ...4", error);
                    throw error;

                } else {
                    console.log(payment, "****a");
                    resolve(payment);
                }
            });
        });
    },
    /* ------------------------------ change status ----------------------------- */
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: ObjectID(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }).then(() => {
                        resolve()
                    })
        })
    },
    // /* ------------------------- add product to wisilist ------------------------ */
    addToWisilist: (proId, userId) => {

        return new Promise(async (resolve, reject) => {
            var user = await db.get().collection(collection.WISILIST_COLLECTION).findOne({ user: ObjectID(userId) })
            if (user) {
                var userr = await db.get().collection(collection.WISILIST_COLLECTION).findOne({ user: ObjectID(userId), products: { $in: [ObjectID(proId)] } })
                if (userr) {
                    resolve()
                } else {
                    await db.get().collection(collection.WISILIST_COLLECTION).updateOne({ user: ObjectID(userId) },
                        {
                            $push: { products: ObjectID(proId) }
                        }).then((response) => {
                            resolve(response)
                        })
                }
            } else {
                var proObj = {
                    user: ObjectID(userId),
                    products: [ObjectID(proId)]
                }
                await db.get().collection(collection.WISILIST_COLLECTION).insertOne(proObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    /* -------------------------- get wisilist products ------------------------- */
    getwishlistpro: (userId) => {

        return new Promise(async (resolve, reject) => {
            var proData = await db.get().collection(collection.WISILIST_COLLECTION).aggregate([
                { $match: { user: ObjectID(userId) } },
                {
                    $unwind: "$products"
                },

                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products',
                        foreignField: '_id',
                        as: 'product'
                    }
                },


                {
                    $project: {
                        user: 1,
                        proId: '$product._id',

                        product: '$product.name',
                        category: '$product.category',
                        image: '$product.image',
                        price: '$product.price',


                    }
                },
                {
                    $unwind: '$image'

                },
                {
                    $lookup: {
                        from: collection.CATEGORY_COLLECTION,
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },

                {
                    $project: {
                        user: 1,
                        proId: 1,

                        product: 1,
                        category: '$category.category',
                        image: 1,
                        price: 1,


                    }
                }

            ]).toArray()
            console.log(proData);
            console.log('proData');
            resolve(proData)
        }
        )
    },

    /* ------------------------ delete wisilist products ------------------------ */
    deletewisilistProduct: (wisiId, proId) => {
        console.log(wisiId);
        console.log('walletId');
        console.log(proId);
        return new Promise(async (resolve, reject) => {

            await db.get()
                .collection(collection.WISILIST_COLLECTION)
                .updateOne({ user: ObjectID(wisiId) },
                    {
                        $pull: { products: ObjectID(proId) }
                    }).then((response) => {
                        console.log('sssss');
                        response.removed = true
                        resolve(response)
                    })


        })
    },

    /* ------------------------ get wisilist in shop page ----------------------- */
    getWisiPro: (userId) => {
        console.log(userId, "jhg");
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.WISILIST_COLLECTION).find({ user: ObjectID(userId) }).toArray().then((response) => {

                console.log(response);
                console.log('proData');
                resolve(response)
            })
        }
        )
    },

    /* ------------------------ products in category wise ----------------------- */

    categoryWiseProductList: (catId) => {
        console.log(catId, "category aanneee");
        return new Promise(async (resolve, reject) => {
            data = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: ObjectID(catId) }).toArray()
            resolve(data)
        })
    },
    /* ----------------------------- add-new-address ---------------------------- */

    addNewAddress: (userId, addressData) => {

        console.log(addressData);
        return new Promise((resolve, reject) => {
            // let address = {
            //     firstName:addressData.firstName,
            //     streetAddress:addressData.streetAddress,
            //     city:addressData.city,
            //     state:addressData.state,
            //     zip:addressData.zip,
            //     phone:addressData.phone,
            //     email:addressData.email,
            // }
            // db.get().collection(collection.USER_COLLECTION)
            // .updateOne({_id:ObjectID(userId)},
            // {
            //     $push:{address:{addressData}}
            // }).then(()=>{

            //     resolve({status:true})
            // })
            db.get().collection(collection.ADDRESS_COLLECTION)
                .insertOne({ user: userId, address: addressData }).then(() => {

                    resolve({ status: true })
                })
        })
    },

    /* -------------------- show user detail in user profile -------------------- */
    viewUserDetails: (userId) => {
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let dataa = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ user: userId })

            resolve(dataa)
            console.log(dataa);

        })
    },


    /* ------------------------------ apply coupon ------------------------------ */
    applyCoupon: (coupon, userId) => {
        return new Promise(async (resolve, reject) => {
            let today = new Date()

            let coupData = await db.get().collection(collection.COUPON_COLLECTION)
                .findOne({ code: coupon.coupon, status: true })
            // {
            //     $match: { code: coupon.coupon, status: true }
            // },
            // // {
            // //     $match:{endingdate :{ $gte: today }}

            // // },
            // {
            //     $project: { name: 1, code: 1, endingdate: 1, value: 1, status: 1 }
            // }

            let response = {}
            // console.log(coupData, "okiuxsgdcvvc");
            // console.log(coupData.endingdate,"varum");
            if (coupData) {
                let userused = await db.get().collection(collection.COUPON_COLLECTION).findOne({ code: coupon.coupon, user: { $in: [ObjectID(userId)] } })
                if (userused) {
                    response.used = true;
                    resolve(response)
                } else {
                    console.log(today, "yes", coupData.endingdate);
                    if (today <= coupData.endingdate) {
                        // db.get().collection(collection.COUPON_COLLECTION).updateOne({ code: coupon.coupon }, {
                        //     $push: { User: ObjectID(userId) }
                        // }).then((response) => {
                        db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userId) },
                            { $set: { code: coupon.coupon } })
                        response.a = coupData
                        resolve(response)
                        // })

                    } else {
                        response.dateErr = true
                        resolve(response)
                    }
                }
            } else {
                response.invalid = true
                resolve(response)
            }

        })
    },
    /* ------------------------------ remove coupon ----------------------------- */
    removeCoupon: (userId) => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId) },
                {
                    $unset: {
                        coupon: ''
                    }
                })
            resolve(coupon)
        })
    },

    deleteAddress: (addressId) => {
        return new Promise(async (resolve, reject) => {
            console.log(addressId.addressId, "uhgf");
            await db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({ _id: ObjectID(addressId.addressId) })
            resolve(response)
        })
    },

    /* ---------------------------- get sing address ---------------------------- */
    getSingleAddress: (id) => {

        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: ObjectID(id) }).then((data) => {

                resolve(data)
            })
        })
    },
    /* ----------------------------- UPDATE ADDRESS ----------------------------- */

    updateAddress: (data, id) => {
        console.log(data, 'dta');
        console.log(id, 'id');
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: ObjectID(id) },
                { $set: { address: data } }).then((response) => {
                    console.log(response, 'rspns');
                    resolve(response)
                })
        })
    },

    getUserWallet: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectID(id) }).then((data) => {
                resolve(data)
            })
        })
    },

    /* ------------------------------- USE WALLET ------------------------------- */

    useWallet: (total, user) => {
        console.log(total.amount, 'pppppppp');

        let response = {}

        return new Promise(async (resolve, reject) => {
            if (total.amount < user.wallet) {
                response.amount = 0
                response.wallet = user.wallet - total.amount

                response.status = true
                console.log('response', response, "response");
                resolve(response)

            } else {

                response.amount = total.amount - user.wallet
                response.wallet = 0
                response.status = true
                console.log('response', response, "responseooooooooooo");
                resolve(response)
            }
        })
    },


    removeWallet: (user, currentWallet) => {
        return new Promise((resolve, reject) => {
            console.log(user, 'oottete');
            console.log(currentWallet, 'gggg');
            let response = {}
            if (currentWallet.wallet == 0) {
                response.total = user.wallet + parseInt(currentWallet.amount)
                response.wallet = user.wallet
                console.log(response, 'responsetotal');

            } else {
                response.total = user.wallet - parseInt(currentWallet.wallet)
                response.wallet = user.wallet
                console.log(response, 'responsetotal');
            }

            resolve(response)
        })
    }
}

