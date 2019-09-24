import MultiStats = webpack.compilation.MultiStats;
const fs = require("fs-extra");
import {bgCyan, black, yellow, cyan} from "kleur";
import * as webpack from "webpack";
import {kaba} from "../@types/kaba";
import {Logger} from "../Logger";
const path = require("path");


export class WebpackRunner
{
    private buildConfig: kaba.BuildConfig;
    private logger: Logger;
    private watchers: webpack.Compiler.Watching[] = [];
    private resolveCallback?: (success: boolean) => void;

    /**
     * Constructs a new runner
     */
    public constructor (buildConfig: kaba.BuildConfig)
    {
        this.buildConfig = buildConfig;
        this.logger = new Logger(bgCyan(black(" webpack ")));
    }


    /**
     * Runs the actual runner
     */
    public async run (): Promise<boolean>
    {
        return new Promise(
            (resolve) =>
            {
                if (!this.buildConfig.js)
                {
                    return resolve(true);
                }

                this.logger.log("Launching webpack...");
                const start = process.hrtime();

                if (this.buildConfig.js.common.watch)
                {
                    this.resolveCallback = resolve;
                }

                let configs: webpack.Configuration[] = [];

                configs.push(
                    Object.assign(
                        {},
                        this.buildConfig.js.common,
                        this.buildConfig.js.legacy,
                        {
                            plugins: (this.buildConfig.js.common.plugins as any[]).concat(this.buildConfig.js.legacy.plugins),
                            name: "legacy",
                        }
                    )
                );

                if (this.buildConfig.js.module)
                {
                    configs.push(
                        Object.assign(
                            {},
                            this.buildConfig.js.common,
                            this.buildConfig.js.module,
                            {
                                plugins: (this.buildConfig.js.common.plugins as any[]).concat(this.buildConfig.js.module.plugins),
                                name: "module",
                            }
                        )
                    );
                }

                let compiler = webpack(configs) as webpack.MultiCompiler;

                if (this.buildConfig.js.common.watch)
                {
                    this.resolveCallback = resolve;

                    this.watchers.push(
                        compiler.watch(
                            {},
                            (error, stats) => this.onCompilationFinished(error, (stats as unknown) as MultiStats)
                        )
                    );
                }
                else
                {
                    compiler.run(
                        (error, stats) => {
                            resolve(this.onCompilationFinished(error, (stats as unknown) as MultiStats, start));
                            this.logger.logBuildSuccess("(all files)", process.hrtime(start));
                        }
                    );
                }
            }
        );
    }


    /**
     * Callback on after the compilation has finished
     */
    private onCompilationFinished (error: Error|null, stats: MultiStats, start?: [number, number]) : boolean
    {
        if (error)
        {
            this.logger.logError("webpack error", error);
            this.logger.logWithDuration("webpack finished", process.hrtime(start));
            return false;
        }

        // log webpack output
        stats.stats.forEach(
            singleStats =>
            {
                console.log("");
                let type = singleStats.compilation.compiler.options.name as string;
                console.log(`${bgCyan(black(" webpack "))} ${cyan(type)}`);
                console.log(singleStats.toString({
                    colors: true,
                }));
            }
        );

        console.log("");
        // write dependencies file
        this.writeDependenciesFile(stats);

        return !stats.stats.some(single => single.hasErrors());
    }


    /**
     * Stops the runner
     */
    public stop () : void
    {
        if (this.resolveCallback)
        {
            Promise.all(
                this.watchers.map(watcher =>
                    new Promise(resolve => watcher.close(resolve))
                )
            )
                .then(() => (this.resolveCallback as (success: boolean) => void)(true));
        }
    }


    /**
     * Writes the entry dependencies file
     */
    private writeDependenciesFile (stats: MultiStats) : void
    {
        if (!this.buildConfig.js)
        {
            return;
        }

        const entrypoints = {};

        stats.stats.forEach(
            singleStats =>
            {
                for (const mapEntry of singleStats.compilation.entrypoints.entries())
                {
                    const entry = mapEntry[1];
                    entrypoints[entry.name] = entry.chunks.reduce(
                        (files, chunk) => {
                            return files.concat(chunk.files);
                        },
                        []
                    );
                }
            }
        );


        let outputPath = (this.buildConfig.js.common.output as webpack.Output).path as string;

        // ensure that output path exists
        fs.ensureDirSync(outputPath);

        const fileName = `${this.buildConfig.js.javaScriptDependenciesFileName}.json`;
        fs.writeFileSync(
            path.join(outputPath, fileName),
            JSON.stringify(entrypoints),
            "utf-8"
        );
        this.logger.log(`Entrypoint dependencies written to ${yellow(fileName)}`);
    }
}
