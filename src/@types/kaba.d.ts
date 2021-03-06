import * as webpack from "webpack";

declare namespace kaba
{
    export interface CliConfig
    {
        debug?: boolean;
        watch?: boolean;
        lint?: boolean;
        openBundleAnalyzer?: boolean;
        fix?: boolean;
        verbose?: boolean;
    }

    export interface SassBuildConfig
    {
        entries: {[name: string]: string};
        includePaths: string[];
        outputPath: string;
        cwd: string;
    }

    type WebpackBuildConfig = Partial<webpack.Configuration>;

    export interface BuildConfig
    {
        sass: SassBuildConfig;
        js?: {
            watch: boolean,
            configs: WebpackBuildConfig[];
            javaScriptDependenciesFileName: string;
            basePath: string;
        };
        cwd: string;
    }
}
