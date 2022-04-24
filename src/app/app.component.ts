import { Component, ElementRef, Injectable, ViewChild } from '@angular/core';
import { FormBuilder, Validators , FormGroup} from '@angular/forms';
//const { exec } = require("child_process");
//import * as dotenv from 'dotenv'
//dotenv.config()
import { HttpClient } from '@angular/common/http';
import { client, xml } from '@xmpp/client'
import { HtmlParser } from '@angular/compiler';
import {MainService} from './service/ms.service'
//import * as debug from '@xmpp/debug'
//import { client, xml } from 'xmpp__client'
//import { io, Socket } from "socket.io-client"
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

@Injectable({
  providedIn: 'root'
})

export class AppComponent {
//@ViewChild('localVideo') localVideo: ElementRef
 localStream:any
 title = 'Chatapp';
// public localVideo:any
 //public remoteVideo:any 
 public JID_PCConnection: {[jid:string]:RTCPeerConnection}={}
 public jidr:string=''
 public jidl:string=''
 public xmpp:any
 public from:string=''
 public myJID:string=''
 public password:string=''
 public PCConnection:RTCPeerConnection[]=[]
 public peerJID:any[]=[]
 public recVidStream:any[]=[]
 public currentlyCallingPeers:any[]=[]
 public callAccepted:boolean=false 
 public messageRecived:any
 public videoIndex:any=0
 public constraints = {audio: false, video: true};
 // public configuration = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
 public configuration = {iceServers: [ {
  urls: 'turn:192.241.130.220:3478', 
  username: 'bozu', 
  credential: 'bozu@123'
}]};

//public configuration = {};

  constructor(
  public http:HttpClient,
  public roomClient:MainService
  )
  { 
   
    //this.localVideo = <HTMLVideoElement>document.getElementById('localVideo');
    //this.remoteVideo = <HTMLVideoElement>document.getElementById('remoteVideo');
  }
  // public Register()
  // {
  //   let username=((document.getElementById("userreg") as HTMLInputElement).value)
  //   let password=((document.getElementById("pwdreg") as HTMLInputElement).value)
  //   let cmd="docker exec  ejabberd bin/ejabberdctl register "+username+" localhost "+password
  //   var foo: child.ChildProcess = child.exec(cmd, (error:any, stdout:any, stderr:any) => {
  //     if (error) {
  //         console.log(`error: ${error.message}`);
  //         return;
  //     }
  //     if (stderr) {
  //         console.log(`stderr: ${stderr}`);
  //         return;
  //     }
  //     this.jid="jid:"+username+"@localhost"
  //    // loginClient()
  //     console.log(`stdout: ${stdout}`);
  // });
  // }
 public async Register()
 {
      let username=((document.getElementById("userreg") as HTMLInputElement).value)
      let password=((document.getElementById("pwdreg") as HTMLInputElement).value)
      let data = {
        "user": username,
        "host": "localhost",
        "password": password
      }
      const headers = { 
      'Authorization': 'Bearer Fbgpm0QlFaL5HHnMpLXSm1p8GJT73Z0T',
      'Access-Control-Allow-Origin': "*"
      };
      this.http.post('https://romu.us:5443/api/register',data,{headers}).subscribe(data => {
        console.log("Data : "+data)
        this.jidr=username+"@localhost"
    });
 }

