const { z } = require('zod');

const cartItemSchema = z.object({
  product_id: z.coerce.number().int().positive('Invalid product ID'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than zero').max(99, 'Quantity cannot exceed 99 units'),
});

const validateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
});

const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Order must contain at least one item'),
  shipping_address: z.object({
    full_name: z.string().trim().min(2, 'Recipient name is required'),
    street: z.string().trim().min(3, 'Street address is required'),
    city: z.string().trim().min(2, 'City is required'),
    state: z.string().trim().min(2, 'State / Province is required'),
    postal_code: z.string().trim().min(3, 'Postal / ZIP code is required'),
    phone: z.string().trim().min(6, 'Valid phone number is required'),
  }),
  payment_method: z.enum(['cod', 'mock_card']).default('cod'),
});

module.exports = {
  cartItemSchema,
  validateCartSchema,
  createOrderSchema,
};
