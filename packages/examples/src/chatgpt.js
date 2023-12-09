import { startWorker } from '@kitmi/jacaranda';

startWorker(
    async (app) => {
        const openai = app.getService('openai');

        const req = {
            model: 'gpt-3.5-turbo',
            messages: [
                openai.systemMessage('You are a senior developer at a software company.'),
                openai.userMessage('Please write a JavaScript undirected graph structure class.'),
            ],
        };

        app.debug(req);

        const result = await openai.getChatCompletion_(req);

        console.log(result);
    },
    {
        configName: 'chatgpt',
        configType: 'yaml',
        logLevel: 'verbose',
    }
);
