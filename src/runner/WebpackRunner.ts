import fs from "fs-extra";
import {bgCyan, black, yellow} from "kleur";
import * as webpack from "webpack";
import {kaba} from "../@types/kaba";
import {Logger} from "../Logger";
import path from "path";


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
                    return true;
                }

                this.logger.log("Launching webpack...");
                const start = process.hrtime();

                if (this.buildConfig.js.customTypeScriptConfig)
                {
                    this.logger.log(`Using custom TypeScript config: ${yellow(path.relative(this.buildConfig.cwd, this.buildConfig.js.customTypeScriptConfig))}`);
                }

                if (this.buildConfig.js.common.watch)
                {
                    this.resolveCallback = resolve;
                }

                let compilerLegacy = webpack(Object.assign(
                    {},
                    this.buildConfig.js.common,
                    this.buildConfig.js.legacy,
                ));

                let compilerModule = webpack(Object.assign(
                    {},
                    this.buildConfig.js.common,
                    this.buildConfig.js.module,
                ));


                if (this.buildConfig.js.common.watch)
                {
                    this.resolveCallback = resolve;

                    this.watchers.push(
                        compilerLegacy.watch(
                            {},
                            (error, stats) => this.onCompilationFinished(error, stats, false)
                        )
                    );
                    this.watchers.push(
                        compilerModule.watch(
                            {},
                            (error, stats) => this.onCompilationFinished(error, stats, true)
                        )
                    );
                }
                else
                {
                    compilerLegacy.run(
                        (error, stats) => {
                            resolve(this.onCompilationFinished(error, stats, false, start));
                            this.logger.logBuildSuccess("(all files)", process.hrtime(start));
                        }
                    );

                    compilerModule.run(
                        (error, stats) => {
                            resolve(this.onCompilationFinished(error, stats, true, start));
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
    private onCompilationFinished (error: Error|null, stats: webpack.Stats, isModule: boolean, start?: [number, number]) : boolean
    {
        if (error)
        {
            this.logger.logError("webpack error", error);
            this.logger.logWithDuration("webpack finished", process.hrtime(start));
            return false;
        }

        // log webpack output
        console.log(stats.toString({
            colors: true,
        }));
        console.log("");

        // write dependencies file
        this.writeDependenciesFile(stats, isModule);

        return !stats.hasErrors();
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
     *
     * @private
     * @param {Stats} stats
     * @param {boolean} isModule
     */
    writeDependenciesFile (stats, isModule)
    {
        if (!this.buildConfig.js)
        {
            return;
        }

        const entrypoints = {};

        for (const mapEntry of stats.compilation.entrypoints.entries())
        {
            const entry = mapEntry[1];
            entrypoints[entry.name] = entry.chunks.reduce(
                (files, chunk) => {
                    return files.concat(chunk.files);
                },
                []
            );
        }

        let outputPath = (this.buildConfig.js.common.output as webpack.Output).path as string;

        // ensure that output path exists
        fs.ensureDirSync(outputPath);

        const fileName = `${this.buildConfig.js.javaScriptDependenciesFileName}${isModule ? ".module" : ""}.json`;
        fs.writeFileSync(
            path.join(outputPath, fileName),
            JSON.stringify(entrypoints),
            "utf-8"
        );
        this.logger.log(`Entrypoint dependencies written to ${yellow(fileName)}`);
    }
}
