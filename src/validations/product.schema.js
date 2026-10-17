const { z } = require('zod');

const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'rating', 'name-asc']).default('newest'),
  featured: z.enum(['true', 'false', '1', '0']).optional(),
});

module.exports = {
  productQuerySchema,
};
