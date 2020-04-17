import test from "ava";
import {runKaba} from "./lib/runner";


/**
 * @typedef {{
 *      status: number,
 *      dir?: string,
 *      args?: string[],
 *      match?: RegExp,
 *      noMatch?: RegExp,
 * }} FixtureConfig
 */

/* eslint-disable camelcase */
/** @var {Object<string,FixtureConfig>} fixtureTests */
const fixtureTests = {
    js: {
        status: 0,
    },
    scss_fail_on_error: {
        status: 1,
        args: ["--silent"],
        noMatch: /Found \d+ Stylelint issues:/,
    },
    scss_fail_on_error_lint: {
        status: 1,
        dir: "scss_fail_on_error",
        match: /Found \d+ Stylelint issues:/,
    },
    scss: {
        status: 0,
    },
    ts: {
        status: 0,
    },
};
/* eslint-enable camelcase */

Object.keys(fixtureTests).forEach(key =>
{
    test(`File: ${key}`, async t =>
    {
        const expected = fixtureTests[key];
        const result = await runKaba(expected.dir || key, expected.args || []);

        t.is(result.exitCode, expected.status);

        if (undefined !== expected.match)
        {
            t.truthy(expected.match.test(result.stdout));
        }

        if (undefined !== expected.noMatch)
        {
            t.falsy(expected.noMatch.test(result.stdout));
        }
    });
});
