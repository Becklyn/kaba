9.0.0
=====

*   Updated internal dependencies.
*   Always build a legacy and a modern JS build.
*   Added `verbose` to the CLI config.
*   Improved error handling of `node-sass` loading errors.
*   Use better default `publicPath` to match the default structure of the BecklynAssetsBundle.
*   Allow to disable the modern build
*   Don't prefix legacy build with `_legacy.`, but instead prefix modern build with `_modern.`. That enhances 
    compatability for simple builds.
*   Use `eslint-plugin-react-hooks` plugin
*   Always extract comments.
*   Display build progress in webpack
*   Display linting errors by default.
    *   Removed the `--lint` parameter and added an inverse `--silent` instead.
*   Added `duplicate-package-checker-webpack-plugin` that detects duplicate packages in a build in webpack.
*   Always run ESLint
*   Use faster sourcemap for production build
*   Added `eslint-plugin-jsdoc` and activated multiple rules for checking JSDoc issues.
*   Enable `es6` env in ESLint.
*   Fix issues with symlinked projects.
*   Also replace `process.env.DEBUG`, and `MODERN_BUILD` + `DEBUG` (without `process.env.` prefix).
*   Added some newlines to the log to improve formatting.
*   Automatically add the import for the `Fragment` component from preact for all modules.
*   Set `mode` for ESLint JSDoc linter to `typescript`.


8.1.0
=====

*   Changed the webpack include order, to avoid false-positive TypeScript errors.
*   Activated the `no-prototype-builtins` ESLint rule.
*   Automatically add the import for the `h()` function from preact for all modules.


8.0.0
=====

*   Removed `enableTypeScript()`.
*   Removed `setBrowserList()`.


7.3.0
=====

*   Always build source maps.
*   Always enable TypeScript for `.ts` / `.tsx` files.
*   Remove option to build `.js` / `.jsx` files via TypeScript.
*   Deprecated `enableTypeScript()`.
*   Deprecated `setBrowserList()`.


7.2.0
=====

*   Updated bundled KabaScss to 2.x.
*   Update the rest of the bundled dependencies.
*   Update several lint rules.
*   Fix duration printing of webpack build (if not in watch mode).
