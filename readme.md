# deplock

deplock is a tool that used for checking globally installed dependencies against those contained in a user supplied .toml file.

## Installation


### Global

npm install -g deplock

### Per project
npm install --save-dev deplock

### Usage

**deplock verify** _deplock_toml_file_

Returns a 1 exit code if validation fails

### Specifying dependecies

Dependencies are specified in a deplock.toml configuration file.

There are three different version number acquisition specifications that can be used in a deplock.toml file. Each row correspondings to a .toml field.

####Shell script dependency specification

| _  | |
| --- | --- |
| type | **"shell"** |
| command | The shell script command to get the version |
| version | The exact version required (semver format) |
| matcher (optional) | A regular expression with a capturing group. Used to parse the output from command.

####npm global dependency specification

|  _   | |
| --- | --- |
| type | **"npm-global"** |
| module_name | The name of the npm global module |
| version | The exact version required (semver format) |

####Metadata file dependency specification


| _ | |
| --- | --- |
| type | **"file"** |
| format | The file format of the file. Only "plist" is supported at the moment, though there are plans to add xml, csv, etc later on. |
| filepath | The absolute path to the file |
| datapath | How specifies a key or path used to obtain the version number.
| version | The exact version required (semver format) |



### Example configuration

```
# System dependencies can be retrieved via executing a shell command
[cordova]
type = "shell"
command = "cordova -v"
version = "8.0.0"

# In cases where calling a shell script produces a version number surrounded by
# garbage text (in below case "ruby 2.4.9p456 (2019-09-17 revision 64024)"),
# a regular expression matcher can be used to parse out the version
# number
[ruby]
type = "shell"
command = "ruby --version"
version = "2.3.7"
matcher = "ruby (\d+\.\d+(?:\.\d+)?).*"


# Global npm dependencies can also be specified
[ng-cli]
type = "npm-global"
module_name = "@angular/cli"
version = "9.1.8"


# Version metadata files can also be specified
[xcode]
type = "file"
format = "plist"
filepath = "/Applications/Xcode.app/Contents/version.plist"
datapath = "CFBundleShortVersionString"
version = "11.3.1"

```

### Philosophy and Roadmap

deplock is designed around the principle of "Document All Tribal Lore". I've been on multiple teams across multiple organizations where half a dozen developers can have wildly varying versions of Xcode, Android Studio, node, etc. on their machines.

I've seen considerable amounts of dev-hours wasted simply by one dev not upgrading to the latest version of Android Studio (because tribal lore and they didn't get the memo) and that dev then having to pull off other devs (who got exposed to the tribal lore) to sit down together to figure out why the first dev's Android apps weren't building.

I've found that of these problems magically go away if you force every developer working on the same project to be on the same version of stuff. But in order to do that, you really need a single source of truth that:

1) Describes everything that has to go into the build of a piee of software.
2) Naturally resists becoming outdated and people forgetting about it.
3) Validates automatically.

The deplock.toml file is that single source of truth. It is the coordinating document that specifies all the external dependencies that you need to build your software. And it doesn't go silent out of date; if anyone upgrades to a newer version of Android Studio, for example, deplock validation will fail until the deplock.toml file is updated.


## License
MIT - see LICENSE

