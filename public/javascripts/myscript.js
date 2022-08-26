const { post, response } = require("../../app")

function addToCart(proID) {
    $.ajax({
        url: '/add-to-cart/' + proID,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
            }
            
        }
    })
}


function changeQuantity(cartId, proId,userID, count) {
    event.preventDefault()
    let quantity = parseInt(document.getElementById(proId).value)

    count = parseInt(count)

   
    $.ajax({

        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: proId,
            user:userID,
            count: count,
            quantity: quantity
        },
        //console.log(count),
        method: 'post',
        success: (response) => {
            console.log(response);
            
            if (response.removeProduct) {
                
                swal("Deleted!", "successfully deleted the product", "success").then(()=>{

                    location.reload()
                })
             
            } else {
                console.log(response.subTotal);
                document.getElementById(proId).value = quantity + count
                console.log('a'+proId);
                document.getElementById('a'+proId).innerHTML=response.subTotal 
                document.getElementById('subTotal').innerHTML=response.total 
               

            }


        }
    })
}


/* ----------------------------- delete product ----------------------------- */
function deleteProducts(cartId,proId){


$.ajax({
    url:'/delete-product',
    data:{
       cart:cartId,
        product: proId 

    },
    method:'post',
    success:(response)=>{
        swal("Deleted!", "successfully deleted the product", "success").then(()=>{

            location.reload()
        })
    }
})

}

/* ------------------------------- place order ------------------------------ */


function placeOrder(){
        $.ajax({
            url: '/place-order',
            method: 'post',
            data: $('.checkout-form').serialize(),
            success: (response) => {
             
                if(response.codSuccess){
                    swal({
                        title: "Order Placed!",
                        text: "Successfully placed your order,Press Ok to See your Orders!",
                        type: "success"
                    }).then(function() {
                        location.href = "/orders";
                    });
                    
                }else{
                  razorpayPayment(response)  
                }
            }
        })
   
}

function razorpayPayment(order){
    var options = {
        "key": "rzp_test_UjH0FVzTiZ7bG4", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Happy Heels",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature);

            verifyPayment(response,order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifyPayment(payment,order){
    $.ajax({
        url:'/verify-payment',
        data:{
            payment,
            order
        },
        method:'post',
        success:(response)=>{
             console.log(response);
            if(response.status){
                swal({
                    title: "Order Placed!",
                    text: "Successfully placed your order,Press Ok to See your Orders!",
                    type: "success"
                }).then(function() {
                    location.href = "/orders";
                });
            }else{
                alert(response.errMsg)
            }
        }
    })
}
