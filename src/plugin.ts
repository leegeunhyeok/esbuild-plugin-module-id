import { DefaultModuleIdGenerator } from './generator';
import type { Plugin } from 'esbuild';
import type { ModuleIdOptions } from './types';

export const moduleId = ({
  onGenerate,
  generator = new DefaultModuleIdGenerator(),
  filter = /\.(?:[mc]js|[tj]sx?)$/,
  namespace,
}: ModuleIdOptions): Plugin => ({
  name: 'esbuild-plugin-module-id',
  setup(build) {
    build.onStart(() => {
      generator.initialize();
    });

    build.onResolve({ filter, namespace }, (args) => args.kind === 'entry-point' ? {
      path: args.path,
      pluginData: { isEntryPoint: true },
    } : null);

    build.onLoad({ filter, namespace }, (args) => {
      generator.generateModuleId(args);
      return null;
    });

    build.onEnd(() => onGenerate(generator.getIds()));
  },
});
