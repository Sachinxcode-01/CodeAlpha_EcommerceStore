const express = require('express');
const orderController = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const { createOrderSchema } = require('../validations/order.schema');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/orders', requireAuth, validate(createOrderSchema), orderController.createOrder);
router.get('/orders', requireAuth, orderController.getUserOrders);
router.get('/orders/:id', requireAuth, orderController.getOrderDetails);

module.exports = router;
