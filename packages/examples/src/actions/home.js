export default {
    index: async function (ctx) {
        ctx.body = 'Hello Jacaranda!';
    },

    shutdown: async function (ctx) {
        ctx.body = 'Shutting down...';
        setTimeout(() => {
            process.kill(process.pid, 'SIGINT');
        }, 100);
    },
};
