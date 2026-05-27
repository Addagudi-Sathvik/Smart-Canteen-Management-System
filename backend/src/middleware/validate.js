const { z } = require('zod');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          message: 'Validation failed',
          errors: messages,
        });
      }
      next(error);
    }
  };
};

const schemas = {
  // ✅ z.coerce converts FormData strings to correct types automatically
  menuItem: z.object({
    name:            z.string().min(2).max(100),
    category:        z.enum(['Snacks', 'Meals', 'Drinks', 'Combos']),
    description:     z.string().max(500).optional().default(''),
    price:           z.coerce.number().min(0),
    preparationTime: z.coerce.number().min(1),
    stock:           z.coerce.number().min(0).optional().default(50),
    availability:    z.string().optional().transform(v => v === 'true').pipe(z.boolean()).optional().default(true),
    imageUrl:        z.string().optional().default(''),
    isPopular:       z.string().optional().transform(v => v === 'true').pipe(z.boolean()).optional().default(false),
  }),

  order: z.object({
    items: z.array(z.object({
      menuItem: z.string(),
      name:     z.string(),
      quantity: z.coerce.number().min(1),
      price:    z.coerce.number().min(0),
    })).min(1, 'At least one item is required'),
    notes: z.string().max(300).optional().default(''),
  }),

  statusUpdate: z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']),
  }),

  userRole: z.object({
    role: z.enum(['student', 'staff', 'admin']),
  }),
};

module.exports = { validate, schemas };