export function messageText(value: string): string {
  return value.replace(/<mention\b[^>]*>(.*?)<\/mention>/gis, '$1')
}
