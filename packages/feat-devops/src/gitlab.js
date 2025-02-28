import GitLabClient from './drivers/GitLabClient';
import { createGitFeature } from './baseGitService';

export default createGitFeature(
    (config) => {
        const { url, token } = config;
        const client = new GitLabClient();
        client.initialize({ host: url, token });
        
        return { client };
    }
);