import Feature from '../Feature';

const voiceMapping = {
    'zh': 'zh-CN-XiaoxiaoNeural',
    'zh-CN': 'zh-CN-XiaoxiaoNeural',
    'en-US': 'en-US-JaneNeural',
    'en-GB': 'en-GB-LibbyNeural',
    'en-AU': 'en-AU-AnnetteNeural',
    'zh-Hant': 'zh-CN-XiaoxiaoNeural',
    'zh-HK': 'zh-HK-HiuMaanNeural',
    'zh-TW': 'zh-TW-HsiaoChenNeural',
    'ja': 'ja-JP-AoiNeural',
    'ko': 'ko-KR-SoonBokNeural',
};

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['microsoft-cognitiveservices-speech-sdk'],

    load_: async function (app, options, name) {
        const sdk = await app.tryRequire_('microsoft-cognitiveservices-speech-sdk', false);

        const { apiKey, region } = app.featureConfig(options, {
            schema: {
                apiKey: { type: 'text' },
                region: { type: 'text' },
            },
        });

        const service = {
            async speakToFile_(text, filename, language) {
                const voiceName =
                    voiceMapping[language] ?? 'en-US-JennyMultilingualNeural';

                const speechConfig = sdk.SpeechConfig.fromSubscription(
                    apiKey,
                    region
                );

                // setting the synthesis language, voice name, and output audio format.
                // see https://aka.ms/speech/tts-languages for available languages and voices
                //speechConfig.speechSynthesisLanguage = language;
                speechConfig.speechSynthesisVoiceName = voiceName;
                speechConfig.speechSynthesisOutputFormat =
                    sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

                // now create the audio-config pointing to the output file.
                // You can also use audio output stream to initialize the audio config, see the docs for details.
                const audioConfig =
                    sdk.AudioConfig.fromAudioFileOutput(filename);

                // create the speech synthesizer.
                let synthesizer = new sdk.SpeechSynthesizer(
                    speechConfig,
                    audioConfig
                );

                // start the synthesizer and wait for a result.
                return new Promise((resolve, reject) => {
                    synthesizer.speakTextAsync(
                        text,
                        function (result) {
                            synthesizer.close();
                            synthesizer = undefined;
                            resolve(result);
                        },
                        function (err) {
                            synthesizer.close();
                            synthesizer = undefined;
                            reject(err);
                        }
                    );
                });
            },

            async speakToBuffer_(text, language) {
                const voiceName =
                    voiceMapping[language] ?? 'en-US-JennyMultilingualNeural';

                const speechConfig = sdk.SpeechConfig.fromSubscription(
                    apiKey,
                    region
                );

                speechConfig.speechSynthesisVoiceName = voiceName;
                speechConfig.speechSynthesisOutputFormat =
                    sdk.SpeechSynthesisOutputFormat.Audio16Khz64KBitRateMonoMp3;

                let synthesizer = new sdk.SpeechSynthesizer(speechConfig);

                return new Promise((resolve, reject) => {
                    synthesizer.speakTextAsync(
                        text,
                        (result) => {
                            synthesizer.close();
                            synthesizer = undefined;

                            console.log(result);

                            // convert arrayBuffer to stream
                            // return stream
                            
                            resolve(result.audioData);
                        },
                        (err) => {
                            synthesizer.close();
                            synthesizer = undefined;
                            reject(err);
                        }
                    );
                });
            },
        };

        app.registerService(name, service);
    },
};
