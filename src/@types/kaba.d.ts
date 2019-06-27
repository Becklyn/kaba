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
        js: {
            _common: WebpackBuildConfig;
            module: WebpackBuildConfig;
            legacy: WebpackBuildConfig;
        };
        cwd: string;
    }
}
