import test from "ava";
import {runKaba} from "./lib/runner";

test("JS simple", t => {
    let result = runKaba("js_simple");
    t.is(result.status, 0);
});
