8.x to 9.0
==========

*   Internal: The project was ported to TypeScript.
*   Always build a legacy and a modern JS build.
*   Removed the ability to use the project's `tsconfig.json`. 


7.x to 8.0
==========

*   Removed `enableTypeScript()`. Remove it without replacement, as it is now automatically enabled.
*   Removed `setBrowserList()`. Set the `browserlist` config in your project's `package.json` instead.
