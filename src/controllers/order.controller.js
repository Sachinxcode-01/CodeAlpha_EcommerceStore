const orderService = require('../services/order.service');

class OrderController {
  createOrder(req, res, next) {
    try {
      const order = orderService.createOrder(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: { order },
        message: 'Order created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  getUserOrders(req, res, next) {
    try {
      const orders = orderService.getUserOrders(req.user.id);
      res.status(200).json({
        success: true,
        data: { orders },
      });
    } catch (err) {
      next(err);
    }
  }

  getOrderDetails(req, res, next) {
    try {
      const { id } = req.params;
      const isAdmin = req.user.role === 'admin';
      const order = orderService.getOrderById(id, req.user.id, isAdmin);
      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();
