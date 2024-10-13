import { FastifyInstance, FastifyRequest, FastifyContextConfig, RouteShorthandOptions } from "fastify";
import FastifyPlugin from "fastify-plugin";


////////////////////////////////

export interface PluginOptions<T> {
	global?: boolean;
	paths?: string[];
	parse?: `string` | `buffer`;
	contentTypes?: {
		[key: string]: 'default' | 
		((request: FastifyRequest, payload: T, callback: (err: Error | null, result?: any) => void) => void);
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

////////////////////////////////

export default FastifyPlugin(
	function <T extends string | Buffer = string>(fastify: FastifyInstance, initOptions: PluginOptions<T>, done) {
		const options = {
			global: (typeof initOptions.global === `boolean`) ? initOptions.global : false,
			paths: new Set(initOptions.paths || []),
			parse: initOptions.parse || `string`,
			contentTypes: initOptions.contentTypes || {
				[`application/json`]: `default`,
				// [`text/plain`]: `default`,
			},
			overwriteWarning: (typeof initOptions.overwriteWarning === `boolean`) ? initOptions.overwriteWarning : true
		};

		fastify.addHook(`onRoute`, 
			function (routeOptions) {
				if (routeOptions.config?.payload) {
					options.paths.add(routeOptions.url);
				}
			}
		);

		////////////////////////////////

		function getDefaultParser(contentType) {
			if (contentType === `application/json`) {
				return fastify.getDefaultJsonParser(fastify.initialConfig.onProtoPoisoning || `error`, fastify.initialConfig.onConstructorPoisoning || `error`);

			} else if (contentType === `text/plain`) {
				return function (request, payload: T, callback) {
					callback(null, typeof payload === `string` ? payload : payload.toString());
				};
			} else if (contentType === `*`) { 
				return function (request, payload: T, callback) {
					callback(null, payload);
				};
			};

			throw new Error(`Content-type '${contentType}' not have a default parser!`);
		}

		for (const [optionsContentType, optionsParser] of Object.entries(options.contentTypes)) {
			if (typeof optionsParser !== `function` && optionsParser !== `default`) {
				throw new Error(`Invalid 'parser' type for content-type '${optionsContentType}'.\nExpected "function" or "string 'default'", got "${typeof optionsParser}"`);
			}

			const parser = (optionsParser === `default`) ? getDefaultParser(optionsContentType) : optionsParser;

			if (fastify.hasContentTypeParser(optionsContentType)) {
				if (options.overwriteWarning) {
					fastify.removeContentTypeParser(optionsContentType);
					console.warn(`@bsnext/fastify-payload overwrite contentTypeParser for "${optionsContentType}"!`);
				}
			};

			// Какая-то беда с options.parse. Оно может быть или 'buffer' или 'string'
			// Ругается, потому-что что-то где-то указано не явно
			// Не соображу, но это надо обязательно поправить (а я забил)
			// @ts-ignore
			fastify.addContentTypeParser(optionsContentType, { parseAs: options.parse },
				function (req, payload: T, done) {
					const url = req.routeOptions.url;

					if (url && (options.global || options.paths.has(url))) {
						req.payload = payload;
					}

					// @ts-ignore
					parser(req, payload,
						function (err, result) {
							done(err, result);
						}
					);
				}
			);
		}

		done();
	},
	{
		fastify: '^4.14.x || ^5.x',
		name: `@bsnext/fastify-payload`
	}
);