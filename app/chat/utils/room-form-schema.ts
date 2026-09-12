import { z } from 'zod'
import { calculateCharLength } from '@/lib/helpers'

export const MAX_ROOM_NAME_LENGTH = 20

export const roomFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '请填写房间名称')
    .refine(value => calculateCharLength(value) >= 2, '房间名称至少需要 2 个字符')
    .refine(
      value => calculateCharLength(value) <= MAX_ROOM_NAME_LENGTH,
      '房间名称最多 20 个字符，中文和表情按 2 个字符计算'
    ),
  description: z.string().trim().max(500, '描述不能超过 500 个字符').optional(),
  is_private: z.boolean(),
})
