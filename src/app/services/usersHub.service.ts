import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { PopupService } from './popup.service';
import { TaskItem, UserTask } from '../interfaces/user-tasks.interface';

@Injectable({providedIn: 'root'})

export class UsersHubService {

    private hubConnection!:HubConnection;

    async onConnectedUser(){
        this.hubConnection = new HubConnectionBuilder()
        .withUrl(`${environment.usersUrl}/commonHub`,{
            accessTokenFactory: () => localStorage.getItem('tmt') || ""
        })
        .build();

        try {
            await this.hubConnection.start();
            return console.log("Hubconnection success!");
        } catch (err) {
            console.log("Hubconnection error");
            throw err;
        }
    }

    onLeaveGroup(groupName:string){
        return this.hubConnection.invoke("OnLeaveGroup", groupName);
    }

    async stopConnection(){
        return this.hubConnection.stop();
    }

    onInvokeJoinedGroup(groupName:string){
        this.hubConnection.invoke("OnJoinedGroup", groupName);
    }

    onReceiveUserLeftGroup(callback:(username:string) => void){
        this.hubConnection.on("onReceiveUserLeftGroup", callback);
    }

    onReceiveUserJoinedGroup(callback:(username:string) => void){
        this.hubConnection.on("onReceiveUserJoinedGroup", callback);
    }

    onInvokeDeleteGroup(groupName:string){
        this.hubConnection.invoke("OnRemoveGroup", groupName);
    }

    onJoinedGroupReceiver(callback:(message:string) => void){
        this.hubConnection.on("OnJoinedGroup", callback);
    }

    onReceiveGroupTask(callback: (userTask:UserTask) => void){
        this.hubConnection.on("onReceiveGroupTask", callback);
    }

    onInvokeSendTaskToEveryone(userTask:UserTask){
        this.hubConnection.invoke("SendTaskToEveryone", userTask);
    }

    onInvokeDeletedGroupTask(taskId:string, groupName:string){
        this.hubConnection.invoke("OnDeletedGroupTask", taskId, groupName);
    }

    onReceiveDeletedGroupTask(callback:(taskId:string) => void){
        this.hubConnection.on("onReceiveDeletedGroupTask", callback);
    }

    onInvokeRemoveGroup(groupName:string){
        this.hubConnection.invoke("OnRemoveGroup", groupName);
    }

    onReceiveRemovedGroup(callback:(sign:boolean) => void){
        this.hubConnection.on("onReceiveRemovedGroup", callback);
    }

    onInvokeSendGroupItemTask(taskItem:TaskItem){
        this.hubConnection.invoke("OnSendTaskItemToGroup", taskItem);
    }

    onReceiveGroupTaskItem(callback: (taskItem:TaskItem) => void){
        this.hubConnection.on("onReceiveGroupTaskItem", callback);
    }

    onInvokeSendRemovedTaskItem(taskItem:TaskItem){
        this.hubConnection.invoke("OnSendRemovedTaskItem", taskItem);
    }

    onReceiveRemovedTaskItem(callback:(taskItem:TaskItem) => void){
        this.hubConnection.on("onReceiveRemovedTaskItem", callback);
    }

    onInvokeSendCompletedTaskItem(taskItem:TaskItem, taskOwnerName:string, username:string){
        this.hubConnection.invoke("OnSendCompletedTaskItem", taskItem, taskOwnerName, username);
    }

    onReceiveCompletedTaskItem(callback:(taskItem:TaskItem, taskOwnerName:string, username:string) => void) {
        this.hubConnection.on("OnReceiveCompletedTaskItem", callback);
    }

    constructor(private popupService:PopupService){}


}