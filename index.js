const express = require('express')
const app = express()
const port = 3000
const fetch = require('fetch')
const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS
    }
});
var teamName 
fetch.fetchUrl("https://slack.com/api/team.info?token="+ process.env.SLACK_KEY,(error,meta,body)=>{
    let response = JSON.parse(body.toString());
    teamName = response.name
})
app.listen(port,()=>{
    setInterval(()=>{
        fetch.fetchUrl("https://slack.com/api/channels.list?token=" + process.env.SLACK_KEY,(error, meta, body)=>{
            
            for(let c of JSON.parse(body.toString()).channels){
                fetch.fetchUrl("https://slack.com/api/pins.list?token=" + process.env.SLACK_KEY + "&channel=" + c.id ,(error, meta, body)=>{

                    for(let p of JSON.parse(body.toString()).items){
                        if(new Date(Number(p.created * 1000) + 12096e5).getDay() = new Date()){
                            fetch.fetchUrl("https://slack.com/api/channels.history?token=" + process.env.SLACK_KEY + "&channel=" + c.id ,(error, meta, body)=>{
    
                                let response = JSON.parse(body.toString())
                                let rex = new RegExp("<@\.+>")
                                let tags = response.messages.filter(t => t.text.match(rex))
                                for(let i=0;i< response.messages.length;i++){
                                    let match = response.messages[i].text.match(rex)
                                    if(match){
                                        let id = match[0].slice(2,match[0].length-1)
    
                                        fetch.fetchUrl("https://slack.com/api/users.info?token=" + process.env.SLACK_KEY + "&user=" + id ,(error, meta, body)=>{
                                            let email = JSON.parse(body.toString()).user.profile.email
                                            var mailOptions = {
                                                from: process.env.EMAIL,
                                                to: email,
                                                subject: 'pending pin',
                                                text: 'You have been tagged for a pin in ' + teamName + " in channel " + c.name
                                            };
                                            transporter.sendMail(mailOptions, function(error, info){
                                                if (error) {
                                                  console.log(error);
                                                } else {
                                                  console.log('Email sent: ' + info.response);
                                                }
                                            });
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
            }
        });

    },2000)
})