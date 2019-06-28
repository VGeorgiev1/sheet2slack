'use strict';

const express = require('express');
const app = express();
const port = 3000;
const fetch = require('node-fetch');


const checkTimer = 2000 //1000 * 60 * 60 * 24; // Check for unsolved pins oncea day

app.listen(port, ()=>{
    setInterval(()=>{
        slackRequest(
        {
            method: 'channels.list',
            token: process.env.SLACK_KEY

        }).then((body)=>{
            const channels = body.channels;
            for (const c of channels) {
                slackRequest(
                {
                    method: 'pins.list',
                    token: process.env.SLACK_KEY,
                    channel: c.id

                }).then((body)=>{
                    const items = body.items;
                    for (const p of items) {
                        //if (new Date(Number(p.created * 1000) + 12096e5).getDay() >= new Date()) { // check if the pin creation date was two weeks or more before today
                            const rex = new RegExp('<@\.+>');
                            const match = p.message.text.match(rex);
                            if (match) {
                                const id = match[0].slice(2, match[0].length-1);
                                slackRequest(
                                {
                                    method: 'im.open',
                                    token: process.env.SLACK_BOT_KEY,
                                    user: id
                                }).then((body)=>{
                                    const dmId = body.channel.id;
                                    if (dmId) {
                                        slackRequest(
                                        {method: 'chat.postMessage',
                                            token: process.env.SLACK_BOT_KEY,
                                            channel: dmId, text: 'You have an old pinned still not resolved in channel '+ c.name + '\n ' + p.message.permalink
                                        }).then((body)=>{
                                            console.log(body);
                                        });
                                    }
                                })
                            }
                        //}
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
