# User Voice UI #

As a product owner you want to add the features to your product that are most valuable to your customers. There are multiple channels to get feedback from your customers and one of them that scales to thousands of users is [User Voice](http://www.uservoice.com). The Microsoft Visual Studio Cloud Services organization is responsible for Visual Studio Team Services, and uses User Voice intensily as described in the blog post [How we use User Voice to make a better product](https://blogs.msdn.microsoft.com/visualstudioalm/2015/10/08/how-we-use-user-voice-to-make-a-better-product/).

 ![Customer Feedback group on work item form](https://raw.githubusercontent.com/Microsoft/vsts-uservoice-ui-extension/master/extension/img/Work-item-screenshot.png?token=ABEaRWGtmftkpIVO9r0hxWOBC_eWAPllks5W7JM0wA%3D%3D)

In our backlogs, we add links to our Feature work items to these user voice items so we are aware of the customer value during prioritization, and to remember that we need to close the User Voice suggestion once it is deployed. Going through the links of all work items doesn't work, and that is where this extension comes in. It reads the work item links and parses the url. If the url is a User Voice suggestion, it will retrieve the title, votes and the state from User Voice and shows that data on the front page of your work item.

As we will add more contribution points in the future that user voice data will show up on more experiences, like on the cards on the Kanban board and the results of the query.

You can find the source code of this extension in [a GitHub repository](https://github.com/Microsoft/vsts-uservoice-ui-extension).

Ewald Hofman

> Microsoft DevLabs is an outlet for experiments from Microsoft, experiments that represent some of the latest ideas around developer tools. Solutions in this category are designed for broad usage and you are encouraged to use and provide feedback on them; however, these extensions are not supported nor are any commitments made as to their longevity.