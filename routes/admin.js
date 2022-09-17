const express = require('express');
const router = express.Router();
const adminhelpers = require('../helpers/admin-helpers')
const multer = require('../config/imageUpload');
const { response } = require('../app');
const userHelpers = require('../helpers/user-helpers');



/*admin login */
router.get('/login', (req, res, next) => {
  if (req.session.adminloggedIn)
    res.redirect('/admin')
  else
    res.render('admin/admin-login')
})
const adminemail = "christo@gmail.com"
const adminpass = "12345"

router.post('/login', (req, res) => {

  const { email, password } = req.body

  if (adminemail == email && adminpass == password) {
    req.session.adminloggedIn = true

    res.redirect('/admin')
  } else {
    res.redirect('/admin/login')
  }

})

/* --------------------------------- logout --------------------------------- */

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/admin/login')
})

let adminheader = true;
/* GET home page. */
router.get('/', async function (req, res, next) {
  if (req.session.adminloggedIn) {
    let year = new Date().getFullYear()
    let value = await adminhelpers.paymentMethodChart()
    let yearData = await adminhelpers.yearChart()
    let categorySale = await adminhelpers.getCategoryChart(year)

    console.log("value", value);
    res.render('admin/admin-index', { title: 'Express', adminheader, value,categorySale });
  } else {   
    res.redirect('/admin/login')
  }
});



/*admin user management*/
router.get('/usermanagement', (req, res) => {
  adminhelpers.seeAllusers().then((usersData) => {

    res.render('admin/user-management', { usersData, adminheader })
  })
})

/*block user */
router.get('/usermanagement/:id', (req, res) => {

  let proId = req.params.id

  adminhelpers.blockUser(proId).then((data) => {
    res.redirect('/admin/usermanagement')
  })
})


// Unblock User

router.get('/usermanagements/:id', (req, res) => {
  let proId = req.params.id
  adminhelpers.unblockUser(proId).then((data) => {
    res.redirect('/admin/usermanagement')
  })
})
//product-management
router.get('/products', (req, res) => {
  adminhelpers.getProducts(req.body).then((items) => {
    console.log("this was a good one", items);

    res.render('admin/product-management', { adminheader, items })
  })
})

//add-products
router.get('/add-products', (req, res) => {
  adminhelpers.viewCategories(req.body).then((show) => {
    res.render('admin/add-products', { adminheader, show })
  })
})
router.post('/add-products', multer.upload.array('image', 4), (req, res) => {
  //  req.body.image=req.files.filename


  adminhelpers.addProduct(req.body).then((products) => {
    let image = req.files.image;
  })
  var filename = req.files.map(function (file) {
    return file.filename;
  })
  req.body.image = filename
  res.redirect('/admin/add-products')
})
/* ----------------------------- delete product ----------------------------- */
router.get('/delete-product/:id', (req, res) => {
  let prodId = req.params.id

  adminhelpers.deleteProduct(prodId).then((response) => {
    res.redirect('/admin/products')
  })
})
/* ------------------------------ edit product ------------------------------ */
router.get('/edit-product/:id', async (req, res) => {

  let producId = await adminhelpers.editProduct(req.params.id)
  adminhelpers.viewCategories().then((show) => {
    adminhelpers.findCategory(producId.category).then((categry) => {

      res.render('admin/edit-product', { adminheader, producId, show, categry })
    })
  })
})

router.post('/updateproducts/:id', multer.upload.array('image', 4), (req, res) => {
  console.log(req.body);
  var filename = req.files.map(function (file) {
    return file.filename
  })
  req.body.image = filename

  adminhelpers.updateProduct(req.params.id, req.body).then((uproduct) => {

  })
  res.redirect('/admin/products')
})

/* ----------------------------- //view category ---------------------------- */
router.get('/view-category', (req, res) => {
  adminhelpers.viewCategories().then((show) => {

    res.render('admin/view-category', { adminheader, show })
  })
})

/* ----------------------------- delete category ---------------------------- */
router.get('/delete-category/:id', (req, res) => {
  let cateId = req.params.id
  console.log("ytfdfghj", cateId);
  adminhelpers.deleteCategory(cateId).then((response) => {
    res.redirect('/admin/view-category')
  })
})
/* ------------------------------ edit category ----------------------------- */
router.get('/edit-category/:id', async (req, res) => {
  let categoryId = await adminhelpers.editcategory(req.params.id)
  adminhelpers.viewCategories().then((show) => {
    res.render('admin/edit-category', { adminheader, categoryId, show })
  })
})
router.post('/updatecategory/:id', multer.upload.array('image', 4), (req, res) => {
  console.log("dfgh", req.body);
  var filename = req.files.map(function (file) {
    return file.filename
  })
  req.body.image = filename
  adminhelpers.updateCategory(req.params.id, req.body).then((data) => {
  })
  res.redirect('/admin/view-category')
})
/* ----------------------------- //add category ----------------------------- */

