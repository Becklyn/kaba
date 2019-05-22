export = Liim;

declare namespace Liim
{
    export type ServiceFactoryFunction = (liim: ServiceContainer) => Service;
    export interface Service {}

    export type ServiceFactory = Service | ServiceFactoryFunction;


    export interface ServiceContainer
    {
        /**
         * Sets a service.
         *
         * This can either be an object or a function, that will be called as soon as the service is created.
         * The function will receive the service container as only
         */
        set (name: string, service: ServiceFactory): void;

        /**
         * Gets a service
         */
        get (name: string): Service;

        /**
         * Returns whether the service container has a service with the given name.
         */
        has (name: string): boolean;
    }
}
