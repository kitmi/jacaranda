import superagent from 'superagent';
import { superagent as adapter } from '@kitmi/adapters';
import { ExternalServiceError } from '@kitmi/types';
import HttpClient from './helpers/HttpClient';

const httpClient = new HttpClient(adapter(superagent), {
    onResponseError: (body, error) => {
        throw new ExternalServiceError(error.message, {
            headers: error.response.headers,
            status: error.response.status,
            body,
            clientError: error.response.error && error.response.clientError && {
                method: error.response.error.method,
                path: error.response.error.path
            }, 
            serverError: error.response.error && error.response.serverError && {
                message: error.response.error.message
            },
            redirect: false,
        });
    }
});

export default httpClient;