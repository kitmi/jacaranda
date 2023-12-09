import path from 'node:path';
import { HttpClient } from '@kitmi/jacaranda';
import { fs } from '@kitmi/sys';
import superagent from '../src/superagent';


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

async function main() {
    let httpClient = new HttpClient(superagent());

        fs.ensureDirSync(tempDir);
        const saveToPath = path.resolve(tempDir, 'a.png');

        const stream = fs.createWriteStream(saveToPath);

        const result = await pipeAsync_(httpClient.download('https://github.com/galax-ai/gx-js-lib-template/releases/latest/download/package.tgz'), stream);
        console.log(result);
}

main().then(() => {
}).catch((err) => {
    console.error(err);
});