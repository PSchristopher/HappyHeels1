const express = require('express');
const { response } = require('../app');
const router = express.Router();
const userhelpers = require('../helpers/user-helpers')
const adminhelpers = require('../helpers/admin-helpers')
// var jsImageZoom = require("js-image-zoom")

let userheader = true;
let total

/* --------------------------- session middleware --------------------------- */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/user_signin')
  }
}

/* GET signup page */
router.get('/user_signup', function (req, res) {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/signup', { signupErr: req.session.signupError, user: true })
    req.session.signupError = false
  }
});
router.post('/user_signup', (req, res) => {
  userhelpers.doSignUp(req.body).then((response) => {

    if (response.status) {

      req.session.signupError = response.message
      res.redirect('/user_signup')

    }
    else {

      res.redirect('/user_signin')

    }
  })
})




/* GET login page */
router.get('/user_signin', function (req, res, next) {

  if (req.session.loggedIn) {

    res.redirect('/')

  } else {

    res.render('user/login', { title: 'Login', loginErr: req.session.loginError, user: true })
    req.session.loginError = false
  }
});

router.post('/user_signin', (req, res) => {
  userhelpers.doLogin(req.body).then((response) => {
    if (response.status) {

      req.session.loggedIn = true
      req.session.user = response.user
      console.log(req.session.user.state, "checkingggggg");
      res.redirect('/')
    } else {
      req.session.loginError = "Invalid Credentials"
      res.redirect('/user_signin')
    }
  })
})

let userName
/* GET index(home)  page */
router.get('/', async (req, res, next) => {
  userName = req.session.user

  if (userName) {

    var cartCount = await userhelpers.getCartCount(req.session.user._id)

  }
  adminhelpers.viewCategories().then((show) => {

    // res.render('admin/view-category',{adminheader,show})
    res.render('user/index', { title: 'Home', home: true, user: true, userName, userheader, show, cartCount })
  })

});

router.get('/user_logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

/* -------------------------------- otp login ------------------------------- */
router.get('/otp_login', (req, res) => {

  res.render('user/login', { user: true, otpLogin: true, ErMsg: req.session.loginError })
})

/* ----------------------------- otp login post ----------------------------- */

let userData
router.post('/otp_login', (req, res) => {
  userhelpers.otplogin(req.body).then((response) => {
    if (response.status) {
      userData = response.user
      res.redirect('/user_otp')
    } else {
      req.session.loginError = response.message
      res.redirect('/otp_login')

    }
  })
})

/* --------------------------------- get otp -------------------------------- */
router.get('/user_otp', (req, res) => {

  res.render('user/otp', { user: true })
})

/* ------------------------------ otp validate ------------------------------ */

router.post('/user_otp', (req, res) => {
  userhelpers.otp(req.body, userData).then((response) => {
    console.log(response, 'response');
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = userData
      res.redirect('/')
    } else {
      res.redirect('/user_otp')
    }
  })
})

//all products

router.get('/allproducts', async (req, res) => {
  if (userName) {

    var cartCount = await userhelpers.getCartCount(req.session.user._id)

  }

  adminhelpers.getProducts(req.body).then((items) => {

    adminhelpers.viewCategories().then((show) => {
      res.render('user/products', { user: true, userheader, items, show, userName, cartCount })
    })
  })
})

/* ----------------------------- product detail ----------------------------- */
router.get('/productdetail/:id',async (req, res) => {
  if (userName) {
    var cartCount = await userhelpers.getCartCount(req.session.user._id)
  }
  adminhelpers.getdetailedProducts(req.params.id).then((detailedview) => {
    res.render('user/product-detail', { user: true, detailedview, userheader, userName, cartCount })
  })
})

 

/* ---------------------------------- cart ---------------------------------- */
router.get('/cart', verifyLogin, async (req, res) => {
total = 0
let subtotal
  if (userName) {
    var cartCount = await userhelpers.getCartCount(req.session.user._id)

  }

  let products = await userhelpers.getCartProducts(req.session.user._id)
  subtotal= await userhelpers.getCartSubTotal(req.session.user._id)
  for(var i =0; i< products.length; i++){
    products[i].subTotal = subtotal[i].suBtotal
  }
  if(cartCount>0)
  total =await userhelpers.getTotalAmount(req.session.user._id)
 console.log(products,"hfffghj");
    res.render('user/cart', { user: true, userheader, products, userName, cartCount,total })

})


/* ------------------------------- add to cart ------------------------------ */
router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  console.log('api call');
  userhelpers.addToCart(req.params.id, req.session.user._id).then((response) => {
    console.log(response);
    if (response.status) {
      res.json({ status: true })
    }

  })

})
/* ------------------------- product quantity change ------------------------ */
router.post('/change-product-quantity',  (req, res, next) => {


 
  userhelpers.changeProductQuantity(req.body).then(async(response) => {
response.total = await userhelpers.getTotalAmount(req.body.user)
  response.subTotal = await userhelpers.getSubTotal(req.body)
    
// let responses ={}
// responses.total=data
// if(response.removeProduct){
//   console.log('hggg');
//   responses.removeProduct = response.removeProduct
// }

// if(response.inc){
//   responses.inc = response.inc
// }


      res.json(response)

    
  })
})

/* ------------------------- delete carted products ------------------------- */

router.post('/delete-product',verifyLogin,(req,res)=>{
  
userhelpers.deleteProduct(req.body).then((response)=>{
  res.json(response)
})
})



/* ------------------------------- check out ------------------------------ */
router.get('/check-out',verifyLogin,async(req,res)=>{
   total =await userhelpers.getTotalAmount(req.session.user._id)
  
  res.render('user/place-order',{userheader,user:true,userName,total})
})

/* -------------------------------- checkout -------------------------------- */
router.post('/place-order',async (req,res)=>{
let products = await userhelpers.getCartProductList(req.body.userId)
let totalPrice=await userhelpers.getTotalAmount(req.body.userId)

  userhelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
if(req.body['payment-method'] =='COD'){

  res.json({codSuccess:true})
}else{
userhelpers.generateRazoepay(orderId,totalPrice).then((response)=>{
res.json(response)
})
}
  })

})
/* ------------------------------- get orders ------------------------------- */
router.get('/orders',verifyLogin,async(req,res)=>{
  let orders = await userhelpers.getOrderlist(userName._id)
  console.log(orders,"varanam");
  res.render('user/orders',{user:true,userheader,userName,orders})
})

/* ------------------------ razor pay payment verify ------------------------ */
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userhelpers.verifyPayment(req.body).then(()=>{
    userhelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment success');
      res.json({status:true})
    })
  }).catch(()=>{
    res.json({status:false,errMsg:'something went wrong'})
  })
})

module.exports = router;
