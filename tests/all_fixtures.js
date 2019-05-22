import test from "ava";
import {runKaba} from "./lib/runner";


/**
 * @typedef {{
 *      status: number,
 *      args?: string[],
 *      match?: RegExp,
 *      noMatch?: RegExp,
 * }} FixtureConfig
 */

/* eslint-disable camelcase */
/** @var {Object<string,FixtureConfig>} fixtureTests */
let fixtureTests = {
    js: {
        status: 0,
    },
    scss_fail_on_error: {
        status: 1,
        noMatch: /Found \d+ Stylelint issues:/,
    },
    scss_fail_on_error_lint: {
        status: 1,
        args: ["--lint"],
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
    test(`File: ${key}`, t =>
    {
        let expected = fixtureTests[key];
        let result = runKaba(key, expected.args || []);
        let stdout = null !== result.stdout
            ? result.stdout.toString()
            : "";

        t.is(result.status, expected.status);

        if (undefined !== expected.match)
        {
            t.truthy(expected.match.test(stdout));
        }

        if (undefined !== expected.noMatch)
        {
            t.falsy(expected.noMatch.test(stdout));
        }
    });
});
