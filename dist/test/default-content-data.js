"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const uvu_1 = require("uvu");
const assert = require("uvu/assert");
const fastify_1 = require("fastify");
const index_1 = require("../index");
function prepareServer(settings) {
    return __awaiter(this, void 0, void 0, function* () {
        const server = (0, fastify_1.default)({
            logger: false,
            ignoreTrailingSlash: true,
        });
        yield server.register(index_1.default, settings);
        server.post(`/test_1`, function (request, response) {
            response.send({
                test: 1,
                body: request.body,
                payload: request.payload
            });
        });
        server.post(`/test_2`, function (request, response) {
            response.send({
                test: 2,
                body: request.body,
                payload: request.payload
            });
        });
        server.post(`/test_3`, {
            config: {
                payload: true
            }
        }, function (request, response) {
            response.send({
                test: 3,
                body: request.body,
                payload: request.payload
            });
        });
        return new Promise(function (resolve, reject) {
            server.listen({ port: 8080 }, function () {
                return __awaiter(this, void 0, void 0, function* () {
                    resolve(server);
                });
            });
        });
    });
}
(0, uvu_1.test)('Test: Global URLs', () => __awaiter(void 0, void 0, void 0, function* () {
    const server = yield prepareServer({
        global: true,
        overwriteWarning: false
    });
    try {
        const result_test_1 = yield fetch(`http://127.0.0.1:8080/test_1`, {
            method: `POST`,
            headers: { [`Content-Type`]: `application/json` },
            body: JSON.stringify({ a: `Hello World!` })
        }).then((o) => __awaiter(void 0, void 0, void 0, function* () { return yield o.json(); }));
        assert.equal(result_test_1, {
            test: 1,
            body: { a: 'Hello World!' },
            payload: '{"a":"Hello World!"}'
        });
    }
    catch (e) {
        throw e;
    }
    finally {
        server.close();
    }
}));
(0, uvu_1.test)('Test: Selected URLs', () => __awaiter(void 0, void 0, void 0, function* () {
    const server = yield prepareServer({
        paths: [`/test_1`],
        overwriteWarning: false,
    });
    try {
        const result_test_1 = yield fetch(`http://127.0.0.1:8080/test_1`, {
            method: `POST`,
            headers: { [`Content-Type`]: `application/json` },
            body: JSON.stringify({ a: `Hello World!` })
        }).then((o) => __awaiter(void 0, void 0, void 0, function* () { return yield o.json(); }));
        assert.equal(result_test_1, {
            test: 1,
            body: { a: 'Hello World!' }, payload: '{"a":"Hello World!"}'
        });
        const result_test_2 = yield fetch(`http://127.0.0.1:8080/test_2`, {
            method: `POST`,
            headers: { [`Content-Type`]: `application/json` },
            body: JSON.stringify({ a: `Hello World!` })
        }).then((o) => __awaiter(void 0, void 0, void 0, function* () { return yield o.json(); }));
        assert.equal(result_test_2, {
            test: 2,
            body: { a: 'Hello World!' }
        });
        const result_test_3 = yield fetch(`http://127.0.0.1:8080/test_3`, {
            method: `POST`,
            headers: { [`Content-Type`]: `application/json` },
            body: JSON.stringify({ a: `Hello World!` })
        }).then((o) => __awaiter(void 0, void 0, void 0, function* () { return yield o.json(); }));
        assert.equal(result_test_3, {
            test: 3,
            body: { a: 'Hello World!' },
            payload: '{"a":"Hello World!"}'
        });
    }
    catch (e) {
        throw e;
    }
    finally {
        server.close();
    }
    server.close();
}));
uvu_1.test.run();
//# sourceMappingURL=default-content-data.js.map