const express = require('express')
const app = express()
const port = 3000
const fetch = require('fetch')


let check_timer = 1000 * 60 * 60 * 24; // Check for unsolved pins oncea day

app.listen(port,()=>{

    setInterval(()=>{
        slackRequest({method: "channels.list" ,token: process.env.SLACK_KEY}, (body)=>{
            let channels = body.channels
            for(let c of channels){
                slackRequest({method: "pins.list" ,token: process.env.SLACK_KEY, channel: c.id}, (body)=>{
                    let items = body.items
                    for(let p of items){
                        if(new Date(Number(p.created * 1000) + 12096e5).getDay() >= new Date()){ // check if the pin creation date was two weeks or more before today 
                            let rex = new RegExp("<@\.+>")
                            let match = p.message.text.match(rex)
                            if(match){
                                let id = match[0].slice(2,match[0].length-1)
                                slackRequest({method: "im.open" ,token: process.env.SLACK_BOT_KEY, user: id}, (body)=>{
                                    let dm_id = body.channel.id
                                    if(dm_id){
                                        slackRequest({method:"chat.postMessage",token: process.env.SLACK_BOT_KEY,channel: dm_id,text: "You have an old pinned still not resolved in channel "+ c.name + "\n " + p.message.permalink}, (body)=>{
                                            console.log(body)
                                        })
                                    }
                                })
                            }
                        }
                    }
                })
            }
        })

    },check_timer)
})
function parse(responseBody){
    if(!responseBody){ throw Error('no body')}
    return JSON.parse(responseBody.toString())
}
function slackRequest(params, callback){
    let host = "https://slack.com/api/" + params["method"] + "?"
    delete params["method"]
    let uris = []
    for(let p in params){
        uris.push(p + "=" + params[p])
    }
    host += uris.join("&")
    fetch.fetchUrl(host, (error, meta, body)=>{
        if(error){
            throw Error(error)
        }
        if(!body){
            throw Error('no body for request' + host)
        }
        callback(parse(body))
    })
}