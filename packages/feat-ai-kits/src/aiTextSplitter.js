import { Types, InvalidConfiguration, ValidationError } from '@kitmi/types';
import Feature from '../../jacaranda/src/Feature';

function findBestSeparator(text, separators) {
    for (let separator of separators) {
        const index = text.lastIndexOf(separator);
        if (index !== -1) {
            return index + separator.length;
        }
    }
    return -1;
}

function findEnd(s, start, maxBytes) {
    let low = start;
    let high = s.length;

    while (low < high) {
        let mid = Math.floor((low + high + 1) / 2);
        let substring = s.substring(start, mid);
        let bytes = Buffer.byteLength(substring, 'utf8');

        if (bytes > maxBytes) {
            high = mid - 1;
        } else {
            low = mid;
        }
    }

    return low;
}

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['tiktoken'],

    load_: async function (app, options, name) {
        const {
            chunkSize,
            maxChunkOverlap,
            overlapSeparators,
            encodingForModel: _encodingForModel,
        } = app.featureConfig(
            options ?? {},
            {
                schema: {
                    chunkSize: { type: 'integer', default: 4095 },
                    maxChunkOverlap: { type: 'integer', default: 100 },
                    overlapSeparators: {
                        type: 'array',
                        element: { type: 'text' },
                        default: ['\n\n', '\n', '。', '.', '！', '!', '？', '?', '；', ';', '，', ',', ' '],
                    },
                    encodingForModel: {
                        type: 'text',
                        enum: ['text-embedding-ada-002', 'gpt-3.5-turbo', 'gpt-4'],
                    },
                },
            },
            name
        );

        if (maxChunkOverlap > chunkSize) {
            throw new InvalidConfiguration(
                'maxChunkOverlap must be less than chunkSize',
                app,
                'aiTextSplitter.maxChunkOverlap'
            );
        }

        const { encoding_for_model } = await app.tryRequire_('tiktoken');

        let tokenizer = encoding_for_model(_encodingForModel);
        const textDecoder = new TextDecoder();

        app.on('stopping', async () => {
            tokenizer.free();
            tokenizer = null;
        });

        const service = {
            peek: (text, _chunkSize) => {
                return textDecoder.decode(tokenizer.decode(tokenizer.encode(text).slice(0, _chunkSize ?? chunkSize)));
            },

            split: (text, chunkHeaderOptions) => {
                const {
                    chunkSize: __chunkSize,
                    maxChunkOverlap: _maxChunkOverlap,
                    chunkHeader,
                    chunkOverlapHeader,
                    appendChunkOverlapHeader,
                } = Types.OBJECT.sanitize(chunkHeaderOptions ?? {}, {
                    schema: {
                        chunkSize: { type: 'integer', default: chunkSize },
                        maxChunkOverlap: {
                            type: 'integer',
                            default: maxChunkOverlap,
                        },
                        chunkHeader: { type: 'text', default: '' },
                        chunkOverlapHeader: {
                            type: 'text',
                            default: "(cont'd) ",
                        },
                        appendChunkOverlapHeader: {
                            type: 'boolean',
                            default: false,
                        },
                    },
                });

                const chunks = [];
                let remainingTokens = tokenizer.encode(text);
                let _chunkSize = __chunkSize - chunkHeader.length;
                const _chunkSize2 = appendChunkOverlapHeader ? _chunkSize - chunkOverlapHeader.length : _chunkSize;

                if (_chunkSize2 < _maxChunkOverlap) {
                    throw new ValidationError('"chunkHeader" or "chunkOverlapHeader" too long', {
                        chunkHeader,
                        chunkOverlapHeader,
                        appendChunkOverlapHeader,
                        chunkSize: __chunkSize,
                        maxChunkOverlap: _maxChunkOverlap,
                    });
                }

                let _chunkHeader = chunkHeader;
                const _chunkHeader2 = appendChunkOverlapHeader ? chunkHeader + chunkOverlapHeader : chunkHeader;

                while (remainingTokens.length > 0) {
                    let chunkEnd = _chunkSize;
                    let content = _chunkHeader;

                    if (remainingTokens.length > _chunkSize) {
                        const overlapStart = _chunkSize - _maxChunkOverlap;
                        const overlapTokens = remainingTokens.slice(overlapStart, _chunkSize);
                        const overlapText = textDecoder.decode(tokenizer.decode(overlapTokens));

                        const bestSeparatorInOverlap = findBestSeparator(overlapText, overlapSeparators);
                        if (bestSeparatorInOverlap !== -1) {
                            chunkEnd =
                                overlapStart + tokenizer.encode(overlapText.slice(0, bestSeparatorInOverlap)).length;
                        }
                    }
                    chunks.push(content + textDecoder.decode(tokenizer.decode(remainingTokens.slice(0, chunkEnd))));
                    remainingTokens = remainingTokens.slice(chunkEnd);

                    if (appendChunkOverlapHeader) {
                        _chunkSize = _chunkSize2;
                        _chunkHeader = _chunkHeader2;
                    }
                }

                return chunks;
            },

            splitByBytes: (text, maxBytes) => {
                let chunks = [];

                let start = 0;
                while (start < text.length) {
                    let end = findEnd(text, start, maxBytes);
                    chunks.push(text.substring(start, end));
                    start = end;
                }

                return chunks;
            },
        };

        app.registerService(name, service);
    },
};
