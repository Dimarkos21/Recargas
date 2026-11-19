const PAGE_URL = process.env.NODE_ENV === 'production'
? 'https://optigest.com.ve'
: "https://optigest.com.ve";
const PaypalUrl = "https://api-m.sandbox.paypal.com/v2/checkout/orders";
module.exports = { PAGE_URL , PaypalUrl}