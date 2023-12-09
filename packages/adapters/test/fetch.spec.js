import path from 'node:path';
import { HttpClient } from '@kitmi/jacaranda';
import { fs } from '@kitmi/sys';
import fetchagent from '../src/httpClient/fetchagent';

function isPromise(p) {
    if (typeof p === 'object' && typeof p.then === 'function') {
      return true;
    }
  
    return false;
  }

const tempDir = path.resolve(__dirname, './temp');

const pipeAsync_ = async (stream1, stream2) => {
    isPromise(stream1) && (stream1 = await stream1);

    if (stream1 instanceof ReadableStream && !(stream2 instanceof WritableStream)) {
        stream2 = stream2.constructor.toWeb(stream2);
        return stream1.pipeTo(stream2);
    } else {
        return new Promise((resolve, reject) => {
            stream2.on('close', resolve);
            stream2.on('error', reject);
            stream1.pipe(stream2);
        });
    }
}

describe.only('feature:fetch', function () {
    it('get list with endpoint', async function () {        
        let httpClient = new HttpClient(fetchagent(), 'https://dummyjson.com');

        should.exist(httpClient);

        const result = await httpClient.get('products');
        //console.log(result);
        should.exist(result);

        result.should.have.keys('total', 'skip', 'products', 'limit');
        assert.isOk(result.products.length > 0);
    });

    it('get one with endpoint', async function () {
        let httpClient = new HttpClient(fetchagent(), 'https://dummyjson.com');

        should.exist(httpClient);

        const result = await httpClient.get('products/1');
        should.exist(result);
        should.exist(result.id);
    });

    it('post one with endpoint in options', async function () {
        let httpClient = new HttpClient(fetchagent());

        should.exist(httpClient);

        const result = await httpClient.post('add', { title: 'Dummy product' }, null, {
            endpoint: 'https://dummyjson.com/products',
        });

        should.exist(result);
        should.exist(result.id);
        result.title.should.be.eql('Dummy product');
    });

    it.only('download', async function () {
        let httpClient = new HttpClient(fetchagent());

        fs.ensureDirSync(tempDir);
        const saveToPath = path.resolve(tempDir, 'a.png');

        const stream = fs.createWriteStream(saveToPath);

        should.exist(httpClient);

        //Readable.fromWeb

        const result = await pipeAsync_(httpClient.download('https://github.com/galax-ai/gx-js-lib-template/releases/latest/download/package.tgz'), stream);
        console.log(result);
    });
});
