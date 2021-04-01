# blissfully-slackbot
A Slackbot to query Blissfully for apps


## Step 1. Create Slack App
* Add Interactivity 
* Add Slashcommand (e.g /appcheck or /whatapp)
* Add Scopes
Scopes: 
chat:write
chat:write.public
commands
* **TAKE NOTE OF THE FOLLOWING:**
* Verification Token
* Bot User API Oauth Token


## Step 2. Apps Script Setup

* Create new Apps Script
* Upload code.gs
* Add Slack Verification Token
* Add Slack API Oauth Token
* (Optional) Add a Slack Debug Channel
* Add Blissfully API Key
* Deploy => New Deployment
* Select type "Web App"
* Execute as: Me
* Who has access: Anyone
* Deploy!

## Step 3. Finishing steps
* Copy URL and add it to the Request URL of your Slash command
* Copy the Deployment URL and add it to the Request URL of your Interactivity
