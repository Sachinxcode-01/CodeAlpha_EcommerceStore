const productService = require('../services/product.service');

class ProductController {
  listProducts(req, res, next) {
    try {
      const result = productService.listProducts(req.query);
      res.status(200).json({
        success: true,
        data: {
          products: result.products,
        },
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  getProduct(req, res, next) {
    try {
      const { idOrSlug } = req.params;
      const product = productService.getProductByIdOrSlug(idOrSlug);
      res.status(200).json({
        success: true,
        data: { product },
      });
    } catch (err) {
      next(err);
    }
  }

  listCategories(req, res, next) {
    try {
      const categories = productService.listCategories();
      res.status(200).json({
        success: true,
        data: { categories },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
