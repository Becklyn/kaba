9.1.0
=====

*   (improvement) Added `setWebpackConfigAliases` method to define aliases in the webpack build config.


9.0.0
=====

*   (internal) Updated internal dependencies.
*   (bc) Always build a legacy and a modern JS build.
*   (feature) Added `verbose` to the CLI config.
*   (improvement) Improved error handling of `node-sass` loading errors.
*   (improvement) Use better default `publicPath` to match the default structure of the BecklynAssetsBundle.
*   (feature) Allow to disable the modern build
*   (improvement) Don't prefix legacy build with `_legacy.`, but instead prefix modern build with `_modern.`. That enhances 
    compatability for simple builds.
*   (feature) Use `eslint-plugin-react-hooks` plugin
*   (improvement) Always extract comments.
*   (improvement) Display build progress in webpack
*   (improvement) Display linting errors by default.
    *   Removed the `--lint` parameter and added an inverse `--silent` instead.
*   (improvement) Added `duplicate-package-checker-webpack-plugin` that detects duplicate packages in a build in webpack.
*   (improvement) Always run ESLint
*   (improvement) Use faster sourcemap for production build
*   (improvement) Added `eslint-plugin-jsdoc` and activated multiple rules for checking JSDoc issues.
*   (improvement) Enable `es6` env in ESLint.
*   (bug) Fix issues with symlinked projects.
*   (improvement) Also replace `process.env.DEBUG`, and `MODERN_BUILD` + `DEBUG` (without `process.env.` prefix).
*   (improvement) Added some newlines to the log to improve formatting.
*   (improvement) Automatically add the import for the `Fragment` component from preact for all modules.
*   (improvement) Set `mode` for ESLint JSDoc linter to `typescript`.
*   (improvement) Improved ESLint linting: now only files in the project dir are linted. This ensures that symlinked dev packages are
    not linted. (`/node_modules/` etc are still excluded, of course.)
*   (feature) Add option to polyfill core node packages in webpack.
*   (bc) Remove `disableChunkSplitting()`, chunk splitting is now always disabled. Use code splitting instead.
*   (improvement) Bump required node version to 12.
*   (internal) Bumped all dependencies.
*   (improvement) Allow `++` in JS/TS code.
*   (improvement) The code is now always compiled per entry file
*   (improvement) Build TypeScript for the `esnext` module system, that (amongst other things) allows to use `import()`.
*   (bug) Compile every entry into a separate directory, to avoid issues with the clean plugin.
*   (bc) Not all npm packages are automatically transpiled anymore. You need to define which packages from `node_modules` to transpile via Babel by using `.compileNpmPackages(...)`.
*   (feature) Even if not recommended (use SCSS!), we now support compiling CSS via webpack (not as entry point though). The CSS will be injected into the head dynamically.
*   (improvement) TypeScript will now ignore TYPO3 (`*typo3*`) directories, to prevent issues due to file extension conflicts of TYPO3's typoscript `.ts` and TypeScript's `.ts`.


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
