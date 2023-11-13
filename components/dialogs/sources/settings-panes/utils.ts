export const prepareFields = (input: string) => {
  return input.split(',').map((v) => v.trim());
};
