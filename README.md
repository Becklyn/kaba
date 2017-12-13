kaba
====

A build system, specifically designed for the needs and requirements of [Becklyn Studios], built on top of webpack.


Installation
------------

Use npm to install kaba locally in your project:

```bash
yarn add -D kaba
# or
npm install -D kaba
```

Usage
-----

Just run the executable:

```bash
npx kaba
# or
./node_modules/.bin/kaba
```

Configuration
-------------

First, create a `webpack.config.js` in the root of your project.
Load kaba and export the generate config:


```js
const Kaba = require("kaba");

module.exports = (new Kaba())
    .addEntries({
        app: "assets/js/app.js"
    })
    .extractSharedEntry()
    .getWebpackConfig();
```

### All of the available configuration methods

#### `.addEntries( mapping )`

Defines the entry points for the webpack builds.

*   `mapping` `Object<string,string>` required
    The mapping object defining the entry points. Similar to [`webpackConfig.entry`]:

    ```js
    kaba.addEntries({
        app: "./assets/js/app.js",
        page: "./assets/js/page.js",
    });
    ```


#### `.cleanOutputDir()`

Removes the output directory before the build.
Note: if the build is watched, the output dir will only be emptied once at the very beginning.


#### `.extractSharedEntry( [ vendorFiles [, vendorName [, runtimeName ] ] ] )`

Extract shared entries.

*   `vendorFiles` `string[]` optional (default: `[]`)
    The vendor packages, that should be definitely included in the vendor file.

*   `vendorName` `string` optional (default: `"vendor"`)
    The name of the vendor file (`"vendor" -> /vendor.js`)

*   `runtimeName` `string` optional (default: `"runtime"`)
    The name of the vendor file (`"runtime" -> /runtime.js`)
    
Automatically extracts common chunks that are at least referenced 3 times.

If `runtimeName` is null, only the vendor file will be extract, containing the webpack runtime, the common chunks and the explicit vendor chunks.
If `runtimeName` is set, the vendor fill we contain the common chunks and the explicit vendor chunk and the runtime will contain the webpack runtime.


#### `.addExternals( externals )`

Adds the given imports as externals.

*   `externals` `Object<string,string>` required
    The mapping for externals. See [`webpackConfig.externals`] for details.
    By default, the following externals are registered:
    ```js
    kaba.addExternals({
        routing: "window.Routing",
    });
    ```


#### `.disableModuleConcatenation()` *(deprecated)*

Disables the module concatenation plugin in webpack.
Is *deprecated*, because this option will be removed from webpack in v4.


#### `.setOutputPath( outputPath )`

Sets the output path where all compiled files will be stored. Is relative to `cwd()`. See [`webpackConfig.output.path`] (except that the path is already joined with `cwd()`).

*   `outputPath` `string` required
    By default the output path is set to:
    ```js
    kaba.setOutputPath("assets-artifacts/");
    ```


#### `.setPublicPath( publicPath )`

Sets the public path for dynamic module loading. See [`webpackConfig.output.publicPath`] for details.

*   `publicPath` `string` required
    By default, the public path is set to:
    ```js
    kaba.setPublicPath("/assets/");
    ```


#### `.setBrowserList( list )`

Sets the browser list for [autoprefixer]. See the [browserlist] docs for details about the format.

*   `list` `string[]` required
    By default, the browser list os set to:
    ```js
    kaba.setBrowserList(["last 2 versions", "IE 11"]);
    ```



Supported Features
------------------

* SCSS building + minification
* Babel with the [`kaba-babel-preset`]
* Typescript
* ESLint
* Stylelint
* Preact support
* Source Maps


[autoprefixer]: https://github.com/postcss/autoprefixer
[browserlist]: https://github.com/ai/browserslist
[Becklyn Studios]: https://www.becklyn.com
[`kaba-babel-preset`]: https://github.com/Becklyn/kaba-babel-preset
[`webpackConfig.entry`]: https://webpack.js.org/configuration/entry-context/#entry
[`webpackConfig.externals`]: https://webpack.js.org/configuration/externals/
[`webpackConfig.output.path`]: https://webpack.js.org/configuration/output/#output-path
[`webpackConfig.output.publicPath`]: https://webpack.js.org/configuration/output/#output-publicpath
