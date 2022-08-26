
var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

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
    }


}