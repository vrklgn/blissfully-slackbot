// TODO : Add responsible team to response
// TODO : Only do the slack message building like... once

// ADD YOUR SLACK VERIFICATION TOKEN HERE
var slackToken = "";

// ADD YOUR SLACK BEARER OAUTH TOKEN HERE
var slackAPIToken = "Bearer xo<KEY>";

// ADD YOUR SLACK DEBUG CHANNEL ID HERE
var slackDebugChannel = "";

// ADD BLISSFULLY API KEY HERE
var blissfullyAPIKey = "";


// FUNCTION : Dead function but required for Slack interactivity
function doGet(e) {
  return HtmlService.createHtmlOutput("OK");
}

// FUNCTION : What to do when a webrequest is sent

function doPost(e) {

// Safety check if the request comes from your Slack or not
if (e.parameters.token == slackToken || JSON.parse(e.parameters.payload).token == slackToken) {
// If the value is available within parameters.token it is a slash command
  if (e.parameters.token == slackToken) {
  // Debugging alert to see what searchqueries are made - comment out if not needed
  debugAlert(e.parameters.user_name + " is searching for: " + e.parameters.text);
  return ContentService.createTextOutput(slashCommand (e.parameters)).setMimeType(ContentService.MimeType.JSON);
  }
  
  else {
    buttonfields = JSON.parse(e.parameters.payload)
    buttonCommand (buttonfields);
    return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT)
    }
  }

else {
  return ContentService.createTextOutput("Not allowed").setMimeType(ContentService.MimeType.TEXT);
    }
  }

function debugAlert(alertmessage) {
  
 
  const webhook = "https://slack.com/api/chat.postMessage"; //Paste webhook URL here
  var options = {
    "method": "post", 
    "contentType": "application/json", 
    "headers": {
      "Authorization": slackAPIToken},
      "payload": JSON.stringify({
        "channel": slackDebugChannel,
        "text": JSON.stringify(alertmessage)
      })};

UrlFetchApp.fetch(webhook, options);
};



function buttonCommand (slackContent) 
{
  var slackSlug = String(slackContent.actions[0].value);
  var slackChannelID = String(slackContent.channel.id);
  var slackChannelName = String(slackContent.channel.name)
  var slackResponseURL = String (slackContent.response_url)
  var appData = GetApp(slackSlug);
  var sendStatus = sendToChannel(appData,slackChannelID,slackChannelName);
  if (sendStatus == true){
    var options = {
    "method": "post", 
    "contentType": "application/json", 
    "payload": JSON.stringify({
      "delete_original": "true"
      })};
  UrlFetchApp.fetch(slackResponseURL, options);
  }
else {
  var options = {
    "method": "post", 
    "contentType": "application/json", 
    "payload": JSON.stringify({
      "replace_original": false,
      "response_type": "ephemeral",
      "text": "Hey, it looks like I'm not allowed to post in this channel! 😢"
      })};
  UrlFetchApp.fetch(slackResponseURL, options);
}
}
  
  
      


function slashCommand (slackContent)
{
  var slackSlug = String(slackContent.text);
  var slackChannel = String(slackContent.channel_name);

  try   {
   var appData = GetApp(slackSlug);
   return (sendToUser(appData,slackChannel))
   
} 

  catch (error) {

  return ("Sorry, but I could not find the app " + slackSlug + ". 🙁")
  } 
}


// FUNCTION : Fetch app information from Blissfully using API

function GetApp(slackSlug) {

  // Change this Payload to fetch new fields (https://developer.blissfully.com/reference/queries/app)
  const payload = `{app (slug:"`+slackSlug+`") {slug name url logo description serviceEntityRelationship {procurementStatus peopleUseCount itAdmin{primaryEmail}}}}`;
  // Fetches the app from the blissfully API using GraphQL
  var directoryFetch = UrlFetchApp.fetch("https://api.blissfully.com/prod/graphql", {"method": 'post',"contentType":"application/json","headers":{"Authorization": blissfullyAPIKey},"payload": JSON.stringify({ query: payload })});

  // Parses the data into JSON to be able to fetch individual nodes
  var directoryJson = directoryFetch.getContentText();
  var directoryData = JSON.parse(directoryJson);
  return (directoryData);

  };



