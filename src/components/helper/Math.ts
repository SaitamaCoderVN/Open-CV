export const clamp = (num: number, min = 0, max = 100): number => {
    return Math.min(Math.max(num, min), max);
  };
  
  export const round = (num: number, precision = 0): number => {
    const modifier = 10 ** precision;
    return Math.round(num * modifier) / modifier;
  };
  
  export const adjust = (num: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  };