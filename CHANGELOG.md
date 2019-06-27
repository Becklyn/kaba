9.0.0
=====

*   Always build a legacy and a modern JS build.


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
