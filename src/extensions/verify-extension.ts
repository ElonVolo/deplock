import * as _ from 'lodash';

const plist = require('plist');
const semver = require('semver')

module.exports = toolbox => {
  const { system, print, filesystem} = toolbox

  const verifyShellDependency = async (dependencyName, depObj) => {
    if (!depObj.command) {
      throw new Error("A command configuration is required");
    } else if (!depObj.version) {
      throw new Error ("A version is required");
    }

    let toolVersion = await system.run(depObj.command, { trim: true });
    if (depObj.matcher) {
      const matcherRegexp = new RegExp(depObj.matcher);
      const matchResult = matcherRegexp.exec(toolVersion);
      if (matchResult.length > 1) {
        toolVersion = matchResult[1];
      }
    }

    if (!semver.satisfies(semver.coerce(toolVersion), depObj.version)) {
      print.error(`${dependencyName} ${depObj.version} required; version ${toolVersion} installed`);
      return false;
    } else {
      return true;
    }
  }

  const verifyNpmDepedency = async (dependencyName, depObj) => {
    if (!depObj.module_name) {
      throw new Error("A module name is required");
    } else if (!depObj.version) {
      throw new Error ("A version is required");
    }

    const toolVersionJSON = await system.run(`npm ls ${depObj.module_name} --global --json`, { trim: false });
    let versionJSONObject = JSON.parse(toolVersionJSON);
    let toolVersion = versionJSONObject["dependencies"][depObj.module_name]["version"];

    if (!semver.satisfies(semver.coerce(toolVersion), depObj.version)) {
      print.error(`${dependencyName} ${depObj.version} required; version ${toolVersion} installed`);
      return false;
    } else {
      return true;
    }
  }

  const verifyFileDependency = async (dependencyName, depObj) => {
    if (!depObj.format) {
      throw new Error("The file is required to have a format");
    } else if (!depObj.filepath) {
      throw new Error("A filepath must be specified");
    } else if (!filesystem.exists(depObj.filepath)) {
      throw new Error(`File at ${depObj.filepath} does not exist`);
    }
    else if (!depObj.version) {
      throw new Error ("A version is required");
    }

    let versionText = "";

    switch(depObj.format) {
      case "text":
        versionText = filesystem.read(depObj.path);
        break;
      case "plist":
        if (!depObj.datapath) {
          throw new Error('A plist version entry must have a valid datapath entry');
        }

        const plistData = filesystem.read(depObj.filepath);
        const plistStruct = plist.parse(plistData);
        if (!plistStruct) {
          throw new Error(`plist at ${depObj.filepath} couldn't be parsed!`);
        }
        versionText = _.get(plistStruct, depObj.datapath);
        break;
      default:
        throw new Error(`verifyFileDependency() unrecognized format ${depObj.format}`);
    }

    if(!versionText) {
      throw new Error("Version entry for THING could not be found");
    }

    if (!semver.satisfies(semver.coerce(versionText), depObj.version)) {
      print.error(`Version of ${dependencyName} ${depObj.version} required; version ${versionText} installed`);
      return false;
    } else {
      return true;
    }
  }

  toolbox.verify = {
    verifyDependencies: async (depObjs) => {
      let allVersionsValid = true;

      for (const depName in depObjs) {
        let dependency = depObjs[depName];

        let depType = dependency.type;

        if (!depType) {
          throw new Error('All dependencies must have a registered type');
        }

        let dependencyPresent = true;

        switch(depType) {
          case "shell": {
            dependencyPresent = await verifyShellDependency(depName, dependency);
            break;
          }

          case "npm-global": {
            dependencyPresent = await verifyNpmDepedency(depName, dependency);
            break;
          }

          case "file": {
            dependencyPresent = await verifyFileDependency(depName, dependency);
            break;
          }

          default: {
            // Dependency not recognized
            throw new Error(`Dependency type ${depType} not recognized`);
          }
        }

        if(!dependencyPresent) {
          allVersionsValid = false;
        }
      }

      return allVersionsValid;
    }
  }
}
