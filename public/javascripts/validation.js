// const express = require('express')
// const app = express()


function validateName() {
    
    var nameError = document.getElementById('nameError');
    var name = document.getElementById('name').value;
    if (name.length == 0) {
        nameError.innerHTML = 'Name is required';
        return false;
    }
    if (name.length <4 || name.length >20) {
        nameError.innerHTML ='Invalid Name';
        return false;
    }
    if (!name.match(/^[A-Za-z-]*\s{0,1}[A-Za-z]*$/)) {
        nameError.innerHTML = 'write Name only';
        return false;
    }
    nameError.innerHTML = '';
    return true;
}
function validatePhonenum(){
    var phoneError =document.getElementById('phoneError');
    var phone = document.getElementById('phone').value 
    if(phone.length<10 || phone.length>11) {
       phoneError.innerHTML = 'Phone must be 10 digits';
       return false;
    }
    if(!phone.match(/^\+{0,2}([\-\. ])?(\(?\d{0,3}\))?([\-\. ])?\(?\d{0,3}\)?([\-\. ])?\d{3}([\-\. ])?\d{4}/)) {
       phoneError.innerHTML = 'Invalid Phone'
       return false;
    }
    phoneError.innerHTML = '';
    return true;
   
   }

function validateEmail(){
    const admindata = 'christo@gmail.com';
    var emailError = document.getElementById('emailError')
    var email = document.getElementById('email').value;
    

    if(email.length == 0 ){
        emailError.innerHTML = 'Email is required'
        return false;
    }
    if(!email.match(/^[a-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,6}$/)){
        emailError.innerHTML = 'Email invalid'
        return false;
    }

    // if( email == admindata){
    //     emailError.innerHTML = 'This Email cant be used'
    //     return false;
    // }
  
    emailError.innerHTML='';
    return true; 

}

function validatePassword(){
    var requiredpassword = document.getElementById('pass-error')
    var password = document.getElementById('pwd').value;

    if( password.length <8 && password.length>0){
    requiredpassword.innerHTML = 'Enter valid password';
    return false;
    }
    if( password.length ==0 ){
        requiredpassword.innerHTML = 'Password Required';
        return false;
        }

    requiredpassword.innerHTML='';
    return true;
}
function validateCpassword(){
    var cpassworderr=document.getElementById('cpass-error')
    var cpassword=document.getElementById('cpassword').value
    var password = document.getElementById('pwd').value
if(password==cpassword){
    cpassworderr.innerHTML=''
    return true;
}
cpassworderr.innerHTML="Incorrect Password"
return false;
}
function validateAdminEmail(){
    var emailError = document.getElementById('email-error')
    var email = document.getElementById('adminemail').value;
    console.log(email);

    if(email.length == 0 ){
        emailError.innerHTML = 'Email is required'
        return false;
    }
    if(!email.match(/^[a-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,6}$/)){
        emailError.innerHTML = 'Email invalid'
        return false;
    }
  
    emailError.innerHTML='';
    return true; 

}

function validateSubmit(){

    if(!validateEmail() || !validatePassword() || !validateName() || !validatePhonenum() ){
        var submitError = document.getElementById('bttn-error')
        submitError.style.display = 'block';
        submitError.innerHTML = 'please fill the form to submit';
        setTimeout(function(){submitError.style.display = 'none';}, 3000);
        return false;
    }
}