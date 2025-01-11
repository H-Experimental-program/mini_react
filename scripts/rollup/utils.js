import path from 'path';
import fs from 'fs';

import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

// __dirname 在 ESM 模式下使用使用会报错
// polyfill
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pkgPath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist/node_modules');

export function resolvePkgPath(pkgName, isDist) {
  if (isDist) {
    return `${distPath}/${pkgName}`;
  }

  return `${pkgPath}/${pkgName}`;
}

export function getPackageJSON(pkgName) {
  // 包路径
  const path = `${resolvePkgPath(pkgName)}/package.json`;
  const str = fs.readFileSync(path, { encoding: 'utf-8' });
  return JSON.parse(str);
}

export function getBaseRollupPlugins({
  alias = {
    __DEV__: true,
    preventAssignment: true
  }
} = {}) {
  return [replace(alias), cjs(), ts()];
}
