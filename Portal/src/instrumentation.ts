export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ejecutarInit } = await import("@/server/init");
  ejecutarInit();
}
