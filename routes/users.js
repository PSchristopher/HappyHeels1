const express = require('express');
const { response } = require('../app');
const router = express.Router();
const userhelpers = require('../helpers/user-helpers')
const adminhelpers=require('../helpers/admin-helpers')

let userheader=true;


/* GET signup page */
router.get('/user_signup', function(req, res) {
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/signup',{signupErr:req.session.signupError,user:true})
    req.session.signupError=false
  }
});
router.post('/user_signup',(req,res)=>{
  userhelpers.doSignUp(req.body).then((response)=>{

    if(response.status){

      req.session.signupError='User email already exist'
      res.redirect('/user_signup')
    
    }else{
     
      res.redirect('/user_signin')

    }
  })
})




/* GET login page */
router.get('/user_signin', function(req, res,next) {

  if(req.session.loggedIn){

    res.redirect('/')
    
  }else{

    res.render('user/login',{title:'Login',loginErr:req.session.loginError, user:true})
    req.session.loginError=false
  }
 });
 
router.post('/user_signin',(req,res)=>{
  userhelpers.doLogin(req.body).then((response)=>{
if(response.status){

  req.session.loggedIn=true
  req.session.user=response.user
  res.redirect('/')
}else{
  req.session.loginError="Invalid Credentials"
  res.redirect('/user_signin')
}
  })
})

/* GET index(home)  page */
router.get('/', function(req, res, next) {
  let userName =req.session.user
  adminhelpers.viewCategories().then((show)=>{

    // res.render('admin/view-category',{adminheader,show})
    res.render('user/index',{title:'Home',user:true, userName, userheader,show})
  })

});

router.get('/user_logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

//



//all products

router.get('/allproducts',(req,res)=>{
  adminhelpers.getProducts(req.body).then((items)=>{
  
    res.render('user/products',{user:true,userheader,items})
  })
})

/* ----------------------------- product detail ----------------------------- */
router.get('/productdetail/:id',(req,res)=>{
  adminhelpers.getdetailedProducts(req.params.id).then((detailedview)=>{
    
  res.render('user/product-detail',{user:true,detailedview})
})
})

module.exports = router;
