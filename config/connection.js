const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=function(done){
    const url = "mongodb+srv://Christopher:christo@cluster0.akadhea.mongodb.net/?retryWrites=true&w=majority"
    // const url='mongodb://localhost:27017'
    const dbname='ecommerce'


    mongoClient.connect(url,(err,data)=>{
   if(err) return done(err)
   state.db=data.db(dbname)
   done()

})

    
}

module.exports.get=function(){
    return state.db
}