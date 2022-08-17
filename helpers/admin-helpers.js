
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
    /* ------------------------------ updateProduct ----------------------------- */
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

            console.log("uytfdfghjkjhgfdsdfghjhgfd", productss);
            resolve(productss)


        })
    },
    /* ----------------------------- update product ----------------------------- */
    updateProduct: (productId, productDetails) => {
        return new Promise(async(resolve, reject) => {
let img = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(productId)})
// let category= await db.get().collection(collection.CATEGORY_COLLECTION).findOne({category:productDetails.category})

            if (productDetails.image.length == 0) {
                productDetails.image = img.image
            }
            let Uproduct = db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: ObjectId(productId) }, {
                    $set: {
                        name: productDetails.name,
                        category:productDetails.category,
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

            let products = await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            })
            resolve(products)
        })
    },

    /* ------------------------------ vie products ------------------------------ */
    getProducts: (product) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()

            resolve(details)
        })
    },
    /* ---------------------------- detailed product ---------------------------- */
    getdetailedProducts: (detailid) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(detailid) })
            console.log("dfghjkjhgf", detail);
            resolve(detail)
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