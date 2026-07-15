export const ensureEven = (size: number): number => {
  const roundedDown = Math.floor(size)
  return roundedDown % 2 === 0 ? roundedDown : roundedDown - 1
}
