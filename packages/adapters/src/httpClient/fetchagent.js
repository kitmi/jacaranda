import ResponseWrapper, { isJSON } from '../helpers/superagentLike';
import { appendQuery } from '@kitmi/utils';

const fetchAdapter = () => {
    return {
        createRequest(method, url, _options) {
            const headers = {
                'content-type': 'application/json',
            };

            let query;

            const options = {
                redirect: "follow", // manual, *follow, error
            };

            const requestWrapper = {
                set: (name, value) => {
                    let lowerName = name.toLowerCase();
                    if (lowerName === 'type') {
                        lowerName = 'content-type';
                    }
                    headers[lowerName] = value;
                    return requestWrapper;
                },
                withCredentials: () => {
                    options.mode = 'cors';
                    options.credentials = 'include';
                    return requestWrapper;
                },
                send: (body) => {
                    if (isJSON(headers['content-type'])) {
                        options.body = JSON.stringify(body);
                    } else {
                        options.body = body;
                    }
                    return requestWrapper;
                },
                query: (_query) => {
                    query = query;
                    return requestWrapper;
                },
                type: (type) => {
                    headers['content-type'] = type;
                    return requestWrapper;
                },
                accept: (type) => {
                    headers.accept = type.includes('/') ? type : `application/${type}`;
                    return requestWrapper;
                },
                then: async (callback) => {
                    if (_options._method === 'download' && !headers.accept) {
                        requestWrapper.accept('octet-stream');
                    }

                    const __method = method.toUpperCase();

                    const response = await fetch(query ? appendQuery(url, query) : url, {
                        ...options,
                        method: __method, // *GET, POST, PUT, DELETE, etc.
                        headers,
                    });                                      
                    
                    return ResponseWrapper.create_({ headers, method: __method, url }, response).then(callback);
                }
            };

            return requestWrapper;
        },
    };
};

export default fetchAdapter;