// FUNCTION : Parses the result from Blissfully and sends message to Slack 
function sendToUser(appData,slackChannel) {
  
  // Some error handling to avoid dead data points in the message
  try {
  var appowner = appData.data.app.serviceEntityRelationship.itAdmin.primaryEmail;
  } catch (error) {
  var appowner = "Nobody is currently the system owner";
  }

    try {
  var appusers = appData.data.app.serviceEntityRelationship.peopleUseCount;;
  } catch (error) {
  var appusers = "0";
  }

// Everybody loves emojis!

    try {
  var appstatus = appData.data.app.serviceEntityRelationship.procurementStatus;
  if (appstatus == "Active" || appstatus == "Approved") {
    var appstatus = "✅ Active / Approved"
  } else {}
    if (appstatus == "InReview" || appstatus == "Requested") {
    var appstatus = "🕵️ In Review"
  } else {}
   if (appstatus == "Unknown") {
    var appstatus = "👻 Unknown"
  } else {}
  } catch (error) {
  var appstatus = "👻 Unknown";
  }


// These fields always exist and does not need any error handling - thats kinda nice

  var appname = appData.data.app.name;
  var appdesc = appData.data.app.description;
  var appurl = appData.data.app.url;
  var logo = 'http:'+appData.data.app.logo;


if (slackChannel == "directmessage"){
  var button = {"type": "divider"};}
  else {var button = {"type": "actions","elements": [{"type": "button","text": {"type": "plain_text","text": "Share "+appname+" to "+slackChannel},"value": appname,"action_id": "testbutton"}]};}

  var result = JSON.stringify({"Content-type": "application/json","blocks": [{"type": "header", "text": { "type": "plain_text", "text": appname}},
      {"type": "section", "text": {"type": "mrkdwn", "text": appdesc + "\n\n*URL:* "+ appurl}, "accessory": {"type": "image", "image_url": logo , "alt_text": appname}},
      { "type": "divider"},{"type": "section", "text": {"type": "mrkdwn", "text":"*App status:* "+ appstatus + "\n*System owner:* " + appowner + "\n*Number of users:* " + appusers}},
      {"type": "context","elements": [{"type": "mrkdwn","text": "Number of users is based on Google SSO & SAML login and may be inaccurate. \nData provided by <https://app.blissfully.com/|*Blissfully*>"}]},
      button]});
      
      
  return (result)
  };





// FUNCTION : Parses the result from Blissfully and sends message to Slack 
function sendToChannel(appData,slack_channel) {
  
  // Some error handling to avoid dead data points in the message
  try {
  var appowner = appData.data.app.serviceEntityRelationship.itAdmin.primaryEmail;
  } catch (error) {
  var appowner = "Nobody is currently the system owner";
  }

    try {
  var appusers = appData.data.app.serviceEntityRelationship.peopleUseCount;;
  } catch (error) {
  var appusers = "0";
  }

// Everybody loves emojis!

    try {
  var appstatus = appData.data.app.serviceEntityRelationship.procurementStatus;
  if (appstatus == "Active" || appstatus == "Approved") {
    var appstatus = "✅ Active / Approved"
  } else {}
    if (appstatus == "InReview" || appstatus == "Requested") {
    var appstatus = "🕵️ In Review"
  } else {}
   if (appstatus == "Unknown") {
    var appstatus = "👻 Unknown"
  } else {}
  } catch (error) {
  var appstatus = "👻 Unknown";
  }


// These fields always exist and does not need any error handling - thats kinda nice

  var appname = appData.data.app.name;
  var appdesc = appData.data.app.description;
  var appurl = appData.data.app.url;
  var logo = 'http:'+appData.data.app.logo;

  var webhook = "https://slack.com/api/chat.postMessage" //Paste webhook URL here
  var options = {
    "method": "post", 
    "contentType": "application/json", 
    "muteHttpExceptions": true, 
    "headers": {"Authorization": slackAPIToken},
    "payload": JSON.stringify({
      "unfurl_links": false, 
      "channel": slack_channel,
      "blocks": [{"type": "header", "text": { "type": "plain_text", "text": appname}},
      {"type": "section", "text": {"type": "mrkdwn", "text": appdesc + "\n\n*URL:* "+ appurl}, "accessory": {"type": "image", "image_url": logo , "alt_text": appname}},
      { "type": "divider"},{"type": "section", "text": {"type": "mrkdwn", "text":"*App status:* "+ appstatus + "\n*System owner:* " + appowner + "\n*Number of users:* " + appusers}},
      {"type": "context","elements": [{"type": "mrkdwn","text": "Number of users is based on Google SSO & SAML login and may be inaccurate. \nData provided by <https://app.blissfully.com/|*Blissfully*>"}]},
      ]}) 
  };


var post = UrlFetchApp.fetch(webhook, options);
var poststatus = JSON.parse(post.getContentText()).ok
return (poststatus)

};
