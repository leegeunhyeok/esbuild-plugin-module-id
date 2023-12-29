import type { OnLoadArgs } from 'esbuild';

export interface ModuleIdOptions {
  onInitialize?: () => void;
  onGenerate?: (ids: ModuleIds) => void;
  generator?: ModuleIdGenerator;
  filter?: RegExp;
  namespace?: string;
}

export interface ModuleIdGenerator {
  initialize(): void;
  generateModuleId(args: OnLoadArgs): void;
  getIds(): ModuleIds;
}


// { [path]: ModuleId }
export type ModuleIds = Record<string, ModuleId>;
export type ModuleId = number;
