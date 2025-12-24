import type {
   ConsequenceDefinitions,
   DefaultConsequences,
} from "../types/consequence";
import type { Rule } from "../types/rule";
import { generateId } from "../utils/id";

export type RuleVersion<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly versionId: string;
   readonly ruleId: string;
   readonly version: number;
   readonly rule: Rule<TContext, TConsequences>;
   readonly createdAt: Date;
   readonly createdBy?: string;
   readonly comment?: string;
   readonly changeType: "create" | "update" | "delete" | "enable" | "disable";
};

export type VersionHistory<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly ruleId: string;
   readonly currentVersion: number;
   readonly versions: ReadonlyArray<RuleVersion<TContext, TConsequences>>;
};

export type VersionStore<
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
> = {
   readonly histories: ReadonlyMap<
      string,
      VersionHistory<TContext, TConsequences>
   >;
};

export const createVersionStore = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(): VersionStore<TContext, TConsequences> => ({
   histories: new Map(),
});

export const addVersion = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   rule: Rule<TContext, TConsequences>,
   changeType: RuleVersion<TContext, TConsequences>["changeType"],
   options: { createdBy?: string; comment?: string } = {},
): VersionStore<TContext, TConsequences> => {
   const histories = new Map(store.histories);
   const existingHistory = histories.get(rule.id);

   const currentVersion = existingHistory
      ? existingHistory.currentVersion + 1
      : 1;

   const version: RuleVersion<TContext, TConsequences> = {
      versionId: generateId(),
      ruleId: rule.id,
      version: currentVersion,
      rule: { ...rule },
      createdAt: new Date(),
      createdBy: options.createdBy,
      comment: options.comment,
      changeType,
   };

   const newHistory: VersionHistory<TContext, TConsequences> = {
      ruleId: rule.id,
      currentVersion,
      versions: existingHistory
         ? [...existingHistory.versions, version]
         : [version],
   };

   histories.set(rule.id, newHistory);

   return { histories };
};

export const getHistory = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   ruleId: string,
): VersionHistory<TContext, TConsequences> | undefined => {
   return store.histories.get(ruleId);
};

export const getVersion = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   ruleId: string,
   version: number,
): RuleVersion<TContext, TConsequences> | undefined => {
   const history = store.histories.get(ruleId);
   if (!history) return undefined;
   return history.versions.find((v) => v.version === version);
};

export const getLatestVersion = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   ruleId: string,
): RuleVersion<TContext, TConsequences> | undefined => {
   const history = store.histories.get(ruleId);
   if (!history || history.versions.length === 0) return undefined;
   return history.versions[history.versions.length - 1];
};

export const getAllVersions = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   ruleId: string,
): ReadonlyArray<RuleVersion<TContext, TConsequences>> => {
   const history = store.histories.get(ruleId);
   return history?.versions ?? [];
};

export const rollbackToVersion = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   ruleId: string,
   targetVersion: number,
   options: { createdBy?: string; comment?: string } = {},
): {
   store: VersionStore<TContext, TConsequences>;
   rule: Rule<TContext, TConsequences> | undefined;
} => {
   const targetVersionRecord = getVersion(store, ruleId, targetVersion);
   if (!targetVersionRecord) {
      return { store, rule: undefined };
   }

   const rolledBackRule: Rule<TContext, TConsequences> = {
      ...targetVersionRecord.rule,
      updatedAt: new Date(),
   };

   const newStore = addVersion(store, rolledBackRule, "update", {
      createdBy: options.createdBy,
      comment: options.comment ?? `Rollback to version ${targetVersion}`,
   });

   return { store: newStore, rule: rolledBackRule };
};

export const compareVersions = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   ruleId: string,
   version1: number,
   version2: number,
): {
   version1: RuleVersion<TContext, TConsequences> | undefined;
   version2: RuleVersion<TContext, TConsequences> | undefined;
   differences: ReadonlyArray<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
   }>;
} | null => {
   const v1 = getVersion(store, ruleId, version1);
   const v2 = getVersion(store, ruleId, version2);

   if (!v1 || !v2) {
      return null;
   }

   const differences: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
   }> = [];

   const compareFields = [
      "name",
      "description",
      "priority",
      "enabled",
      "stopOnMatch",
      "category",
   ] as const;

   for (const field of compareFields) {
      const oldValue = v1.rule[field];
      const newValue = v2.rule[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
         differences.push({ field, oldValue, newValue });
      }
   }

   if (
      JSON.stringify(v1.rule.conditions) !== JSON.stringify(v2.rule.conditions)
   ) {
      differences.push({
         field: "conditions",
         oldValue: v1.rule.conditions,
         newValue: v2.rule.conditions,
      });
   }

   if (
      JSON.stringify(v1.rule.consequences) !==
      JSON.stringify(v2.rule.consequences)
   ) {
      differences.push({
         field: "consequences",
         oldValue: v1.rule.consequences,
         newValue: v2.rule.consequences,
      });
   }

   if (JSON.stringify(v1.rule.tags) !== JSON.stringify(v2.rule.tags)) {
      differences.push({
         field: "tags",
         oldValue: v1.rule.tags,
         newValue: v2.rule.tags,
      });
   }

   return { version1: v1, version2: v2, differences };
};

export const getVersionsByDateRange = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   startDate: Date,
   endDate: Date,
): ReadonlyArray<RuleVersion<TContext, TConsequences>> => {
   const versions: RuleVersion<TContext, TConsequences>[] = [];

   for (const history of store.histories.values()) {
      for (const version of history.versions) {
         if (version.createdAt >= startDate && version.createdAt <= endDate) {
            versions.push(version);
         }
      }
   }

   return versions.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
   );
};

export const getVersionsByChangeType = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   changeType: RuleVersion<TContext, TConsequences>["changeType"],
): ReadonlyArray<RuleVersion<TContext, TConsequences>> => {
   const versions: RuleVersion<TContext, TConsequences>[] = [];

   for (const history of store.histories.values()) {
      for (const version of history.versions) {
         if (version.changeType === changeType) {
            versions.push(version);
         }
      }
   }

   return versions;
};

export const pruneOldVersions = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   store: VersionStore<TContext, TConsequences>,
   keepCount: number,
): VersionStore<TContext, TConsequences> => {
   const histories = new Map<string, VersionHistory<TContext, TConsequences>>();

   for (const [ruleId, history] of store.histories) {
      const prunedVersions =
         history.versions.length > keepCount
            ? history.versions.slice(-keepCount)
            : history.versions;

      histories.set(ruleId, {
         ruleId,
         currentVersion: history.currentVersion,
         versions: prunedVersions,
      });
   }

   return { histories };
};

export const formatVersionHistory = <
   TContext = unknown,
   TConsequences extends ConsequenceDefinitions = DefaultConsequences,
>(
   history: VersionHistory<TContext, TConsequences>,
): string => {
   const lines: string[] = [
      `=== Version History for Rule: ${history.ruleId} ===`,
      `Current Version: ${history.currentVersion}`,
      `Total Versions: ${history.versions.length}`,
      "",
   ];

   for (const version of history.versions) {
      lines.push(
         `v${version.version} - ${version.changeType} (${version.createdAt.toISOString()})`,
      );
      if (version.createdBy) {
         lines.push(`  By: ${version.createdBy}`);
      }
      if (version.comment) {
         lines.push(`  Comment: ${version.comment}`);
      }
   }

   return lines.join("\n");
};