  public async Login()
  {
  //  let localVideo = <HTMLVideoElement>document.getElementById('localVideo');
    // try {
    //   // Get local stream, show it in self-view, and add it to be sent.
    //   const stream =
    //     await navigator.mediaDevices.getUserMedia(this.constraints);
    //     this.localStream=stream
    //   //stream.getTracks().forEach((track) =>
    //     // pc.addTrack(track, stream));
    //    localVideo.srcObject=stream     
    // } catch (err) {
    //   console.error(err);
    // }
      this.myJID=((document.getElementById("userlog") as HTMLInputElement).value)
      this.password=((document.getElementById("pwdlog") as HTMLInputElement).value)
      this.xmpp = client({ service: 'wss://romu.us:5443/ws', domain: 'localhost', username: this.myJID, resource:this.myJID ,password: this.password});
   //  debug(this.xmpp, true) // always enabled
      this.xmpp.start().catch(console.error)     
      this.xmpp.on('online',(data:any)=>
      {
            console.log("you are online")
          //  console.log(`your jid is ${data.jid.user}`)
            this.xmpp.send(xml("presence"));
          // console.log("XMPP Client Online", data.toString())
          this.jidl="jid:"+this.myJID
          //  setTimeout(() => {
          //     sendQuery()
          // }, 5000);
          // setTimeout(() => {
          //     sendMessage()
          // }, 5000);
      })
      
      this.xmpp.on("stanza",  async (stanza:any) => {
              if(stanza.is('presence'))
              {
                  console.log("stanza called")
              }
              else if (stanza.is("message")) {
                  
                   console.log("message called")
                   let Data=JSON.parse(stanza.getChild("body").text())
                   if(Data.tos==='callMessage')
                   {
                   if(Data.type=='offer')
                   {
                        console.log("offer Recived: "+Date.now())
                      //  this.from=stanza.attrs.from 
                        let pc=await this.createPeerConnection(Data.from) 
                        console.log("after peer connection: "+Date.now())
                        await pc.setRemoteDescription(Data)
                        let answer=await pc.createAnswer()
                        await pc.setLocalDescription(answer)
                        const message = xml(
                          "message",          
                          { type: "chat", to: stanza.attrs.from },  
                          xml("body", {},JSON.stringify({type:answer.type,sdp:answer.sdp,tos:'callMessage',to:Data.from,from:Data.to})))
                        await this.xmpp.send(message)
                   }
                  else if(Data.type=='answer')
                   {
                       console.log("Answer Recived: "+Date.now())
                       console.log(stanza.getChild("body").text()) 
                       console.log(Data)
                       if(this.JID_PCConnection[Data.from])
                       await this.JID_PCConnection[Data.from].setRemoteDescription(Data)
                   }
                   else if(Data.type=='candidate')
                   {
                       console.log("Candidate Recived: "+Date.now())
                       if(this.JID_PCConnection[Data.from])
                       this.JID_PCConnection[Data.from].addIceCandidate(Data.candidate)
                   }
                  }
                  else if(Data.tos==='chatMessage')
                  {
                      console.log("chat message recived")
                      console.log(stanza.getChild("body").text())
                      this.messageRecived=Data.message
                        // this.messageRecived=stanza.getChild("body").text()
                         this.from=stanza.attrs.from
                         this.from=this.from.split('@')[0]
                         console.log("inside message: "+stanza.getChild("body").text())
                         console.log(stanza.getChild("body").text())
                  }
                  else if(Data.tos==='AddRequest')
                  {
                    this.initiateWebrtc(Data.addedJID)
                  }
                  else if(Data.tos==='callRequest')
                  {
                    let res:any
                    let callAudio = <HTMLAudioElement>document.getElementById('callAudio');
                    let confirmAction
                    callAudio.src="../assets/ringtone.mp3"
                    await callAudio.load()
                    await callAudio.play()
                    setTimeout(() => {
                      confirmAction=null
                     if(!(res==='accept' || res==='reject'))
                     {
                      let jsonReponseData={
                        "tos":"callResponse",
                        "result":'none',
                        "to":Data.from,
                        "from":Data.to
                      }
                      const responseCallMessage = xml(
                        "message",
                        { type: "chat", to: Data.from },
                        xml("body", {},JSON.stringify(jsonReponseData)))
                      this.xmpp.send(responseCallMessage)
                     }
                    }, 10000);
                   
                    let date = new Date();  
                    //console.log(date.getTime());
                    console.log("ring end time: "+date.getTime())
                       
                        console.log("request recived successfully")
                        let callingPeer=Data.from
                         confirmAction = confirm(callingPeer+" is calling you, what would you do? ")
                        if(confirmAction)
                        {
                            res="accept"
                            this.callAccepted=true
                            await callAudio.pause()
                            await this.passJIDToOtherPeers(Data.from) 
                        }
                        else{
                            res="reject"
                            this.callAccepted=false
                            await callAudio.pause()
                        }
                        let jsonReponseData={
                          "tos":"callResponse",
                          "result":res,
                          "to":Data.from,
                          "from":Data.to
                        }
                        const responseCallMessage = xml(
                          "message",
                          { type: "chat", to: Data.from },
                          xml("body", {},JSON.stringify(jsonReponseData)))
                        this.xmpp.send(responseCallMessage)
                  }
                  else if(Data.tos==='endCall')
                  {
                        if(this.JID_PCConnection[Data.from])
                        {
                            this.JID_PCConnection[Data.from].close()
                            console.log("before: "+this.peerJID.length)
                            let i=this.peerJID.indexOf(Data.from)
                            if(i!=-1)
                            this.peerJID.splice(i,1)
                            let j=this.currentlyCallingPeers.indexOf(Data.from)
                            if(j!=-1)
                            this.currentlyCallingPeers.splice(j,1)
                            console.log("after: "+this.peerJID.length)
                        }
                        // if(this.roomClient.PS_peerStream[Data.from])
                        // this.roomClient.PS_peerStream[Data.from]=null
                  }
                  else if(Data.tos==='callResponse')
                  {
                       if(Data.result==='accept')
                       {
                          this.callAccepted=true
                          //this.videoIndex++
                          await this.passJIDToOtherPeers(Data.from) 
                          this.initiateWebrtc(Data.from)
                       }
                       else if(Data.result==='reject')
                       {
                          //  let i=this.currentlyCallingPeers.indexOf(Data.from)
                          //  if(i!=-1)
                          //  this.currentlyCallingPeers.splice(i,1)
                           this.callAccepted=false
                       }
                      //  else if(Data.result==='none')
                      //  {
                        let i=this.currentlyCallingPeers.indexOf(Data.from)
                        if(i!=-1)
                        this.currentlyCallingPeers.splice(i,1)
                       //}
                  }
              }
      })
      this.xmpp.on("error",(error:any)=> console.log("something wrong happerned: ",error))
      this.xmpp.on("offline",(date:any)=>
      {
          console.log("client is offline")
      })
  }

