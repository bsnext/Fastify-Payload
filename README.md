# Fastify-Payload
![Build & Test](https://github.com/bsnext/fastify-payload/actions/workflows/test.yml/badge.svg)
![Node.JS Supported](https://badgen.net/static/Node.JS/%3E=19.0.0/green)
![Fastify Supported](https://badgen.net/static/Fastify/%3E=14/green)
![Install Size](https://badgen.net/packagephobia/install/@bsnext/fastify-payload)
![Dependencies](https://badgen.net/bundlephobia/dependency-count/@bsnext/fastify-payload)
![License](https://badgen.net/static/license/MIT/blue)

Plugin for adding raw-body data as 'request.payload' field into Fastify Requests.<br>

**Tested on Fastify v4.14+ and Node.JS v19+!**<br>
https://github.com/bsnext/fastify-payload/actions/workflows/test.yml

This parser do not have external dependencies, only "@fastify/plugin". Also, **it use default secure JSON parser fron Fastify**, with defined by server rules about prototype/constructor poisoning. 

This plugin Supported adding extra "Content-Type's" and custom parsers.<br>
And that only one reason, why i not use [that](https://github.com/Eomm/fastify-raw-body).

## Installing:
```bash
npm install @bsnext/fastify-payload
```

## Usage:
```ts
import FastifyPayload from '@bsnext/fastify-payload'; // TS
import { default as FastifyPayload } from "@bsnext/fastify-payload"; // MJS
const { default: FastifyPayload } = require(`@bsnext/fastify-payload`); // CJS

const server = Fastify();
await server.register(FastifyPayload, {
	// Use plugin for all paths
	// Do not use "true" in production
	// Every request with existed payload - will eat memory
	global: boolean = false; 

 	// Specific paths for save payload
	paths: string[] = [];

	// Payload format
	parse: `string`|`buffer` = `buffer`; 

	// Content-Type parsers. Possible add and use more parsers (XML, JSON5, ...).
	// "default" option only for "application/json", "text/plain" or "*".
	// Enabled for "application/json" only by default.
	// Default parser for "*" will accept any Content-Type on Fastify Server!
	contentTypes?: {
		// Use "default" if wanna use default parser.
		// Or write custom parser by function.
		[key: string]: 'default' | function(request, payload, callback: (err, result));
		[`application/json`]: 'default';
	};

	// Plugin will output warnings when overwritten content parsers
	// It 100% will output warning about "application/json" overwrite
	// In 99.9% you need set "false" by hands. 
	// If make "false" by default - it can be a head-pain reason for somebody.
	overwriteWarning?: boolean = true;
});

server.post(url, {
	config: {
		// Save payload in this route?
		// Default "false" for everything.
		// Of course if not use "global: true" in plugin.
		payload: boolean = false
	}
}, function() {
	...
})

```

```ts
// Important note about modify default "contentParsers" object.
// You should send all object if want enable "text/plain" or add new parser
await server.register(FastifyPayload, 
	{
		contentParsers: {
			[`application/json`]: 'default';
			[`application/xml`]: function(...) {... your xml parse code};
		}
	}
);

// If object not will have a "application/json" - it not will parse that.
// This code will disable plugin for all, and left only "application/xml".
await server.register(FastifyPayload, 
	{
		contentParsers: {
			[`application/xml`]: function(...) {...};
		}
	}
);
```

More information about Fastify Content-Type Parsing:
https://fastify.dev/docs/v5.0.x/Reference/Server/#addcontenttypeparser

## Example: Regular Usage

```ts
import Fastify from 'fastify'; 
import FastifyPayload from '@bsnext/fastify-payload'; 

const server = Fastify(...);
await server.register(FastifyPayload);

server.post(`/request_with_payload`, {
	config: { payload: true }
}, function(request, response) {
	console.log(`request.payload ->`, request.payload);
	response.send(`ok`);
})

server.listen({ port: 8080 });

```

## Example: Weird, But Possible Usage

```ts
import Fastify from 'fastify'; 
import FastifyPayload from '@bsnext/fastify-payload'; 

const server = Fastify(...);
await server.register(FastifyPayload, {
	paths: [`/request_with_payload`, `/one_more_request_with_payload`]
});

server.post(`/request_with_payload`, function(request, response) {
	console.log(`request.payload ->`, request.payload);
	response.send(`ok`);
})

server.patch(`/one_more_request_with_payload`, function(request, response) {
	console.log(`request.payload ->`, request.payload);
	response.send(`ok`);
})

// Options for save payload can be shuffled: "paths" + "configs"
server.put(`/last_request_with_payload`, {
	config: { payload: true }
}, function(request, response) {
	console.log(`request.payload ->`, request.payload);
	response.send(`ok`);
})

server.listen({ port: 8080 });

```

## Example: Adding Extra Parser

```ts
import Fastify from 'fastify'; 
import FastifyPayload from '@bsnext/fastify-payload'; 

import { xml2js } from 'xml-js';

const server = Fastify();
await server.register(FastifyPayload, {
	contentTypes: {
		[`application/json`]: 'default',
		[`application/xml`]: function (request, payload, done) {
			try {
				done(null, xml2js(payload));
			} catch (error) {
				done(error);
			}
		}
	}
});

server.post(`/convert_xml_to_json`, {
	config: { payload: true }
}, function (request, response) {
	console.log(`request.payload ->`, request.payload);
	/*
	request.payload -> <hi>
		<text>How are you?</text>
	</hi>
	*/
	response.send(request.body);
	/*
	{
		"elements": [
			{ "type": "element", "name": "hi", "elements": [...] }
		]
	}
	*/
});

server.listen({ port: 8080 });

```