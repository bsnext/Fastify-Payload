import { FastifyInstance, FastifyRequest } from "fastify";
export interface PluginOptions<T> {
    global?: boolean;
    paths?: string[];
    parse?: `string` | `buffer`;
    contentTypes?: {
        [key: string]: 'default' | ((request: FastifyRequest, payload: T, callback: (err: Error | null, result?: any) => void) => void);
    };
    overwriteWarning?: boolean;
}
declare module "fastify" {
    interface FastifyRequest {
        payload: string | Buffer;
    }
    interface FastifyContextConfig {
        payload?: boolean;
    }
    interface RouteShorthandOptions {
        payload?: boolean;
    }
}
declare const _default: <T extends string | Buffer = string>(fastify: FastifyInstance, initOptions: PluginOptions<T>, done: any) => void;
export default _default;
