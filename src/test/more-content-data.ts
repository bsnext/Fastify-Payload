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

	await server.register(PayloadPlugin<string>, settings);

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

// Тест на то, что text/plain так же можно получить в Payload
// И application/json не отрыгивает при таком указании
test('Test: Text Plain', async () => {
	const server = await prepareServer(
		{
			global: true,
			contentTypes: {
				[`text/plain`]: `default`,
				[`application/json`]: `default`,
			},
			overwriteWarning: false
		}
	);

	try {
		const result_test_1 = await fetch(`http://127.0.0.1:8080/test_1`, {
			method: `POST`,
			headers: { [`Content-Type`]: `text/plain` },
			body: JSON.stringify({ a: `Hello World!` })
		}).then(async o => await o.json());

		assert.equal(result_test_1, {
			test: 1,
			body: '{"a":"Hello World!"}',
			payload: '{"a":"Hello World!"}'
		});

		const result_test_2 = await fetch(`http://127.0.0.1:8080/test_2`, {
			method: `POST`,
			headers: { [`Content-Type`]: `application/json` },
			body: JSON.stringify({ a: `Hello World!` })
		}).then(async o => await o.json());

		assert.equal(result_test_2, {
			test: 2,
			body: { a: 'Hello World!' },
			payload: '{"a":"Hello World!"}'
		});
	} catch (e) {
		throw e;
	} finally {
		server.close();
	}
});

// Тест на реализацию кастомного парсера
test('Test: Custom Parser', async () => {
	const server = await prepareServer(
		{
			global: true,
			contentTypes: {
				[`text/plain`]: function (request, payload, done) {
					done(null, [`It's working!`, JSON.parse(payload)]);
				},
				[`application/json`]: function (request, payload, done) {
					const timeStart = performance.now();
					const parsedPayload = JSON.parse(payload);
					parsedPayload.__entries = Object.entries(parsedPayload).length;
					done(null, parsedPayload);
				},
			},
			overwriteWarning: false
		}
	);

	try {
		const result_test_1 = await fetch(`http://127.0.0.1:8080/test_1`, {
			method: `POST`,
			headers: { [`Content-Type`]: `text/plain` },
			body: JSON.stringify({ a: `Привет World!` })
		}).then(async o => await o.json());

		assert.equal(result_test_1, {
			test: 1,
			body: ["It's working!", { a: 'Привет World!' }],
			payload: '{"a":"Привет World!"}'
		});

		const result_test_2 = await fetch(`http://127.0.0.1:8080/test_2`, {
			method: `POST`,
			headers: { [`Content-Type`]: `application/json` },
			body: JSON.stringify({ a: `Здарова World!` })
		}).then(async o => await o.json());

		assert.equal(result_test_2, {
			test: 2,
			body: { a: 'Здарова World!', __entries: 1 },
			payload: '{"a":"Здарова World!"}'
		});
	} catch (e) {
		throw e;
	} finally {
		server.close();
	}
});

////////////////////////////////

test.run();