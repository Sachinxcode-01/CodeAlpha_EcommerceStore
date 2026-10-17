const orderService = require('../services/order.service');

class CartController {
  validateCart(req, res, next) {
    try {
      const { items } = req.body;
      const calculation = orderService.validateAndCalculateCart(items);
      res.status(200).json({
        success: true,
        data: calculation,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CartController();
