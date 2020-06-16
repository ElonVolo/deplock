
import { GluegunCommand } from 'gluegun'
import { parse } from 'toml';


const command: GluegunCommand = {
  name: 'verify',
  run: async toolbox => {
    const { parameters, filesystem, verify, print } = toolbox

    let configData = filesystem.read(parameters.first);
    let configResults = parse(configData);
    const verificationResults = await verify.verifyDependencies(configResults);
    if (verificationResults) {
      print.success('Dependencies met!');
      process.exit(0);
    } else {
      print.error('Incomplete dependencies!');
      process.exit(1);
    }
  },
}

module.exports = command
