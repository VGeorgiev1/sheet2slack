function myTrigger(evt){
  var key = PropertiesService.getScriptProperties().getProperty('slackKey');
  var fetch = UrlFetchApp.fetch("https://slack.com/api/channels.list?token=" + key);
  var response = JSON.parse(fetch.getContentText().toString())
  var name = SpreadsheetApp.getActiveSpreadsheet().getName()
  var channel = response.channels.filter(function(c){return c.name == name})[0]
  
  if(channel){
    if(hasValue(evt.oldValue, evt.value)){
      var text = "Spredsheet \"" + SpreadsheetApp.getActive().getName() +"\" on sheet \""+SpreadsheetApp.getActiveSheet().getName()+"\" edited at \"" + evt.range.getA1Notation()+"\""+" New value: \"" + evt.value + "\""
      var req = UrlFetchApp.fetch("https://slack.com/api/chat.postMessage?token="+key+"&channel="+channel.id+"&text=" + encodeURIComponent(text));
    }
  }
}
function hasValue(old_value,new_value){
  var new_trimmed = new_value.trim()
  if((old_value != new_value) && (new_trimmed != old_value) && (new_value != "" || new_value!= " ")){
    return true
  }
  return false
}