router.get('/add-category', (req, res,) => {
  res.render('admin/add-category', { adminheader, Err: req.session.Errmsg, Succ: req.session.Sucmsg })
  req.session.Errmsg = false
  req.session.Sucmsg = false
})

/* ------------------------- // post add cattgories ------------------------- */
router.post('/add-category', multer.upload.single("image"), (req, res, next) => {
  req.body.image = req.file.filename
  adminhelpers.addCategory(req.body).then((data) => {

    if (data.status) {
      req.session.Errmsg = data.message
      res.redirect('/admin/add-category')


    } else {
      req.session.Sucmsg = data.message
      res.redirect('/admin/add-category')


    }
  })

})
/* ----------------------------- view all orders ---------------------------- */
router.get('/view-orders', (req, res) => {
  adminhelpers.viewAllOrders().then((orderData) => {

    res.render('admin/view-orders', { adminheader, orderData })
  })
})
/* ------------------------------ update order ------------------------------ */
router.post('/updateOrderStatus', (req, res) => {
  adminhelpers.updateOrderStatus(req.body).then((response) => {
    console.log(response, "ghhh");
    let reponse = {}
    reponse.value = response
    reponse.status = true
    console.log(reponse, 'hbv');
    res.json(reponse)
  })
})






/* ------------------------------ add a banner ------------------------------ */
router.get('/add-Banner', (req, res) => {

  res.render('admin/addBanner', { adminheader })
})

/* ------------------------------ add a banner post------------------------------ */
router.post('/add-Banner', multer.upload.single("image"), (req, res) => {
  req.body.image = req.file.filename
  console.log(req.body);
  adminhelpers.addBanner(req.body).then((response) => {
    let BnSuc = response.true
    res.redirect('/admin/add-Banner')
  })
})

/* ------------------------------- view banner ------------------------------ */
router.get('/view-banner', (req, res) => {
  adminhelpers.ViewBanner().then((data) => {
    console.log(data, "iuytfresdrftyg");
    res.render('admin/view-Banner', { adminheader, data })
  })
})

/* -------------------------------------------------------------------------- */
/*                                delete banner                               */
/* -------------------------------------------------------------------------- */
router.post('/delete-banner', async (req, res) => {
  console.log(req.body, "im so lonely");

  let result = await adminhelpers.deleteBanner(req.body).then((response) => {
    console.log(response);
    res.json(response)
  })
})


/* ------------------------------ sales report ------------------------------ */
router.get('/sales-report', (req, res) => {
  res.render('admin/sales-report', { adminheader })
})


router.post('/sales-report', (req, res) => {
  console.log(req.body)

  adminhelpers.showSalesReport(req.body).then((data) => {
    console.log(data, "fine")
    res.render("admin/sales-report", { adminheader, data })
  })
})


/* ---------------------------- coupon management --------------------------- */
router.get('/add-coupon', (req, res) => {
  res.render('admin/add-coupon', { adminheader, err: req.session.Errmsg, succ: req.session.Sucmsg })
  req.session.Sucmsg = false
  req.session.Errmsg = false
})
router.post('/addCoupon', (req, res) => {
  console.log(req.body, "coupon details");
  adminhelpers.addCoupon(req.body).then((data) => {
    if (data.status) {
      req.session.Errmsg = data.message
      res.redirect('/admin/add-coupon')

    } else {
      req.session.Sucmsg = data.message
      res.redirect('/admin/add-coupon')
    }
  })

})
/* ----------------------------- view all coupon ---------------------------- */
router.get('/view-Coupon', (req, res) => {
  adminhelpers.viewCoupon().then((couponList) => {
    console.log(couponList);
    res.render('admin/view-coupon', { adminheader, couponList })
  })
})
/* ------------------------- block or ublock coupon ------------------------- */
router.post('/couponAction/:id', (req, res) => {
  console.log(req.params.id, "coupnid");
  adminhelpers.manageCoupon(req.params.id).then((response) => {
    res.json(response)
  })
})
/* ------------------------------- add category offer ------------------------------ */
router.get('/add-categoryoffer', async (req, res) => {
  let categori = await adminhelpers.viewCategories()
  console.log(categori, "iuygf");
  res.render('admin/offer', { adminheader, categori })
})
router.post('/add-newoffers', async (req, res) => {
  console.log(req.body, "categoru offer");
  let offer = req.body.Offer
  console.log(offer, "oferrrrrrrrrrr");
  if (req.body.category != "") {
    let products = await userHelpers.categoryWiseProductList(req.body.category)
    let newprice;
    let updateOffer;
    for (var i = 0; i < products.length; i++) {
      if (products[i].originalPrice) {
        newprice = Math.round((products[i].originalPrice)*((100-offer)/100))
      } else {
        newprice = Math.round((products[i].price) * ((100 - offer) / 100))
      }
      updateOffer = await adminhelpers.updateOffer(products[i]._id, newprice, offer)
    }
  }
  res.redirect('back')
})


module.exports = router; 
