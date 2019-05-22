import test from "ava";
import {runKaba} from "./lib/runner";

test("SCSS simple", t => {
    let result = runKaba("scss_simple");
    t.is(result.status, 0);
});
