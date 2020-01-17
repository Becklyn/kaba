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

                if (this.buildConfig.js.watch)
                {
                    this.resolveCallback = resolve;
                }

                let compiler = webpack(this.buildConfig.js.configs) as webpack.MultiCompiler;

                if (this.buildConfig.js.watch)
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
                let type = singleStats.compilation.compiler.options.name as string;
                let statConfig = singleStats.compilation.compiler.options.stats as any;
                statConfig.colors = true;

                console.log("");
                console.log(`${bgCyan(black(" webpack "))} ${cyan(type)}`);
                console.log(singleStats.toString(statConfig));
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

        let baseDir = this.buildConfig.js.basePath;
        const dependenciesFileName = `${this.buildConfig.js.javaScriptDependenciesFileName}.json`;
        const dependenciesFilePath =  path.join(baseDir, dependenciesFileName);
        let entrypoints;

        try
        {
            entrypoints = require(dependenciesFilePath);
        }
        catch (e)
        {
            entrypoints = {};
        }

        stats.stats.forEach(
            singleStats =>
            {
                for (const mapEntry of singleStats.compilation.entrypoints.entries())
                {
                    let outputPath = path.relative(
                        baseDir,
                        singleStats.compilation.outputOptions.path
                    );
                    const entry = mapEntry[1];
                    entrypoints[entry.name] = entry.chunks.reduce(
                        (files, chunk) => {
                            return files.concat(
                                chunk.files.map(
                                    file => path.join(outputPath, file)
                                )
                            );
                        },
                        []
                    );
                }
            }
        );



        // ensure that output path exists
        fs.ensureDirSync(baseDir);

        fs.writeFileSync(
            dependenciesFilePath,
            JSON.stringify(entrypoints),
            "utf-8"
        );
        this.logger.log(`Entrypoint dependencies written to ${yellow(dependenciesFilePath)}`);
    }
}
