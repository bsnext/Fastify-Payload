import { test } from 'uvu';
import * as assert from 'uvu/assert';

////////////////////////////////

import Fastify, { FastifyInstance } from 'fastify';
import PayloadPlugin, { PluginOptions } from '../index';

////////////////////////////////

async function prepareServer(settings): Promise<FastifyInstance> {
	const server = Fastify({
		logger: false,
		ignoreTrailingSlash: true,
	});

	await server.register(PayloadPlugin, settings);

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
		server.listen({ port: 8080 },
			async function () {
				resolve(server);
			}
		);
	});
}

////////////////////////////////

// Тест на то, что Global параметр работает
test('Test: Global URLs', async () => {
	const server = await prepareServer(
		{
			global: true,
			overwriteWarning: false
		}
	);

	try {
		const result_test_1 = await fetch(`http://127.0.0.1:8080/test_1`, {
			method: `POST`,
			headers: { [`Content-Type`]: `application/json` },
			body: JSON.stringify({ a: `Hello World!` })
		}).then(async o => await o.json());

		assert.equal(result_test_1, {
			test: 1,
			body: { a: 'Hello World!' },
			payload: '{"a":"Hello World!"}'
		});
	} catch (e) {
		throw e;
	} finally {
		server.close();
	}
});

// Тест с отключенным глобалом, и указаниями - где будет использован request.payload
test('Test: Selected URLs', async () => {
	const server = await prepareServer(
		{
			paths: [`/test_1`],
			overwriteWarning: false,
		}
	);

	try {
		// Проверяем что в /test_1 есть payload
		const result_test_1 = await fetch(`http://127.0.0.1:8080/test_1`, {
			method: `POST`,
			headers: { [`Content-Type`]: `application/json` },
			body: JSON.stringify({ a: `Hello World!` })
		}).then(async o => await o.json());

		assert.equal(result_test_1, {
			test: 1,
			body: { a: 'Hello World!' }, payload: '{"a":"Hello World!"}'
		});

		// Проверяем что в /test_2 нет payload
		const result_test_2 = await fetch(`http://127.0.0.1:8080/test_2`, {
			method: `POST`,
			headers: { [`Content-Type`]: `application/json` },
			body: JSON.stringify({ a: `Hello World!` })
		}).then(async o => await o.json());

		assert.equal(result_test_2, {
			test: 2,
			body: { a: 'Hello World!' }
		});

		// Проверяем что в /test_3 есть payload
		const result_test_3 = await fetch(`http://127.0.0.1:8080/test_3`, {
			method: `POST`,
			headers: { [`Content-Type`]: `application/json` },
			body: JSON.stringify({ a: `Hello World!` })
		}).then(async o => await o.json());

		assert.equal(result_test_3, {
			test: 3,
			body: { a: 'Hello World!' },
			payload: '{"a":"Hello World!"}'
		});
	} catch (e) {
		throw e;
	} finally {
		server.close();
	}

	server.close();
});

////////////////////////////////

test.run();