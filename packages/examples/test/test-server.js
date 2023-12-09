import { beforeAll, afterAll } from "bun:test";
import WebServer from '@kitmi/jacaranda';
import createClient from "./client";

beforeAll(async () => {
    const server = new WebServer('test', {
        configType: 'yaml',
        logLevel: 'verbose',
        logFeatures: true,
        logMiddlewareRegistry: true,
    });

    await server.start_();
});

afterAll(async () => {
    const client = createClient();    
    const result = await client.get('http://localhost:3000/shutdown');
    console.log(result);
});

// tests...
