import { Injectable } from '@angular/core';


declare var $: any

@Injectable({
    providedIn: 'root'
})
export class MainService {

    public PS_peerStream: {[jid:string]:MediaStream}={}

    constructor(
     
    ) { }

    
   
    
}
