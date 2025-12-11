import type { TriggerType } from "@packages/database/schema";
import type { ConditionFieldDefinition } from "../types/conditions";
import {
   getFieldsForTrigger,
   getTriggerDefinition,
   getTriggerLabel,
   getTriggersByCategory,
   TRIGGER_DEFINITIONS,
   type TriggerDefinition,
} from "./definitions";

export type TriggerRegistry = {
   get: (type: TriggerType) => TriggerDefinition | undefined;
   getAll: () => TriggerDefinition[];
   getByCategory: (
      category: TriggerDefinition["category"],
   ) => TriggerDefinition[];
   getLabel: (type: TriggerType) => string;
   getFields: (type: TriggerType) => ConditionFieldDefinition[];
   isValidTrigger: (type: string) => type is TriggerType;
   register: (definition: TriggerDefinition) => void;
   unregister: (type: TriggerType) => void;
};

const customTriggers = new Map<TriggerType, TriggerDefinition>();

export function createTriggerRegistry(): TriggerRegistry {
   return {
      get(type: TriggerType): TriggerDefinition | undefined {
         return customTriggers.get(type) ?? getTriggerDefinition(type);
      },

      getAll(): TriggerDefinition[] {
         const custom = Array.from(customTriggers.values());
         const customTypes = new Set(custom.map((def) => def.type));
         const filteredBuiltIns = TRIGGER_DEFINITIONS.filter(
            (def) => !customTypes.has(def.type),
         );
         return [...filteredBuiltIns, ...custom];
      },

      getByCategory(
         category: TriggerDefinition["category"],
      ): TriggerDefinition[] {
         const builtIn = getTriggersByCategory(category);
         const custom = Array.from(customTriggers.values()).filter(
            (def) => def.category === category,
         );
         const merged = new Map<TriggerType, TriggerDefinition>();
         // First insert built-in triggers
         for (const def of builtIn) {
            merged.set(def.type, def);
         }
         // Then overwrite with custom triggers (custom wins)
         for (const def of custom) {
            merged.set(def.type, def);
         }
         return Array.from(merged.values());
      },

      getLabel(type: TriggerType): string {
         const custom = customTriggers.get(type);
         return custom?.label ?? getTriggerLabel(type);
      },

      getFields(type: TriggerType): ConditionFieldDefinition[] {
         const custom = customTriggers.get(type);
         return custom?.availableFields ?? getFieldsForTrigger(type);
      },

      isValidTrigger(type: string): type is TriggerType {
         const validTypes = [
            ...TRIGGER_DEFINITIONS.map((def) => def.type),
            ...Array.from(customTriggers.keys()),
         ];
         return validTypes.includes(type as TriggerType);
      },

      register(definition: TriggerDefinition): void {
         customTriggers.set(definition.type, definition);
      },

      unregister(type: TriggerType): void {
         customTriggers.delete(type);
      },
   };
}

export const triggerRegistry = createTriggerRegistry();
