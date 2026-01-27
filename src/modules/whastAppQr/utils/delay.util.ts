export async function delay(min: number, max: number) {
  const ms = Math.floor(Math.random() * (max - min) + min);
  return new Promise((res) => setTimeout(res, ms));
}
