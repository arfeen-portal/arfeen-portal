export function requireModule(ctx: any, moduleKey: string) {
  const enabled = ctx.modules.find(
    (m: any) => m.module_key === moduleKey && m.enabled
  );

  if (!enabled) {
    throw new Error("MODULE_DISABLED");
  }
}
