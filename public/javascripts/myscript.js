const e = require("express")
const { payment } = require("paypal-rest-sdk")
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


function changeQuantity(cartId, proId, userID, count) {
    event.preventDefault()
    let quantity = parseInt(document.getElementById(proId).value)

    count = parseInt(count)


    $.ajax({

        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: proId,
            user: userID,
            count: count,
            quantity: quantity
        },
        //console.log(count),
        method: 'post',
        success: (response) => {
            console.log(response);

            if (response.removeProduct) {

                swal("Deleted!", "successfully deleted the product", "success").then(() => {

                    location.reload()
                })

            } else {
                console.log(response.subTotal);
                document.getElementById(proId).value = quantity + count
                console.log('a' + proId);
                document.getElementById('a' + proId).innerHTML = response.subTotal
                document.getElementById('subTotal').innerHTML = response.total


            }


        }
    })
}


/* ----------------------------- delete product ----------------------------- */
function deleteProducts(cartId, proId) {


    $.ajax({
        url: '/delete-product',
        data: {
            cart: cartId,
            product: proId

        },
        method: 'post',
        success: (response) => {
            swal("Deleted!", "successfully deleted the product", "success").then(() => {

                location.reload()
            })
        }
    })

}

/* ---------------------- add address in checkout form ---------------------- */
function saveAddress() {
    $.ajax({
        url: '/add-address',
        method: 'post',
        data: $('#checkout-address-form').serialize(),
        success: (response) => {
            console.log(response);
            swal({
                title: "Address added!",
                text: " Successfully add addresss u entred!",
                icon: "success",
            }).then(function () {
                location.href = "/check-out";
            });

        }
    })
}

/* ------------------------------- place order ------------------------------ */


function placeOrder(event) {
    event.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('.checkout-form-m').serialize(),
        success: (response) => {

            if (response.codSuccess) {
                // swal({
                //     title: "Order Placed!",
                //     text: "Successfully placed your order,Press Ok to See your Orders!",
                //     type: "success"
                // }).then(function() {
                //     location.href = "/orders";
                // });
                location.href = "/order-success"

            } else if (response.RazorPay) {
                razorpayPayment(response)
            } else if (response.Paypal) {

                // paypalpayment(response)

                for (let i = 0; i < response.links.length; i++) {

                    if (response.links[i].rel === "approval_url") {

                        location.href = response.links[i].href;

                    }


                }
            } else if (response.walletSuccess) {
                location.href = "/order-success"
            }
        }
    })

}

function razorpayPayment(order) {
    var options = {
        "key": "rzp_test_UjH0FVzTiZ7bG4", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Happy Heels",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature);

            verifyPayment(response, order)
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

function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            console.log(response);
            if (response.status) {
                swal({
                    title: "Order Placed!",
                    text: "Successfully placed your order,Press Ok to See your Orders!",
                    type: "success"
                }).then(function () {
                    location.href = "/orders";
                });
            } else {
                alert(response.errMsg)
            }
        }
    })
}

// function paypalpayment(order){
// for(let i =0;i<payment.links.length;i++){
//     if(order.links[i].rel === 'approval_url'){
//         location.href= response.links[i].href;
//     }
// }
// }

function addAddress() {
    $.ajax({
        url: '/add-address',
        method: 'post',
        data: $('#address-form').serialize(),

        success: (response) => {
            console.log(response);
            swal({
                title: "Address added!",
                text: " Successfully add addresss u entred!",
                icon: "success",
            }).then(function () {
                location.href = "/User-Details";
            });

        }
    })

}

/* ----------------------------- coupon details ----------------------------- */
function coupon() {
    event.preventDefault()
    let coupon = document.getElementById('couponcode').value

    $.ajax({

        url: '/apply-coupon',
        data: {
            coupon
        },
        method: 'post',
        success: (response) => {
            var errorMessage = document.getElementById('Error-coupon')
            if (response.invalid) {
                errorMessage.innerHTML = "Enter A Valid Coupon"
                document.getElementById('discountRate').innerHTML = 0
                document.getElementById('discountedAmount').innerHTML = 0
                document.getElementById('finalPrice').innerHTML = "₹" + response.finalAmount
            } else if (response.dateErr) {
                document.getElementById('discountRate').innerHTML = 0
                document.getElementById('discountedAmount').innerHTML = 0
                document.getElementById('finalPrice').innerHTML = "₹" + response.finalAmount
                errorMessage.innerHTML = "The entered coupon has been Expired"
            } else if (response.used) {
                document.getElementById('discountRate').innerHTML = 0
                document.getElementById('discountedAmount').innerHTML = 0
                document.getElementById('finalPrice').innerHTML = "₹" + response.finalAmount
                errorMessage.innerHTML = "Coupon Already Used"
            } else {
                errorMessage.innerHTML = ""
                console.log(response.a)
                document.getElementById("applyCoupon").hidden = true
                document.getElementById("removeCoupon").hidden = false
                document.getElementById('discountRate').innerHTML = response.a.value + "%"
                document.getElementById('discountedAmount').innerHTML = "₹" + response.dicountedPrice
                document.getElementById('finalPrice').innerHTML = "₹" + response.finalAmount
            }
        }
    })
}



function RemoveCoupon(event) {
    event.preventDefault()
    console.log('remove coupon');
    $.ajax({
        url: '/remove-coupon',
        method: 'post',
        data: $('#coupon').serialize(),
        success: (response) => {
            console.log(response, 'loo');
            var errorMessage = document.getElementById('Error-coupon')
            document.getElementById('discountedAmount').innerHTML = 0
            document.getElementById('discountRate').innerHTML = 0
            document.getElementById("applyCoupon").hidden = false
            document.getElementById("removeCoupon").hidden = true
            errorMessage.innerHTML = ""
            document.getElementById('finalPrice').innerHTML = "₹" + response.totalAmount
        }
    })

}

/* -------------------------------- wisilist -------------------------------- */
function addtoWisilist(event, proId) {

    event.preventDefault(event)
    $.ajax({
        url: "/addTowisilist/" + proId,
        method: 'get',
        success: (response) => {
            swal("Added to Wisilist!", "Product Added Successfully", "success")
            location.reload();
        }
    })
}

function deletewisilistProduct(e, wisId, proId) {
    e.preventDefault()
    console.log("delete from ");
    console.log(wisId)
    console.log("delete from ");
    console.log(proId)
    $.ajax({

        url: "/delete-wisilistproduct",
        data: {
            wisilist: wisId,
            product: proId,
        },
        method: "post",
        success: (response) => {
            if (response.removed) {
                swal("Product Removed From Wishlist");
                location.reload();
            }
        },
    });
}

function deleteAddress(addressId) {

    $.ajax({
        url: '/delete-address',
        method: 'post',
        data: { addressId },
        success: (response) => {
            console.log(response)
            swal("Deleted!", "successfully deleted the Address", "success").then(() => {

                location.reload()
            })
        }
    })
}