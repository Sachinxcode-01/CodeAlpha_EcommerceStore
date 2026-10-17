const express = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const { productQuerySchema } = require('../validations/product.schema');

const router = express.Router();

router.get('/products', validate(productQuerySchema, 'query'), productController.listProducts);
router.get('/products/:idOrSlug', productController.getProduct);
router.get('/categories', productController.listCategories);

module.exports = router;
