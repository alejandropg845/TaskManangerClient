import { DOCUMENT } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Inject, Injectable, signal} from "@angular/core";
import { environment } from "../../environments/environment";
import { TaskItem, UserTask } from "../interfaces/user-tasks.interface";
import { BehaviorSubject, filter, firstValueFrom, Subject, takeUntil } from "rxjs";
import { HandleBackendError } from "../interfaces/error-handler";
import { PopupService } from "./popup.service";

@Injectable({
    providedIn: 'root'
})
export class PagesService {

    token!:string | null;
    show_assigned_tasks_Signal = signal<boolean>(false);
    destroy$ = new Subject<void>();
    tempTasks:number[] = [];
    needsToGetUserTask_Subject = new Subject<boolean>();
    getUserTasks_Subject = new BehaviorSubject<UserTask[]>([]);
    getUserTasks$ = this.getUserTasks_Subject.asObservable();
    userPendingTasks = new BehaviorSubject<TaskItem[]>([]);
    usersInGroup_Subject = new BehaviorSubject<string[]>([]);

    groupName?:string | null;
    username!:string | null;
    isGroupOwner:boolean = false;



    getUserInfo(){
        return this.http.get<{groupName:string | null, username:string, isGroupOwner:boolean}>(`${environment.usersUrl}/api/users/GetUserInfo`);
    }

    get getGroupName(){
        return this.groupName;
    }

    get getUsername(){
        return this.username;
    }

    loginUser(username:string,sc:string){

        const data = {
            username, securityCode:sc
        }

        return this.http.post<{ok:boolean, token:string, message:string}>(`${environment.usersUrl}/api/users/LoginUser`, data);
    }

    registerUser(username:string,sc:string){

        const data = {
            username, securityCode:sc
        }

        return this.http.post<{ok:boolean, token:string, message:string}>(`${environment.usersUrl}/api/users/RegisterUser`, data);

    }

    get getToken() {
        return this.token;
    }

    getUsers() {
        this.http.get<string[]>(`${environment.usersUrl}/api/users/GetUsers/${this.getGroupName}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: users => this.usersInGroup_Subject.next(users),
            error: err => HandleBackendError(err, this.popupService)
        });
    }

    getUserTasks(){
        this.http.get<UserTask[]>(`${environment.tasksUrl}/api/tasks/GetUserTasks/${this.groupName}`)
        .subscribe({
            next: res => {
                this.getUserTasks_Subject.next(res);
            },
            error: err => HandleBackendError(err, this.popupService)
        });
    }

    addTemporaryTask(num:number) {
        this.tempTasks.push(num);
    }

    addUserTask(isShared:boolean, title:string){
        const body = {
            isShared,
            title,
            groupName:this.groupName
        }

        return this.http.post<UserTask>(`${environment.tasksUrl}/api/tasks/AddUserTask`, body);
    }

    deleteUserTask(taskId:string){
        return this.http.delete(`${environment.tasksUrl}/api/tasks/DeleteUserTask/${taskId}`);
    }

    addTaskItem(taskId:string, content:string, assignToUsername:string, isShared:boolean){

        const body = {
            taskId, content, 
            isShared,
            assignToUsername: assignToUsername,
            groupName: this.groupName
        }

        return this.http.post<TaskItem>(`${environment.taskItemsUrl}/api/taskItems/CreateTaskItem`, body);
    }

    getUserAssignedTasks(){

        this.http.get<TaskItem[]>
        (`${environment.taskItemsUrl}/api/taskItems/GetUserPendingItemTasks/${this.getGroupName}`)
        .subscribe({
           next: taskItems => this.userPendingTasks.next(taskItems),
           error: err => HandleBackendError(err, this.popupService)
        });
    }

    getUserAssignedTasks$(){
        return this.userPendingTasks.asObservable();
    }

    markTaskItemAsCompleted(taskItemId:string){
        return this.http.put<any>(`${environment.taskItemsUrl}/api/taskItems/SetTaskItemAsCompleted/${taskItemId}`, null);
    }

    deleteTaskItem(taskItemId:string){
        return this.http.delete<any>(`${environment.taskItemsUrl}/api/taskItems/DeleteSingleTaskItem/${taskItemId}`);
    }

    onCreateGroup(groupName:string){
        return this.http.post<any>(`${environment.usersUrl}/api/users/CreateGroup/${groupName}`, null);
    }

    onJoinGroup(groupName:string){
        return this.http.post<any>(`${environment.usersUrl}/api/users/JoinGroup/${groupName}`, null);
    }

    onLeaveGroup(){
        return this.http.put<any>(`${environment.usersUrl}/api/users/LeaveGroup`, null);
    }

    onDeleteGroup(groupName:string){
        return this.http.delete<any>(`${environment.usersUrl}/api/users/DeleteGroup/${groupName}`);
    }

    showAssignedTasks(){
        this.show_assigned_tasks_Signal.set(true);
    }

    hideAssignedTasks(){
        this.show_assigned_tasks_Signal.set(false);
    }

    reconnectMethodsBindings_Subject = new Subject<boolean>();

    reconnectBindings(){
        return this.reconnectMethodsBindings_Subject.asObservable();
    }

    getTaskOwnerName(taskItemId:string){
        return this.http.get<{taskOwnerName:string}>(`${environment.tasksUrl}/api/tasks/GetTaskOwnerName/${taskItemId}`);
    }
    
    constructor(private http:HttpClient, @Inject(DOCUMENT) private document:Document, private popupService:PopupService){

        const storage = this.document.defaultView?.localStorage;
        if(storage) {
            this.token = localStorage.getItem('tmt') === "null" ? null : localStorage.getItem('tmt');
        }

    }
}