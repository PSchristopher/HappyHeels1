
var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('../app')
const moment = require('moment')
module.exports = {
    /*All Users */
    seeAllusers: () => {
        return new Promise((resolve, reject) => {
            let usersData = db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(usersData)
        })
    },
    // block user
    blockUser: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(proId) }, { $set: { state: false } }).then((data) => {
                resolve(data)
            })
        })
    },
    // unblock user
    unblockUser: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(proId) }, { $set: { state: true } }).then((data) => {
                resolve(data)
            })
        })
    },


    // add category

    addCategory: (categoryData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let categorie = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: categoryData.category })

            if (categorie) {
                response.message = 'Cant add this ,Category already exists'
                response.status = true
                resolve(response)
            } else {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryData).then((data) => {
                    response.message = 'Category Added successfully'
                    response.status = false
                    response.data = data
                    resolve(response)
                })
            }
        })
    },

    /* ---------------------------- //view categories --------------------------- */
    viewCategories: () => {
        return new Promise(async (resolve, reject) => {
            let show = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(show)

        })
    },
    /* ----------------------------- delete category ---------------------------- */
    deleteCategory: (cateId) => {
        console.log(cateId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: ObjectId(cateId) }).then((response) => {
                resolve(response)
            })
        })
    },
    /* ------------------------------ edit category ----------------------------- */
    editcategory: (categoryId) => {
        return new Promise(async (resolve, reject) => {
            let categoriess = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectId(categoryId) })
            resolve(categoriess)
        })

    },
    /* -------------------------- find single category -------------------------- */
    findCategory: (catId) => {
        return new Promise((resolve, reject) => {
            let scat = db.get().collection(collection.CATEGORY_COLLECTION)
                .findOne({ _id: catId })
            resolve(scat)
        })
    },


    /* ------------------------------ update Category---------------------------- */
    updateCategory: (categryId, categoryDetails) => {
        return new Promise((resolve, reject) => {
            let Ucat = db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({ _id: ObjectId(categryId) }, {
                    $set: {
                        category: categoryDetails.category,
                        image: categoryDetails.image
                    }

                }).then((Ucat) => {
                    resolve(Ucat)
                })
        })
    },
    /* ------------------------------ edit product ------------------------------ */
    editProduct: (producId) => {
        return new Promise(async (resolve, reject) => {
            let productss = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(producId) })


            resolve(productss)


        })
    },
    /* --------------- -------------- update product ----------------------------- */
    updateProduct: (productId, productDetails) => {
        console.log("pro");
        console.log(productDetails);
        console.log(productId);
        return new Promise(async (resolve, reject) => {
            let img = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(productId) })
            let categoryy = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectId(productDetails.category) })

            if (productDetails.image.length == 0) {
                productDetails.image = img.image
            }
            // if(productDetails.category==null){
            //     productDetails.category=img.category
            // }

            let Uproduct = db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: ObjectId(productId) }, {
                    $set: {
                        name: productDetails.name,
                        category: ObjectId(categoryy._id),
                        discription: productDetails.discription,
                        price: productDetails.price,
                        image: productDetails.image
                    }
                }).then((Uproduct) => {
                    resolve(Uproduct)
                })
        })
    },


    /* ------------------------------- add product ------------------------------ */
    addProduct: (product) => {

        return new Promise(async (resolve, reject) => {
            product.category = ObjectId(product.category)
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            })
            resolve(products)
        })
    },

    /* ------------------------------ vie products ------------------------------ */
    getProducts: (product) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.PRODUCT_COLLECTION)
                .aggregate([
                    {

                        $lookup:
                        {
                            from: collection.CATEGORY_COLLECTION,
                            localField: 'category',
                            foreignField: '_id',
                            as: 'category'
                        }

                    },
                    {
                        $project:
                        {
                            category: { $arrayElemAt: ['$category', 0] },
                            name: 1,
                            discription: 1,
                            price: 1,
                            image: 1

                        }
                    }
                ]).toArray()


            resolve(details)
        })
    },
    /* ---------------------------- detailed product ---------------------------- */
    getdetailedProducts: (detailid) => {
        return new Promise(async (resolve, reject) => {

            // let detail = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(detailid) })
            // let catDetail = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:detail.category})
            let detail = await db.get().collection(collection.PRODUCT_COLLECTION)
                .aggregate([
                    {

                        $lookup:
                        {
                            from: collection.CATEGORY_COLLECTION,
                            localField: 'category',
                            foreignField: '_id',
                            as: 'category'
                        }

                    },
                    {
                        $match: {
                            _id: ObjectId(detailid)
                        }
                    },
                    {
                        $project:
                        {
                            category: { $arrayElemAt: ['$category', 0] },
                            name: 1,
                            discription: 1,
                            price: 1,
                            image: 1

                        }
                    }
                ]).toArray()


            console.log("finding", detail);

            resolve(detail[0])
        })
    },
    /* ----------------------------- delete product ----------------------------- */
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: ObjectId(prodId) }).then((response) => {
                resolve(response)
            })
        })
    },
    /* ----------------------------- view all orders ---------------------------- */

    viewAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orderData = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orderData)
            console.log(orderData);
        })
    },


    /* ------------------------------- add banner ------------------------------- */
    addBanner: (bannerData) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.BANNER_COLLECTION).insertOne(bannerData).then((response) => {

                resolve(response)
            })
        })
    },


    /* ------------------------------- view Banner ------------------------------ */
    ViewBanner: () => {
        return new Promise((resolve, reject) => {
            let banner = db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },

    /* ------------------------------ delte banner ------------------------------ */
    deleteBanner: (banId) => {
        console.log(banId, "iiiiiii");
        return new Promise(async (resolve, reject) => {
            let result = await db.get().collection(collection.BANNER_COLLECTION).deleteOne({ _id: ObjectId(banId.banner) }).then((response) => {
                resolve(response)
            })
        })
    },

    /* --------------------------- update order status -------------------------- */
    updateOrderStatus: (data) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(data.id) }, { $set: { status: data.status } }).then((response) => {
                resolve()
            })
        })
    },


    /* -------------------------- payment method chart -------------------------- */

    paymentMethodChart: () => {
        return new Promise(async (resolve, reject) => {
            let method = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            status: { $nin: ["cancelled"] }
                        }
                    },
                    {
                        $group: {
                            _id: "$paymentMethod",
                            totalAmount: {
                                $sum: "$totalAmount"
                            }
                        }
                    }
                ]).toArray()
            resolve(method)
            console.log("Method", method, "Method");
        })
    },

    /* ------------------------------- year chart ------------------------------- */

    yearChart: () => {
        return new Promise(async (resolve, reject) => {
            let value = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: { $nin: ["cancelled"] }
                    }
                }, {
                    $project: {
                        year: {
                            $year: '$date'
                        },
                        totalAmount: 1
                    }
                }
            ]).toArray()
            console.log(value, "adutha kali");
            resolve(value)
        })
    },

    /* ------------------------------- sale report ------------------------------ */
    showSalesReport: (dates) => {
        console.log(new Date(dates.from), "idhanu testing date");
        console.log("Dates are", dates.from);
        console.log("Dates are", dates.to);
        return new Promise(async (resolve, reject) => {
            let date = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { date: { $gte: new Date(dates.from), $lte: new Date(dates.to) } }
                    },
                    {
                        $project: {
                            paymentMethod: 1,
                            totalAmount: 1,
                            customer: "$deliverDetails.firstName",
                            mobile: "$deliverDetails.phone",
                            date: 1,
                            products: 1

                        }
                    },

                    {
                        $unwind: "$products"
                    },
                    {
                        $project: {
                            paymentMethod: 1,
                            totalAmount: 1,
                            mobile: 1,
                            customer: 1,
                            date: 1,
                            products: "$products.item",
                            quantity: "$products.quantity"
                        }
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
                        $unwind: "$product"
                    },
                    {
                        $project: {
                            paymentMethod: 1,
                            totalAmount: 1,
                            customer: 1,
                            date: 1,
                            quantity: 1,
                            mobile: 1,
                            price: '$product.price',
                            productName: '$product.name',
                            proCategory: '$product.category',
                            proImage: '$product.image'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.CATEGORY_COLLECTION,
                            localField: 'proCategory',
                            foreignField: '_id',
                            as: 'cate'
                        }
                    },
                    {
                        $project: {
                            paymentMethod: 1,
                            totalAmount: 1,
                            customer: 1,
                            date: 1,
                            quantity: 1,
                            mobile: 1,
                            price: 1,
                            productName: 1,
                            proImage: 1,
                            category: '$cate.category'
                        }
                    },


                ]).toArray()
            console.log(date, "dateeee");
        })
    },

    /* ------------------------------ adding coupon ----------------------------- */
    addCoupon: (couponDetails) => {
        return new Promise(async (resolve, reject) => {
            couponDetails.endingdate = new Date(couponDetails.endingdate)
            console.log(couponDetails, "iahaka");
            let response = {}
            let couponExist = await db.get().collection(collection.COUPON_COLLECTION).findOne({ code: couponDetails.code })

            if (couponExist) {
                response.status = true
                response.message = "Coupon With this Code Already Exist"
                resolve(response)
            } else {
                await db.get().collection(collection.COUPON_COLLECTION).insertOne({ name: couponDetails.name, code: couponDetails.code, endingdate: couponDetails.endingdate, value: couponDetails.value, status: true }).then((response) => {
                    response.message = 'Coupon Added successfully'
                    response.status = false
                    resolve(response)
                })
            }

        })
    },
    /* ----------------------------- view all coupon ---------------------------- */
    viewCoupon: () => {
        return new Promise(async (resolve, reject) => {
            // const m = moment();
            // m.locale("en-au");
            let couponList = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            // couponList.endingdate = couponList.endingdate m.format("L")
            resolve(couponList)
        })
    },
    /* ------------------------- block or unblock coupon ------------------------ */
    manageCoupon:(coupId)=>{
        return new Promise(async(resolve,reject)=>{
let response ={}
            let coupData =await db.get().collection(collection.COUPON_COLLECTION).findOne({_id:ObjectId(coupId) })
            if(coupData.status){
                let couponFalse =await db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: ObjectId(coupId) }, { $set: { status: false } }).then((response) => {
                    response.status=false
                    resolve(response)
                })
            }else{
                let couponTrue = await db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: ObjectId(coupId) }, { $set: { status: true } }).then((response) => {
                  response.status=true
                    resolve(response)
                })   
            }
        })
    }


}