
import type { OnLoadArgs } from 'esbuild';
import { ModuleIdGenerator, ModuleIds } from './types';

export class DefaultModuleIdGenerator implements ModuleIdGenerator {
  // Entry point module id is always 0.
  private static ENTRY_POINT_MODULE_ID = 0;
  private INTERNAL_id = DefaultModuleIdGenerator.ENTRY_POINT_MODULE_ID + 1;
  private INTERNAL_moduleIds: ModuleIds = {};

  public initialize() {
    this.INTERNAL_id = DefaultModuleIdGenerator.ENTRY_POINT_MODULE_ID + 1;
    this.INTERNAL_moduleIds = {};
  }

  public generateModuleId(args: OnLoadArgs) {
    // Already generated.
    if (typeof this.INTERNAL_moduleIds[args.path] === 'number') {
      return this.INTERNAL_moduleIds[args.path];
    }

    // Generate new module id.
    return this.INTERNAL_moduleIds[args.path] = args.pluginData?.isEntryPoint
      ? DefaultModuleIdGenerator.ENTRY_POINT_MODULE_ID
      : this.INTERNAL_id++;
  }

  public getIds() {
    return this.INTERNAL_moduleIds;
  }
}
