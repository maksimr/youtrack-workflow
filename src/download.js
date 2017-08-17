const fs = require('fs');
const resolve = require('url').resolve;
const net = require('../lib/net/index');
const outputdir = require('../lib/fs/outputdir');
const unzip = require('../lib/unzip/unzip');

const load = require('../src/load');

const request = net.request;
const sign = net.sign;

/**
 * Get by `id` until https://youtrack.jetbrains.com/issue/JT-42979 is not fixed
 */
function getId(config, workflowName, fn) {
  load(config, list => {
    const targetWorkflow = (list || []).find(function(item) {
      return item.name === workflowName;
    });

    if (!targetWorkflow || !targetWorkflow.id) {
      throw new Error('Can\'t get requested workflow id');
    }

    fn && fn(targetWorkflow.id);
  });
}

function download(config, workflowName) {
  if (!workflowName) {
    throw new Error('Workflow id/name should be defined');
  }

  return getId(config, workflowName, id => {
    const req = request(
      sign(resolve(config.host, '/workflowDistributive/' + id), config.token),
      (downloadError) => {
        if (downloadError) throw downloadError;
      }
    );

    req.on('response', reponse => {
      const fileName = getZipName(workflowName);
      const filePath = outputdir(config.output, fileName);
      const zip = fs.createWriteStream(filePath);
      reponse.pipe(zip);
      unzip(config, filePath)
    });

    return req;
  });

  function getZipName(workflowName) {
    return 'youtrack-workflow-' + workflowName + '-' + Date.now() + '.zip';
  }
}

module.exports = download;
