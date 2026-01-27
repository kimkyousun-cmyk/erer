function envFlag(name: string) {
  const raw = process.env[name];
  if (!raw) return false;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function getPanicSwitches() {
  return {
    disableGeneration: envFlag("DISABLE_GENERATION"),
    disableExports: envFlag("DISABLE_EXPORTS"),
    disableWebhooks: envFlag("DISABLE_WEBHOOKS"),
    disableSignup: envFlag("DISABLE_SIGNUP"),
    readOnlyMode: envFlag("READ_ONLY_MODE")
  };
}

export function assertNotDisabled(flag: boolean, message: string) {
  if (flag) {
    throw new Error(message);
  }
}
