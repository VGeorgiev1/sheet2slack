'use strict';

const express = require('express');
const app = express();
const port = 3000;
const fetch = require('node-fetch');


const checkTimer =  1000 * 60 * 60 * 24; // Check for unsolved pins once per day

app.listen(port, ()=>{
    setInterval(async()=>{
        slackRequest(
        {
            method: 'channels.list',
            token: process.env.SLACK_KEY
        }).then((body)=>{
            let channels = body.channels

            for (const c of channels) {
                slackRequest(
                {
                    method: 'pins.list',
                    token: process.env.SLACK_KEY,
                    channel: c.id

                }).then(async (body)=>{
                    const items = body.items;
                    for (const pin of items) {
                        if (new Date(Number(pin.created * 1000) + 12096e5).getDay() >= new Date()) { // check if the pinin creation date was two weeks or more before today    
                            slackRequest(
                            {
                                method: 'conversations.replies',
                                token: process.env.SLACK_KEY,
                                channel: pin.channel,
                                ts: pin.message.ts

                            }).then((body)=>{
                                const rex = new RegExp('<@\.+>');
                                let sendTo = null;
                                for(let i = body.messages.length - 1;i >= 0;i--){
                                    let match = body.messages[i].text.match(rex)
                                    if(match){
                                        sendTo = match[0]
                                        break;
                                    }
                                }
                                if(sendTo.length != 0){
                                    slackRequest(
                                    {   
                                        method: 'chat.postMessage',
                                        token: process.env.SLACK_BOT_KEY,
                                        channel: pin.channel,
                                        thread_ts: pin.message.thread_ts || pin.message.ts,
                                        text: sendTo + ' You have an unresolved pin'
                                    }).then((body)=>{
                                        console.log(body)
                                    })
                                }
                            })
                            
                        }
                    }
                })
            }
        })
        
    },checkTimer)
});


function parse(responseBody) {
  if (!responseBody) {
    throw new Error('no body');
  }
  return JSON.parse(responseBody.toString());
}

async function slackRequest(params, callback) {
  let host = 'https://slack.com/api/' + params['method'] + '?';
  delete params['method'];

  const uris = [];
  for (const p in params) {
    uris.push(p + '=' + params[p]);
  }
  host += uris.join('&');
  let body = await fetch(host)
  return await body.json()

}
