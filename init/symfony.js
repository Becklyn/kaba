const kaba = require("kaba");

const js = kaba.shelf.js();
const scss = kaba.shelf.scss();

kaba.task("scss", scss);
kaba.task("js", js);

kaba.task("", kaba.parallel(scss, js));
kaba.task("release", kaba.task(""));
