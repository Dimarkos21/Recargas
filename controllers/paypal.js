
const paypalRouter = require('express').Router(); // Router sigue siendo adecuado
const {PAGE_URL, PaypalUrl} = require("../config")

paypalRouter.get("/create-order", (req,res) => {
    const order = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: "55.00"
                }
            }
        ],
        application_context: {
            brand_name: "Inventary",
            landing_page: "NO_PREFERNCE",
            user_action: "PAY_NOW",
            return_url: `${PAGE_URL}/capture-order`,
            cancel_url: `${PAGE_URL}/cancel-order`
        }
    }
});

const params = new URLSearchParams();
    params.append("grant_type","client_credentials");


const {data:{access_token}}= await axios.post(`${PaypalUrl}/v2/checkout/orders`,params,
    {
        auth: {
            username: Paypal_ID , 
            password: PaypalToken,
        }
    }
)
const response = await axios.post(`${PaypalUrl}/v1/oauth2/token`,order, {
    headers: {
        Authorization: `Bearer ${access_token}`
    }
})
console.log(response.data)
paypalRouter.get("/capture-order", (req,res)=> res.send("Order Created"));
paypalRouter.get("/cancel-order", (req,res)=> res.semd("cancel payment"));

module.exports =  paypalRouter