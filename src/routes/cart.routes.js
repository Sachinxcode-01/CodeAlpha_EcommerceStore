const express = require('express');
const cartController = require('../controllers/cart.controller');
const validate = require('../middleware/validate');
const { validateCartSchema } = require('../validations/order.schema');

const router = express.Router();

router.post('/cart/validate', validate(validateCartSchema), cartController.validateCart);

module.exports = router;
