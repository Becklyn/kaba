"use strict";

let gulp = require("gulp");
let kaba = require("./kaba/kaba");

let scss = kaba.scss("assets/scss/", "public/css/", {});
let js = kaba.js("assets/js/", "public/js/", {});

gulp.task("scss", scss(false));
gulp.task("js", js(false));
