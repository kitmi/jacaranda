import { expect, test } from "bun:test";
import createClient from "./client";

test("hello", async () => {
    const client = createClient();    
    const result = await client.get('http://localhost:3000');
    expect(result).toBe('Hello Jacaranda!');
});