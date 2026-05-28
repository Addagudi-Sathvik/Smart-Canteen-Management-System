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
      menuItem: z.string().min(1, 'Invalid menu item id'),
      quantity: z.coerce.number().int().min(1),
      // Optional — prices/names are resolved from DB in orderController
      name:  z.string().optional(),
      price: z.coerce.number().min(0).optional(),
    })).min(1, 'At least one item is required'),
    pickupSlot: z
      .string()
      .min(1, 'Please select a pickup time slot.')
      .regex(
        /^([1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/i,
        'Pickup time must be in format like 10:00 AM (9:00 AM – 5:00 PM)'
      ),
    notes: z.string().max(300).optional().default(''),
    paymentMethod: z.enum(['online', 'counter']).optional().default('online'),
  }),

  statusUpdate: z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']),
  }),

  verifyQr: z
    .object({
      qrPayload: z.string().min(10).optional(),
      orderId:   z.string().min(1).optional(),
      token:     z.string().min(32).optional(),
    })
    .refine((d) => d.qrPayload || (d.orderId && d.token), {
      message: 'Provide qrPayload or both orderId and token',
    }),

  pickupLookup: z
    .object({
      orderId: z.string().min(1).optional(),
      token:   z.string().min(32).optional(),
    })
    .refine((d) => d.orderId || d.token, {
      message: 'Provide orderId or token',
    }),

  verifyPickup: z.object({
    qrToken: z.string().min(32, 'Verification token is required'),
  }),

  adminStatusUpdate: z.object({
    status: z.enum(['confirmed', 'preparing', 'ready', 'completed', 'cancelled']),
  }),

  adminVerifyPickup: z
    .object({
      orderId: z.string().min(1).optional(),
      qrPayload: z.string().min(10).optional(),
    })
    .refine((d) => d.orderId || d.qrPayload, {
      message: 'Provide orderId or qrPayload from scanned QR',
    }),

  counterOrder: z.object({
    items: z.array(z.object({
      menuItem: z.string().min(1),
      quantity: z.coerce.number().int().min(1),
    })).min(1),
    pickupSlot: z.string().min(1),
    notes: z.string().max(300).optional().default(''),
    customerName: z.string().max(100).optional().default(''),
  }),

  userRole: z.object({
    role: z.enum(['student', 'staff', 'admin']),
  }),
};

module.exports = { validate, schemas };