const superagentAdapter = (superagent) => {
    const agent = superagent.agent();

    return {
        createRequest(method, url) {
            return agent[method](url);
        },
    };
};

export default superagentAdapter;
