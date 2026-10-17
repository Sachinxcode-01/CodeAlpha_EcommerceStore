const authService = require('../services/auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body);
      authService.setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        data: { user, token },
        message: 'Account registered successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);
      authService.setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        data: { user, token },
        message: 'Logged in successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  logout(req, res, next) {
    try {
      authService.clearAuthCookie(res);
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  getMe(req, res, next) {
    try {
      const user = authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
