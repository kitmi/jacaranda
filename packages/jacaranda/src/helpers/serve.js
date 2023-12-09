import WebServer from "../WebServer";

export default function serve(options) {
    const server = new WebServer(null, options);
    server.start_().catch((error) => {
        console.error(error);
    });

    return server;
};