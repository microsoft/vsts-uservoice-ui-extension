This extension scans the relations in your work item for links to your User Voice account, and shows these suggestions as annotations on the work item form. Utilizes Web API, Azure, Typescript, grunt, and tsd. 

### Structure ###

```
/scripts            - VSS SDK files
/img                - Image assets for extension and description
/typings            - Typescript typings
/vsts-uservoice-ui-settings-hub   - files for the contribution to the Admin area to configure the settings
/vsts-uservoice-ui-wi-group       - files for the contribution on the work item form

details.md          - Description to be shown in marketplace   
vss-extension.json  - Extension manifest
```

### Usage ###

1. Clone the repository
2. Install node.js
1. `npm install` to install required dependencies
2. `grunt` to build and package the application

#### Grunt ####

Three basic `grunt` tasks are defined:

* `build` - Compiles TS files in `scripts` folder
* `package` - Builds the vsix package
* `publish` - Publishes the extension to the marketplace using `tfx-cli`
* `deploy` - Uploads the files to Azure using FTP (add your credentials to the Azure FTP site in the file .ftppass)

Note: To avoid `tfx` prompting for your token when publishing, login in beforehand using `tfx login` and the service uri of ` https://app.market.visualstudio.com`.

#### Including framework modules ####

The VSTS framework is setup to initalize the requirejs AMD loader, so just use `import Foo = require("foo")` to include framework modules.
