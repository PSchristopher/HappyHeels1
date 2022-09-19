const express = require('express');
const { response, render } = require('../app');
const router = express.Router();
const userhelpers = require('../helpers/user-helpers')
const adminhelpers = require('../helpers/admin-helpers')
// var jsImageZoom = require("js-image-zoom")

let userheader = true;
let userProfile = true;
let total

let userName

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
      console.log(req.session.user, "checkingggggg");
      res.redirect('/')
    } else {
      req.session.loginError = "Invalid Credentials"
      res.redirect('/user_signin')
    }
  })
})


/* GET index(home)  page */
router.get('/', async (req, res, next) => {
  userName = req.session.user
  console.log(req.session.user, 'session user');

  if (userName) {

    var cartCount = await userhelpers.getCartCount(req.session.user._id)

  }
  adminhelpers.viewCategories().then((show) => {
    adminhelpers.ViewBanner().then((banner) => {
      console.log(banner, "abreetftvteccv");
      res.render('user/index', { title: 'Home', home: true, user: true, userName, userheader, show, cartCount, banner })
    })
    // res.render('admin/view-category',{adminheader,show})
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
  console.log("req.body",req.body);
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

  adminhelpers.getProducts(req.body).then(async (items) => {
    await adminhelpers.viewCategories().then(async (show) => {
      console.log(items, "ijhgf");
      if (req.session.user) {
        var wispro = await userhelpers.getWisiPro(userName._id)
        console.log(wispro, "jiuhygtf");
        if (wispro.length != 0) {
          for (var i = 0; i < wispro[0].products.length; i++) {
            for (var j = 0; j < items.length; j++) {
              if (items[j]._id.toString() == wispro[0].products[i].toString()) {
                items[j].wishlist = true
                break;
              }
            }
          }
        }
      }
      console.log(items, "wisssssssssssssss");
      res.render('user/products', { user: true, userheader, items, show, userName, cartCount })
    })
  })
})

/* ----------------------------- product detail ----------------------------- */
router.get('/productdetail/:id', async (req, res) => {
  if (userName) {
    var cartCount = await userhelpers.getCartCount(req.session.user._id)
  }
  adminhelpers.getdetailedProducts(req.params.id).then((detailedview) => {
    console.log(detailedview, "hyg");

    res.render('user/product-detail', { user: true, detailedview, userheader, userName, cartCount })
  })
})

/* -------------------------- categorywise products ------------------------- */
router.get('/catWiseproducts/:id', async (req, res) => {
  if (userName) {
    var cartCount = await userhelpers.getCartCount(req.session.user._id)
  }
  adminhelpers.viewCategories().then((show) => {
    userhelpers.categoryWiseProductList(req.params.id).then((data) => {
      if (data.length != 0) {
        res.render('user/categorywise-products', { user: true, data, userheader, userName, cartCount, show })
      } else {
        res.redirect('/')
      }

    })
  })
})
/* ------------------------- post category for ajax ------------------------- */
router.post('/getCatproducts/:id', (req, res) => {
  userhelpers.categoryWiseProductList(req.params.id).then((data) => {
    console.log(data);
    // res.json(data)
    // res.redirect("/catWiseproducts")
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
  subtotal = await userhelpers.getCartSubTotal(req.session.user._id)
  for (var i = 0; i < products.length; i++) {
    products[i].subTotal = subtotal[i].suBtotal
  }
  if (cartCount > 0)
    total = await userhelpers.getTotalAmount(req.session.user._id)
  console.log(total, "hfffghj");
  if (total == 0) {
    res.redirect('/empty-cart')
  } else {
    res.render('user/cart', { user: true, userheader, products, userName, cartCount, total })
  }
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
router.post('/change-product-quantity', (req, res, next) => {



  userhelpers.changeProductQuantity(req.body).then(async (response) => {
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

router.post('/delete-product', verifyLogin, (req, res) => {

  userhelpers.deleteProduct(req.body).then((response) => {
    res.json(response)
  })
})



/* ------------------------------- check out ------------------------------ */
router.get('/check-out', verifyLogin, async (req, res) => {
  total = await userhelpers.getTotalAmount(req.session.user._id)

  if (total == undefined) {
    res.redirect('/empty-cart')
  }
  let userAddress = await userhelpers.getUserAddress(userName._id)
  console.log('userAddress');
  console.log(userAddress);
  userhelpers.getUserWallet(userName._id).then((wallet) => {
    res.render('user/place-order', { userheader, user: true, userName, total, userAddress, wallet })
  })
})

/* -------------------------------- checkout -------------------------------- */
router.post('/place-order', async (req, res) => {

  console.log(req.body, "body body");

  console.log(req.body.user);
  let products = await userhelpers.getCartProductList(req.body.user)
  let totalPrice = await userhelpers.getTotalAmount(req.body.user)
  let coupondata = await userhelpers.checkCouponData(req.body.user)
  let couponValue = await userhelpers.checkCouponValue(coupondata.code)
  console.log(totalPrice, "before");
  console.log(coupondata);
  console.log(couponValue);
  console.log("onnumilla");

  if (coupondata.code) {
    let discount = totalPrice / 100 * couponValue.value

    totalPrice = parseInt(totalPrice - discount)
    req.body.couponOffer = couponValue.value
  }
  console.log(totalPrice, "after");

  let walletAmn = await userhelpers.getUserWallet(userName._id)
  userhelpers.placeOrder(products, req.body, totalPrice, walletAmn.wallet).then((orderId) => {


    if (req.body['payment-method'] == 'COD') {

      res.json({ codSuccess: true })
    } else if (req.body['payment-method'] == 'Razorpay') {
      if (req.body.useWallet == 1) {
        totalPrice = totalPrice - walletAmn.wallet
      }

      userhelpers.generateRazoepay(orderId, totalPrice).then((response) => {
        console.log(response);

        response.RazorPay = true;
        res.json(response)
      })
    } else if (req.body['payment-method'] == 'Paypal') {
      if (req.body.useWallet == 1) {
        totalPrice = totalPrice - walletAmn.wallet
      }
      userhelpers.generatePayPal(orderId, totalPrice).then((response) => {
        response.Paypal = true
        res.json(response)
      })
    } else if (req.body['payment-method'] == 'Wallet') {
      res.json({ walletSuccess: true })
    }
  })

})
/* ------------------------------- get orders ------------------------------- */
router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userhelpers.getAllOrders(userName._id)
  console.log(orders,"hjk");
  res.render('user/all-orders', { user: true, userheader, userName, orders })
})

/* ----------------------------- post get orders ---------------------------- */
router.post('/order-cancel/:id', (req, res) => {
  console.log(req.params.id, "abced");
  userhelpers.cancelOrder(req.params.id,userName).then((response) => {
   
   
    res.json(response)
  })
})

/* ------------------------------ order return ------------------------------ */
router.post('/order-return', (req, res) => {
  console.log(req.body, 'kkkkkkkkkkkkkkkkkkkkkkkkkkk');
  console.log(userName, 'lllllllllllllllllllllllllllll');
  userhelpers.returnOrder(req.body, userName).then((response) => {
    console.log(response,"response");
    res.json(response)
  })
})


/* ----------------------------- detailed order ----------------------------- */
router.get('/orderdetail/:id', verifyLogin, (req, res) => {
  userhelpers.getDetailedOrder(req.params.id).then(async (orderdetail) => {
    // orders = await userhelpers.getAllOrders(userName._id)
    console.log(orderdetail, "orderdetails");

    let order = await userhelpers.getOrderProduct(req.params.id)
    console.log(order, 'order');
    res.render('user/order-detail', { user: true, userheader, userName, orderdetail, order })
  })
})

/* ------------------------ razor pay payment verify ------------------------ */
router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userhelpers.verifyPayment(req.body).then(() => {
    userhelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success');
      res.json({ status: true })
    })
  }).catch(() => {
    res.json({ status: false, errMsg: 'something went wrong' })
  })
})


/* ------------------------------ user profile ------------------------------ */
router.get('/User-Details', verifyLogin, async (req, res) => {

  await userhelpers.viewUserDetails(userName._id).then((userDetail) => {
    userhelpers.getUserWallet(userName._id).then((wallet) => {
      console.log(wallet, "kjnhbgv");
      console.log(userDetail);
      res.render('user/user-profile', { user: true, userProfile, userheader, userName, userDetail, wallet })
    })
  })
})
/* ---------------------------------view - coupons -------------------------------- */
router.get('/coupons', verifyLogin, (req, res) => {
  userhelpers.getUserWallet(userName._id).then((wallet) => {
    res.render('user/view-all-coupons', { user: true, userProfile, userheader, userName, wallet })
  })
})
/* -------------------- view user address in user profile ------------------- */
router.get('/show-address', verifyLogin, async (req, res) => {

  userAddress = await userhelpers.getUserAddress(userName._id)
  console.log(userAddress, "ioooooo");
  userhelpers.getUserWallet(userName._id).then((wallet) => {
    res.render('user/user-view-address', { user: true, userProfile, userheader, userName, wallet, userAddress })
  })
})
/* ---------------------------- user-add-address ---------------------------- */

router.get('/add-address', verifyLogin, (req, res) => {
  userhelpers.getUserWallet(userName._id).then((wallet) => {
    res.render('user/user-add-address', { user: true, userheader, userProfile, wallet, userName })
  })
})

/* ----------------------------- add-new-address ---------------------------- */

router.post('/add-address', verifyLogin, (req, res) => {

  console.log(req.body, "gtrertyuik");
  userhelpers.addNewAddress(userName._id, req.body).then((response) => {
    res.json(response)
  })
})
/* --------------------------- delete user address -------------------------- */
router.post('/delete-address', async (req, res) => {

  await userhelpers.deleteAddress(req.body)

  res.json({ status: true })
})
/* ---------------------------- edit user address --------------------------- */
router.get('/edit-address/:id', verifyLogin, async (req, res) => {
  let address = await userhelpers.getSingleAddress(req.params.id)
  userhelpers.getUserWallet(userName._id).then((wallet) => {
    console.log(address, "jhgfdsfgyhuji");

    res.render('user/editAddress', { user: true, userheader, wallet, userName, address })
  })
})
router.post('/viewAddress/edit/:id', async (req, res) => {
  userhelpers.updateAddress(req.body, req.params.id).then((response) => {

    res.redirect('/show-address')
  })
})



/* ------------------------------ apply coupon ------------------------------ */
router.post('/apply-coupon', (req, res) => {
  console.log(req.body)
  userhelpers.applyCoupon(req.body, req.session.user._id).then(async (response) => {
    console.log(response, "hi helo");

    if (response.a) {

      let total = await userhelpers.getTotalAmount(req.session.user._id)

      let couponDiscount = total * parseInt(response.a.value) / 100

      let amount = total - couponDiscount
      response.dicountedPrice = Math.round(couponDiscount)
      response.finalAmount = Math.round(amount);

      res.json(response)
    } else {
      let total = await userhelpers.getTotalAmount(req.session.user._id)
      response.finalAmount = total
      res.json(response)
    }
  })
})

/* ------------------------------ REMOVE COUPON ----------------------------- */

router.post('/remove-coupon', async (req, res) => {

  await userhelpers.removeCoupon(userName._id).then(async (response) => {
    response.totalAmount = await userhelpers.getTotalAmount(userName._id)
    console.log(response);
    console.log(response.totalAmount);
    res.json(response)
  })
})
/* ----------------------------- addto wisilist ----------------------------- */
router.get("/addTowisilist/:id", verifyLogin, (req, res) => {
  userhelpers.addToWisilist(req.params.id, userName._id).then((response) => {

    res.json(response)
  })
})

/* -------------------------------- wisilist -------------------------------- */

router.get('/wisilist', verifyLogin, async (req, res) => {
  var prolist = await userhelpers.getwishlistpro(userName._id)
  console.log(prolist, "iiiiiiiiiiiiiiii");

  res.render('user/wisilist', { user: true, userheader, userName, prolist })
})

/* -------------------------- remove from wisilist -------------------------- */
router.post('/delete-wisilistproduct', async (req, res, next) => {

  console.log('shshsshshshsshsh');
  console.log(req.body.wisilist);
  console.log('req.body.wallet');
  console.log(req.body.product);
  console.log('req.body.product');
  await userhelpers.deletewisilistProduct(req.body.wisilist, req.body.product).then((response) => {

    res.json(response)
  })

})

router.get("/order-success", (req, res) => {
  userhelpers.deleteCartProducts(userName._id)
  res.render("user/order-success", { user: true, userheader, userName })
})

/* --------------------------- USE WALLET BALANCE --------------------------- */

router.post('/usewallet', async (req, res) => {

  console.log(req.body, 'body total wallet');
  let walletAmnt = await userhelpers.getUserWallet(userName._id)
  console.log(walletAmnt.wallet, "hb");
  await userhelpers.useWallet(req.body, userName, walletAmnt.wallet).then((response) => {
    console.log('heloooii');
    console.log(response);
    res.json(response)
  })
})


router.post('/removewallet', async (req, res) => {

  let walletAmnt = await userhelpers.getUserWallet(userName._id)
  await userhelpers.removeWallet(userName, req.body, walletAmnt.wallet).then((response) => {
    res.json(response)
  })
})




/* ------------------------------- empty cart ------------------------------- */
router.get("/empty-cart", (req, res) => {
  res.render("user/emptyCart", { user: true, userheader, userName })
})


/* ---------------------------------- error --------------------------------- */
router.get('/error', (req, res) => {

  res.render('error')
})

module.exports = router;