  public async passJIDToOtherPeers(calleeJID:any)
{
    for(let jid in this.peerJID)
    {
      console.log("other jid: "+this.peerJID[jid])
      let jsonCallData={
        "tos":"AddRequest",
        "to":this.peerJID[jid],
        "from":this.myJID,
        "addedJID":calleeJID
      }  
      const requestToADDPeer = xml(
        "message",
        { type: "chat", to: this.peerJID[jid] },
        xml("body", {},JSON.stringify(jsonCallData)))
      await this.xmpp.send(requestToADDPeer)
    }
}
  public async createPeerConnection(jid:string) {
    try {
     
      let localVideo = <HTMLVideoElement>document.getElementById('localVideo');
      const stream =
        await navigator.mediaDevices.getUserMedia(this.constraints);
        this.localStream=stream 
        localVideo.srcObject=stream 
    } catch (err) {
        console.error("error in createpeerconnection: "+err);
    }
    
    let pc = new RTCPeerConnection(this.configuration);
    this.JID_PCConnection[jid]=pc
    pc.onicecandidate = (e:any) =>
    {
        let date=new Date()
        console.log("on ice called: "+date.getTime())
        console.log(e)
        let candidate={
          type:'candidate',
          tos:'callMessage',
          candidate:e.candidate,
          from:this.myJID,
          to:jid
        }
        const message = xml(
          "message",
          { type: "chat", to: jid },
          xml("body", {},JSON.stringify(candidate)))
        this.xmpp.send(message)
    }
    let remoteVideo=<HTMLVideoElement>document.getElementById('remoteVideo');
    pc.ontrack = async(e:any) =>
    {
          this.roomClient.PS_peerStream[jid]=e.streams[0]
          this.peerJID.push(jid)
          console.log("video seen : "+await Date.now())
    }
    this.localStream.getTracks().forEach((track:any) => pc.addTrack(track, this.localStream));
    return pc
  }

  public async initiateWebrtc(jID:any)
  {
    console.log("initiate webrtc 1: "+await Date.now())
    let pc=await this.createPeerConnection(jID)
    console.log("initiate webrtc 2: "+await Date.now())
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log(offer)
    const message = xml(
      "message",
      { type: "chat", to: jID },
      xml("body", {},JSON.stringify({type:offer.type,sdp:offer.sdp,tos:'callMessage',to:jID,from:this.myJID})))
    this.xmpp.send(message)
  }
  public async startcall()
  {
      
        let otherJID=((document.getElementById("jid") as HTMLInputElement).value)
        if(this.currentlyCallingPeers.indexOf(otherJID)!==-1 || this.peerJID.indexOf(otherJID)!==-1)
        return
        let date=new Date()
        console.log("ring start time: "+ date.getTime())
        this.currentlyCallingPeers.push(otherJID)
       // console.log("this from: "+this.from)
        let jsonCallData={
          "tos":"callRequest",
          "to":otherJID,
          "from":this.myJID
        }  
        const requestCallMessage = xml(
          "message",
          { type: "chat", to: otherJID },
          xml("body", {},JSON.stringify(jsonCallData)))
        this.xmpp.send(requestCallMessage)
    //this.xmpp.send({'offer': offer});   
    // pc.onnegotiationneeded = async () => {
    //   try {
    //     await pc.setLocalDescription(await pc.createOffer());
    //     // send the offer to the other peer
    //     console.log(pc.localDescription)
    //     //signaling.send({desc: pc.localDescription});
    //   } catch (err) {
    //     console.error(err);
    //   }
    // };
  }
  public stopcall()
  {
    for(let key in this.JID_PCConnection)
    {
        if(this.JID_PCConnection[key])
        {
            this.JID_PCConnection[key].close()
            //this.JID_PCConnection[key]=
        }
      }

    this.localStream.getTracks().forEach((track:any) => track.stop());
    this.localStream = null;
    for(let key in this.peerJID)
    {
          let jsonCallData={
            "tos":"endCall",
            "to":this.peerJID[key],
            "from":this.myJID
          }  
          const EndMessage = xml(
            "message",
            { type: "chat", to: this.peerJID[key] },
            xml("body", {},JSON.stringify(jsonCallData)))
          this.xmpp.send(EndMessage)
          
    }
    this.peerJID.splice(0,this.peerJID.length)
  }
  public send()
  {
    let jid=((document.getElementById("peerid") as HTMLInputElement).value)
    let msg=((document.getElementById("message") as HTMLInputElement).value)
    let msgjson={
      "message":msg,
      "tos":'chatMessage'
    }
    console.log("jid: "+jid+"msg: "+msg)
    const message = xml(
      "message",
      { type: "groupchat", to: jid },
      xml("body", {},JSON.stringify(msgjson)))
      this.xmpp.send(message)
  }
  public Logout()
  {
      if(this.xmpp)
      {
        this.jidl=''
        this.xmpp.stop().catch(console.error);
      }
  }
}