# Sample extension: User Voice UI
This repo is a sample for how to add contributions to the work item form using the extensibility model of Visual Studio Team Services. You can find the result of this extension in the [VSTS marketplace](https://marketplace.visualstudio.com/items?itemName=ms-devlabs.vsts-uservoice-ui). You can learn more about about the integration cababilities of VSTS in [our documentation](https://www.visualstudio.com/integrate/explore/explore-vso-vsi).

 ![Customer Feedback group on work item form](https://github.com/Microsoft/vsts-uservoice-ui-extension/blob/master/readme.png)

This sample shows a couple of concepts that can help you to understand better how to integrate with VSTS. The concepts that are showcased in this sample are the following:
* Add a group to the work item form
* Add configuration options to your extensions, including a page in the admin area
* Use a Web API project to allow calling an external resource that doesn't allow Cross Domain

The sample contains the extension itself and a Web API project. The Web API project is hosted in the web-api folder and is using Visual Studio, and the extension itself is in the extension folder.

### Web API
The project contains one controller which basically is nothing more than a proxy to call the User Voice APIs. User Voice has a v2 set of APIs, but they don't allow read-only access yet. And since the key that is used to call these APIs is not secured you don't want to use an api key that allows read/write operations. You can find more information about the User Voice APIs at https://developer.uservoice.com/docs/api/reference/. The Web API needs to be hosted in an environment which is publicly accessible when you install the extension on VSTS, and I chose to use Azure. You can publish a Web API in many different ways, including Continuous Deployment with [Release Management in VSTS](https://www.visualstudio.com/en-us/features/release-management-vs.aspx). In this sample I publish right from Visual Studio.

To create an API key for your User Voice account, go to https://[account name].uservoice.com/admin/settings/api (don't forget to replace the [account name]).

### Extension
The extension consists of a manifest (vss-extension.json) to describe the extension. That is basically the only file that is in the installed package. All other files are again hosted on Azure. You could have chosen to include them in the package so you don't have to host them yourself, but since I needed the Web API project anyway I chose to host the files on Azure too. When there is an update to the extension, I only need to update the files on Azure.

The extension contains a couple of folders for the plumbing (like the images that you see in the marketplace), but the most important ones are vsts-extension-uviz-settings-hub and vsts-extension-uviz-wi-group. These folders contain the files that are used by the contribution points in the extension. The code should be pretty self explanatory, but if you have questions, don't hestitate to reach out to me.

Ewald Hofman
