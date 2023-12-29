import type { OnLoadArgs } from 'esbuild';

export interface ModuleIdOptions {
  onGenerate: (ids: ModuleIds) => void;
  generator?: ModuleIdGenerator;
  filter?: RegExp;
  namespace?: string;
}

export interface ModuleIdGenerator {
  initialize(): void;
  generateModuleId(args: OnLoadArgs): void;
  getIds(): ModuleIds;
}

export type ModuleId = number;

// { [path]: ModuleId }
export type ModuleIds = Record<string, ModuleId>;
