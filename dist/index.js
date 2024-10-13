"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = require("fastify-plugin");
exports.default = (0, fastify_plugin_1.default)(function (fastify, initOptions, done) {
    const options = {
        global: (typeof initOptions.global === `boolean`) ? initOptions.global : false,
        paths: new Set(initOptions.paths || []),
        parse: initOptions.parse || `string`,
        contentTypes: initOptions.contentTypes || {
            [`application/json`]: `default`,
        },
        overwriteWarning: (typeof initOptions.overwriteWarning === `boolean`) ? initOptions.overwriteWarning : true
    };
    fastify.addHook(`onRoute`, function (routeOptions) {
        var _a;
        if ((_a = routeOptions.config) === null || _a === void 0 ? void 0 : _a.payload) {
            options.paths.add(routeOptions.url);
        }
    });
    function getDefaultParser(contentType) {
        if (contentType === `application/json`) {
            return fastify.getDefaultJsonParser(fastify.initialConfig.onProtoPoisoning || `error`, fastify.initialConfig.onConstructorPoisoning || `error`);
        }
        else if (contentType === `text/plain`) {
            return function (request, payload, callback) {
                callback(null, typeof payload === `string` ? payload : payload.toString());
            };
        }
        else if (contentType === `*`) {
            return function (request, payload, callback) {
                callback(null, payload);
            };
        }
        ;
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
        }
        ;
        fastify.addContentTypeParser(optionsContentType, { parseAs: options.parse }, function (req, payload, done) {
            const url = req.routeOptions.url;
            if (url && (options.global || options.paths.has(url))) {
                req.payload = payload;
            }
            parser(req, payload, function (err, result) {
                done(err, result);
            });
        });
    }
    done();
}, {
    fastify: '^4.14.x || ^5.x',
    name: `@bsnext/fastify-payload`
});
//# sourceMappingURL=index.js.map