
var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')

module.exports = {
    // signup

    doSignUp: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response={}
            let uservlid = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (uservlid) {
                response.status=true
                
                resolve(response)

            } else {
                userData.state=true
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    console.log('data:',data);
                    resolve(data)
                })
            }

        })

    },

    // login
    doLogin: (userData) => {
        return new Promise(async(resolve,reject) => {
            let response = {}
            userData.state= true
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({$and:[{ email: userData.email ,state: userData.state }]})
            if (user){
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
    }


}