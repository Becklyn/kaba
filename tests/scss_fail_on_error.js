import test from "ava";
import {runKaba} from "./lib/runner";

test("SCSS fail on error", t => {
    let result = runKaba("scss_fail_on_error");
    t.is(result.status, 1);
    t.falsy(/Found \d+ Stylelint issues:/.test(result.stdout.toString()));
});

test("SCSS fail on error with lint", t => {
    let result = runKaba("scss_fail_on_error", ["--lint"]);
    t.is(result.status, 1);
    t.truthy(/Found \d+ Stylelint issues:/.test(result.stdout.toString()));
});
