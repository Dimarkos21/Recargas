const PAGE_URL = process.env.NODE_ENV === 'production'
? 'https://www.scorpiongaming.com.ve'
: "https://www.scorpiongaming.com.ve";
const PaypalUrl = "https://api-m.sandbox.paypal.com/v2/checkout/orders";
module.exports = { PAGE_URL , PaypalUrl}