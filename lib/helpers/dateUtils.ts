import { format } from 'date-fns'

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  try {
    return format(new Date(dateString), 'yyyy-MM-dd')
  } catch (e) {
    console.error('Invalid date string:', dateString, e)
    return '无效日期'
  }
}

export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  try {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss')
  } catch (e) {
    console.error('Invalid date string:', dateString, e)
    return '无效日期'
  }
}

export const calculateDaysDifference = (
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number | null => {
  if (!startDate || !endDate) return null
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}
