function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function logoutUser(): Promise<void> {
  await delay(500);
  // TODO: replace with real auth logout logic
  console.log('logout');
}

export async function withdrawUser(): Promise<void> {
  await delay(700);
  // TODO: replace with real account withdrawal API
  console.log('withdraw');
}
