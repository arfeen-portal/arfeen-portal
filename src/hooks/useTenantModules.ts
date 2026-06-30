"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isProvisioningModuleEnabled,
  portalModuleMapFromAllowed,
} from "@/lib/tenantModules";
import { getTenantByHost, isMasterHost, type TenantModuleKey } from "@/lib/tenantConfig";

type TenantModulesState = {
  loading: boolean;
  isMaster: boolean;
  moduleMap: Record<string, boolean>;
  navModules: Record<TenantModuleKey, boolean>;
  isModuleEnabled: (moduleKey: string) => boolean;
  isSidebarSectionEnabled: (sectionLabel: string, sectionModuleKey?: string) => boolean;
};

const emptyMap: Record<string, boolean> = {};

export function useTenantModules(host?: string | null): TenantModulesState {
  const [moduleMap, setModuleMap] = useState<Record<string, boolean>>(emptyMap);
  const [loading, setLoading] = useState(true);

  const resolvedHost =
    host ?? (typeof window === "undefined" ? null : window.location.host);

  const isMaster = isMasterHost(resolvedHost);
  const baseTenant = getTenantByHost(resolvedHost);

  useEffect(() => {
    let mounted = true;

    async function loadModules() {
      if (isMaster) {
        if (mounted) {
          setModuleMap(emptyMap);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const res = await fetch("/api/public/tenant-config", { cache: "no-store" });
        const json = await res.json();

        if (!mounted) return;

        if (json?.modules && Object.keys(json.modules).length > 0) {
          setModuleMap(json.modules);
        } else if (Array.isArray(json?.allowed_modules)) {
          setModuleMap(portalModuleMapFromAllowed(json.allowed_modules));
        } else {
          setModuleMap(emptyMap);
        }
      } catch {
        if (mounted) {
          setModuleMap(emptyMap);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadModules();
  }, [isMaster, resolvedHost]);

  const navModules = useMemo(() => {
    if (isMaster) {
      return baseTenant.modules;
    }

    if (!Object.keys(moduleMap).length) {
      return baseTenant.modules;
    }

    return {
      umrahPackages: Boolean(moduleMap.umrah),
      groupTickets: Boolean(moduleMap.group_tickets),
      hotels: Boolean(moduleMap.hotels),
      transport: Boolean(moduleMap.transport),
      visa: Boolean(moduleMap.visa),
      contact: Boolean(moduleMap.contact),
      agentLogin: Boolean(moduleMap.agents),
      bookNow: Boolean(moduleMap.contact),
    };
  }, [isMaster, baseTenant.modules, moduleMap]);

  const enabledModuleSet = useMemo(
    () =>
      new Set(
        Object.entries(moduleMap)
          .filter(([, enabled]) => enabled)
          .map(([key]) => key)
      ),
    [moduleMap]
  );

  const isModuleEnabled = (moduleKey: string) => {
    if (isMaster) return true;
    return isProvisioningModuleEnabled(enabledModuleSet, moduleKey);
  };

  const isSidebarSectionEnabled = (sectionLabel: string, sectionModuleKey?: string) => {
    if (isMaster) return true;

    const key = sectionModuleKey || sectionLabel.toLowerCase().replace(/\s+/g, "_");

    if (sectionLabel === "Branding") {
      return isModuleEnabled("branding") || isModuleEnabled("white_label");
    }

    return isModuleEnabled(key);
  };

  return {
    loading,
    isMaster,
    moduleMap,
    navModules,
    isModuleEnabled,
    isSidebarSectionEnabled,
  };
}
