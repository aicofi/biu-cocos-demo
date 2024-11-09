interface Config {
    API_URL: string;
}

var configMap = {
    'dev': {
        API_URL: 'http://100.111.211.115:9020',
    },
    'prod': {
        API_URL: 'https://aderpsg.galaxy42.fun/demogame',
    },
}

var currentEnv: string = 'prod';

export function getConfigEnv() {
    return configMap[currentEnv];
}

export function setConfigEnv(envName: string) {
    currentEnv = envName;
}
