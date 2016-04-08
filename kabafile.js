"use strict";

let kaba = require("./kaba/kaba");

let scss = kaba.scss("assets/scss/", "public/css/", {});
// let js = kaba.js("assets/js/", "public/js/", {});

scss(false)();
// gulp.task("scss", scss(false));
// gulp.task("js", js(true));
