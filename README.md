kaba
====

A build system, specifically designed for the needs and requirements of [Becklyn Studios].

You will need to install [kaba-cli] for using kaba.


Installation
------------

Use npm to install kaba locally in your project:

```bash
$ npm install -S kaba
```


Usage
-----

First you need to create a `kabafile.js` in your project, which is the config file for your tasks. These tasks can then be executed via `kaba-cli`.


### Registering a task

```js
const kaba = require("kaba");

kaba.task("example", (done, debug) => {
    console.log("running some task");
    done();
});
```

`.task(name, callback(done, debug))` has two parameters:

* `name` is the name of the task 
* `callback` is the function that is executed when running this task.

The `callback` receives two parameters:

* `done` a function that should be called as soon as the task has finished.
* `debug` a bool flag, that indicates whether the task should be run in debug mode (i.e. omitting minification, etc.)


### Default task

You can define a default task, that is run if no specific task name is provided:

```bash
kaba
# or
kaba --dev
```

This task should have the special name `""` or `null`:

```js
kaba.task("", (done, debug) => {
    console.log("default task here");
    done();
});
```

As with other task names, you can only define a single default task.



### Combining tasks
You can combine tasks by either running them sequentially or in parallel.

In all of these helpers you can either pass a task name (as `string`) or a function.

#### Running sequentially with `.series(...tasks)`

You can run tasks in sequence by using the `.series` helper.

```js
kaba.task("first", /* ... */);
kaba.task("second", /* ... */);


kaba.task("all",
    kaba.series("first", "second", () => { console.log("all done"); })
);
```

#### Running in parallel with `.parallel(...tasks)`

You can run tasks in parallel by using the `.parallel` helper.

```js
kaba.task("first", /* ... */);
kaba.task("second", /* ... */);


kaba.task("all",
    kaba.parallel("first", "second", () => { console.log("additional information"); })
);
```

Please note: as the tasks are run in parallel, the last task (with `console.log`) could finish first. In the parallel helper, no execution order of the given tasks is guaranteed. 



#### Combining the run helpers

The helpers can be combined and nested as desired:

```js
kaba.task("all",
    kaba.parallel(
        kaba.series("a", "b", "c"),
        kaba.series("x", "y", "z")
    )
);
```


### Loading a task

If you ever need to access an already defined task, you can call `.task(name)` with just one parameter.
This will give you the callback or `undefined`, if no task with this name is defined.

You probably won't need this however, as you can use the task names in the `.series(name)` and `.parallel(name)` helper directly (as `string`).


Shelf
-----

kaba comes with two predefined tasks for compiling and minimizing SCSS and JavaScript. 

If run in default mode, the files are minified and optimized. If run in debug mode, the files contain sourcemaps and are not minified, also file watchers are started, that automatically rebuild changed files.

You can access the shelf using `kaba.shelf`.


### `kaba.shelf.js(configuration)` JavaScript

This function compiles all top-level javascript files in the given directories. It only directly compiles files that are at the root of the given input directory.
So leave your entry-level files at the root and move included files in subdirectories.


```js
kaba.task("css", kaba.shelf.js({
    input: "assets/js"
}));
```

All configuration options:

| Option          | Type                       | Description                                                                                                  | Default value                                          | Comment                                                                                                                        |
| --------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`         | `string`                   | A glob that matches all directories that contain JavaScript files                                            | `"src/**/Resources/assets/js/"`                        | As this parameter is passed unaltered to [glob] it will accept everything that glob accepts.                                   |
| `output`        | `string`                   | The output dir for compiled files                                                                            | `"../../public/js"`                                    | This path is relative to the (resolved) `input` path for the given file.                                                       |
| `ignoreLintFor` | `array.<(RegExp\|string)>` | If the one of these strings occur (or the regex matches) the current file path, the file will not be linted. | `["/node_modules/", "/vendor/"]`                       |                                                                                                                                |
| `externals`     | `Object.<string,string>`   | The list of external variables and what they should compile to.                                              | `{jquery: "window.jQuery", routing: "window.Routing"}` | The added entries do not replace the entries, but are additionally added. Remove externals by explicitly setting them to null. |
| `transforms`    | `Array.<Array>`            | A list of additional transforms.                                                                             | `[]`                                                   | A list of arrays, where the array values are the parameters to the `.transform()` call on the browserify instance.             |


The `transforms` entry is passed directly to browserify, so if you want to add a call like this:

```js
browserify.transform(myTransform, {some: "config"});
```

the configuration should look like this:

```js
js.shelf.js({
   transforms: [
       [myTransform, {some: "config"}]
   ] 
});
```


### `kaba.shelf.scss(configuration)` SCSS

This function compiles SCSS files using [node-sass].


```js
kaba.task("js", kaba.shelf.scss({
    input: "assets/scss"
}));
```

All files are compiled, even the files in subdirectories. Only import-only files (with prefix `_` in their filename, e.g. `_example.scss`) are not compiled.

All configuration options:

| Option          | Type                       | Description                                                                                                  | Default value                     | Comment                                                                                               |
| --------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `input`         | `string`                   | A glob that matches all directories that contain SCSS files                                                  | `"src/**/Resources/assets/scss/"` | As this parameter is passed unaltered to [glob] it will accept everything that glob accepts.          |
| `output`        | `string`                   | The output dir for compiled files                                                                            | `"../../public/css"`              | This path is relative to the (resolved) `input` path for the given file.                              |
| `browsers`      | `array`                    | The list of supported browers                                                                                | `["last 2 versions", "IE 10"]`    | This value is passed to [autoprefixer], so please look in their documentation for all allowed values. |
| `ignoreLintFor` | `array.<(RegExp\|string)>` | If the one of these strings occur (or the regex matches) the current file path, the file will not be linted. | `["/node_modules/", "/vendor/"]`  |                                                                                                       |



Known issues
------------

* New files are not picked up automatically.


[Becklyn Studios]: https://www.becklyn.com
[kaba-cli]: https://www.npmjs.com/package/kaba-cli
[glob]: https://www.npmjs.com/package/glob
[autoprefixer]: https://www.npmjs.com/package/autoprefixer
[node-sass]: https://www.npmjs.com/package/node-sass
