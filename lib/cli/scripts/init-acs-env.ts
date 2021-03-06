/* tslint:disable */
let alfrescoApi = require('@alfresco/js-api');
let program = require('commander');
let fs = require ('fs');
const path = require('path');
import { logger } from './logger';
const { SharedlinksApi, FavoritesApi } = require('@alfresco/js-api');
let MAX_RETRY = 10;
let counter = 0;
let TIMEOUT = 6000;
const ACS_DEFAULT = require('./resources').ACS_DEFAULT;
/* tslint:enable */

let alfrescoJsApi;

export default async function () {
    await main();
}

async function main() {

    program
        .version('0.1.0')
        .option('--host [type]', 'Remote environment host')
        .option('-p, --password [type]', 'password ')
        .option('-u, --username [type]', 'username ')
        .parse(process.argv);

    await checkEnv();

    logger.info(`***** Step initialize ACS *****`);
    await initializeDefaultFiles();

}

async function initializeDefaultFiles() {
    for (let j = 0; j < ACS_DEFAULT.files.length; j++) {
        const fileInfo = ACS_DEFAULT.files[j];
        switch (fileInfo.action) {
            case 'UPLOAD':
                await uploadFile(fileInfo.name, fileInfo.destination);
                break;
            case 'LOCK':
                const fileToLock = await uploadFile(fileInfo.name, fileInfo.destination);
                await lockFile(fileToLock.entry.id);
                break;
            case 'SHARE':
                const fileToShare = await uploadFile(fileInfo.name, fileInfo.destination);
                await shareFile(fileToShare.entry.id);
                break;
            case 'FAVORITE':
                const fileToFav = await uploadFile(fileInfo.name, fileInfo.destination);
                await favoriteFile(fileToFav.entry.id);
                break;
            default:
                logger.error('No action found for file ', fileInfo.name);
                break;
        }
    }
}

async function uploadFile(fileName, fileDestination) {
    const filePath = `../resources/content/${fileName}`;
    const file = fs.createReadStream(path.join(__dirname, filePath));
    let uploadedFile: any;
    try {
        uploadedFile = await alfrescoJsApi.upload.uploadFile(
            file,
            '',
            fileDestination,
            null,
            {
                name: fileName,
                nodeType: 'cm:content',
                renditions: 'doclib',
                overwrite: true
            }
        );
        logger.info(`File ${fileName} was uploaded`);
    } catch (err) {
        logger.error(`Failed to upload file with error: `, err.stack);
    }
    return uploadedFile;
}

async function lockFile(nodeId) {
    const data = {
        type: 'ALLOW_OWNER_CHANGES'
    };
    try {
        await alfrescoJsApi.nodes.lockNode(nodeId, data);
        logger.info('File was locked');
     } catch (error) {
        logger.error('Failed to lock file with error: ', error.stack);
    }
}

async function shareFile(nodeId) {
    const data = {
        nodeId: nodeId
    };
    try {
        await new SharedlinksApi(alfrescoJsApi).createSharedLink(data);
        logger.info('File was shared');
     } catch (error) {
        logger.error('Failed to share file with error: ', error.stack);
    }
}

async function favoriteFile(nodeId) {
    const data = {
        target: {
          ['file']: {
            guid: nodeId
          }
        }
    };
    try {
        await new FavoritesApi(alfrescoJsApi).createFavorite('-me-', data);
        logger.info('File was add to favorites');
    } catch (error) {
        logger.error('Failed to add the file to favorites with error: ', error.stack);
    }
}

async function checkEnv() {
    try {

        alfrescoJsApi = new alfrescoApi.AlfrescoApiCompatibility({
            provider: 'ALL',
            hostBpm: program.host,
            hostEcm: program.host,
            authType: 'OAUTH',
            oauth2: {
                host: `${program.host}/auth/realms/alfresco`,
                clientId: 'alfresco',
                scope: 'openid'
            }
        });
        await alfrescoJsApi.login(program.username, program.password);
    } catch (e) {
        logger.info('Login error environment down or inaccessible');
        counter++;
        if (MAX_RETRY === counter) {
            logger.info('Give up');
            process.exit(1);
        } else {
            logger.info(`Retry in 1 minute attempt N ${counter}`);
            sleep(TIMEOUT);
            checkEnv();
        }
    }
}

/* tslint:enable */

function sleep(delay) {
    const start = new Date().getTime();
    while (new Date().getTime() < start + delay) {  }
}
