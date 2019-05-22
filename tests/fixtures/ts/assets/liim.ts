// internal type
import {Service, ServiceContainer, ServiceFactory} from "./@types/liim";


interface ServiceRegistry {
    [name: string]: ServiceFactory;
}

/**
 * A super simple service container
 */
export default class Liim implements ServiceContainer
{
    protected container: ServiceRegistry = {};


    /**
     * Sets a service.
     *
     * This can either be an object or a function, that will be called as soon as the service is created.
     * The function will receive the service container as only
     */
    public set (name: string, service: ServiceFactory): void
    {
        if (this.container[name] !== undefined)
        {
            throw new Error(`Duplicate service: ${name}`);
        }

        this.container[name] = service;
    }


    /**
     * Gets a service
     */
    public get (name: string): Service
    {
        let service = this.container[name];

        if (service === undefined)
        {
            throw new Error(`Service missing: ${name}`);
        }

        if (typeof service === "function")
        {
            return this.container[name] = service(this);
        }

        return service;
    }


    /**
     * Returns whether the service container has a service with the given name.
     */
    public has (name: string): boolean
    {
        return this.container[name] !== undefined;
    }
}
