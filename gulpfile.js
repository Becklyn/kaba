"use strict";

let gulp = require("gulp");
let kaba = require("./kaba/kaba");

let scss = kaba.scss("assets/scss/", "public/css/", {});

gulp.task("scss", scss(false));
