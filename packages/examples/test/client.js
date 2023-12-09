import { HttpClient } from '@kitmi/jacaranda';
import { superagent as agent } from '@kitmi/adapters';
import superagent from 'superagent';

export default function createClient() {
    return new HttpClient(agent(superagent));
};