import {gray, green, red, yellow} from "kleur";
const prettyHrtime = require("pretty-hrtime");

interface FileError
{
    file: string;
    line: number;
    message: string;
    formatted: string;
}

/**
 * Logger for all kinds of messages
 */
export class Logger
{
    private prefix: string;


    /**
     *
     */
    constructor (prefix: string)
    {
        this.prefix = prefix;
    }


    /**
     * Logs the start of a build
     */
    public logBuildStart (): void
    {
        this.log(green(`Build started`));
    }


    /**
     * Logs a build success
     */
    public logBuildSuccess (fileName: string, duration: [number, number]): void
    {
        this.newLine();
        this.logWithDuration(`${green("Build finished")}: ${yellow(fileName)}`, duration);
    }


    /**
     * Logs a message with a duration
     */
    public logWithDuration (message: string, duration: [number, number])
    {
        this.log(`${message} after ${prettyHrtime(duration)}`);
    }


    /**
     *
     */
    public logError (message: string, error: Error | { message: string })
    {
        this.log(`${red(message)}: ${error.message}`);
    }


    /**
     * Logs a compilation error
     */
    public logCompileError (error: FileError): void
    {
        this.newLine();
        this.log(`${red("Compilation Error")} in file ${yellow(error.file)} on line ${yellow(error.line)}:`);
        console.log(`    ${error.message}`);

        if (error.formatted !== undefined)
        {
            const codeSegment = error.formatted
                .split("\n")
                .splice(2)
                .join("\n");

            console.log("");
            console.log(codeSegment);
        }

        console.log("");
    }


    /**
     * Writes a log message
     */
    public log (message: string): void
    {
        console.log(`${gray(this.getCurrentTime())} ${this.prefix} ${message}`);
    }


    /**
     * Returns the current time
     */
    private getCurrentTime (): string
    {
        const now = new Date();
        return `${this.padTime(now.getHours())}:${this.padTime(now.getMinutes())}:${this.padTime(now.getSeconds())}`;
    }


    /**
     * Pads the time
     */
    private padTime (time: number): string
    {
        return ("" + time).padStart(2, "0");
    }


    /**
     * Adds new lines
     */
    private newLine (lines: number = 1): void
    {
        for (let i = 0; i < lines; i++)
        {
            console.log("");
        }
    }
}
