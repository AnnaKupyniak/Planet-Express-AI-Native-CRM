import { z } from 'zod';

export const ClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  is_evil: z.boolean().optional().default(false),
  description: z.string().optional()
});

export const DeliverySchema = z.object({
  cargo_name: z.string().min(1, 'Cargo name is required'),
  reward_cash: z.preprocess(
    (val) => (val === undefined || val === null ? 0 : Number(val)),
    z.number().nonnegative('Reward cash must be a non-negative number')
  ),
  planet_id: z.preprocess((val) => Number(val), z.number().int().positive('Planet ID must be a positive integer')),
  client_id: z.preprocess((val) => Number(val), z.number().int().positive('Client ID must be a positive integer')),
});

export const AssignmentSchema = z.object({
  role_on_ship: z.string().min(1, 'Role on ship is required'),
  crew_member_id: z.preprocess((val) => Number(val), z.number().int().positive('Crew Member ID must be a positive integer')),
  delivery_id: z.preprocess((val) => Number(val), z.number().int().positive('Delivery ID must be a positive integer')),
});



export const CrewMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
});

export const UpdateDeliverySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});
