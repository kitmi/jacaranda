export function isJSON(mime) {
    // should match /json or +json
    // but not /json-seq
    return /[/+]json($|[^-\w])/i.test(mime);
}

const parseType = (string_) => string_.split(/ *; */).shift();

const parseTypeParams = (value) => {
    const object = {};
    for (const string_ of value.split(/ *; */)) {
        const parts = string_.split(/ *= */);
        const key = parts.shift();
        const value = parts.shift();

        if (key && value) object[key] = value;
    }

    return object;
};

class ResponseWrapper {
    static async create_(request, response) {
        const wrapper = new ResponseWrapper(request, response);
        await wrapper.parseBody_();
        return wrapper;
    }

    constructor(request, response) {
        this.req = request;
        this.res = response;
        this.headers = this.header = {};

        this._setStatusProperties();
        this._setHeaders();
    }

    async parseBody_() {
        //console.log(this.type, this.status);
        if (isJSON(this.type)) {
            this.body = await this.res.json();
        } else if (this.type.startsWith('text/')) {
            this.text = await this.res.text();
            if (this.error) {
                this.error.text = this.text;
            }
            //console.log(this.body);
        } else {
            this.body = this.res.body;
        }

        if (this.error) {
            const _error = new Error(this.statusText);
            _error.response = this;
            throw _error;
        }
    }

    get(field) {
        return this.header[field.toLowerCase()];
    }

    _setHeaders() {
        for (const [key, value] of this.res.headers) {
            this.header[key.toLowerCase()] = value;
        }

        // content-type
        const ct = this.header['content-type'] || '';
        this.type = parseType(ct);

        // params
        const parameters = parseTypeParams(ct);
        Object.assign(this, parameters);
    }

    _setStatusProperties() {
        const status = this.res.status;
        const type = Math.trunc(status / 100);

        // status / class
        this.status = this.statusCode = status;
        this.statusType = type;
        this.statusText = this.res.statusText;

        // basics
        this.info = type === 1;
        this.ok = type === 2;
        this.redirect = type === 3;
        this.clientError = type === 4;
        this.serverError = type === 5;
        this.error = type === 4 || type === 5 ? this.toError() : false;

        // sugar
        this.created = status === 201;
        this.accepted = status === 202;
        this.noContent = status === 204;
        this.badRequest = status === 400;
        this.unauthorized = status === 401;
        this.notAcceptable = status === 406;
        this.forbidden = status === 403;
        this.notFound = status === 404;
        this.unprocessableEntity = status === 422;
    }

    toError() {
        const { url, method } = this.req;

        const _url = new URL(url);
        const __url = _url.pathname;
        const message = `cannot ${method} ${__url} (${this.status})`;
        const error = new Error(message);
        error.status = this.status;
        error.method = method;
        error.url = __url;

        return error;
    }
}

export default ResponseWrapper;
