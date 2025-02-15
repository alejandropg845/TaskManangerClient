import { Component, OnDestroy, OnInit } from '@angular/core';
import { PagesService } from '../services/pages.service';
import { Subject, takeUntil } from 'rxjs';
import { TaskItem, UserTask } from '../interfaces/user-tasks.interface';
import { PopupService } from '../services/popup.service';
import { HandleBackendError } from '../interfaces/error-handler';
import { UsersHubService } from '../services/usersHub.service';

@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styles: ``
})
export class MyTasksComponent implements OnInit, OnDestroy{

  destroy$ = new Subject<void>();
  userTasks:UserTask[] = [];
  tempTasks = this.pagesService.tempTasks;
  isAssignedTasksOpen:boolean = false;
  isPeopleConnectedOpen:boolean = false;
  usersInGroup:string[] = []

  onReceiveTestMessageToGroup(message:string){
    console.log(message);
  }

  getUserTasks(){

    const anySignalToExecute = this.pagesService.needsToGetUserTask_Subject.asObservable();

    anySignalToExecute.subscribe( _ => {
      if (this.pagesService.getToken) {
        /* Obtener la info del user*/ 
        this.pagesService.getUserInfo()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: res => {
              this.pagesService.userInfo = res;
              // Set data to behaviorSubject
              this.pagesService.getUserTasks();
  
              // Si el usuario tiene grupo, entonces agregamos automáticamente su connectionId al grupo
              if(res.groupName) {
                this.usersHub.onConnectedUser()
                .then( _ => {
                  this.usersHub.onInvokeJoinedGroup(res.groupName!);
                  this.usersHub.onReceiveUserLeftGroup(this.onReceiveUserLeftGroup.bind(this));
                  this.usersHub.onReceiveUserJoinedGroup(this.onReceiveUserJoinedGroup.bind(this));
                  this.usersHub.onReceiveGroupTask(this.onReceiveGroupTask.bind(this));
                  this.usersHub.onReceiveDeletedGroupTask(this.onReceiveDeletedGroupTask.bind(this));
                  this.usersHub.onReceiveRemovedGroup(this.onReceiveRemovedGroup.bind(this));
                  this.usersHub.onReceiveGroupTaskItem(this.onReceiveGroupTaskItem.bind(this));
                  this.usersHub.onReceiveRemovedTaskItem(this.onReceiveRemovedTaskItem.bind(this));
                  this.usersHub.onReceiveCompletedTaskItem(this.onReceiveCompletedTaskItem.bind(this));
  
                  this.getUsers();
  
                })
                .catch(() => this.popup.showPopup('e', "Error while joining to group server"))
                
              }
  
              // Subscribe to subject as observable
              this.pagesService.getUserTasks$
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: uts => {
                  this.userTasks = uts;
                },
                error: err => HandleBackendError(err, this.popup)
              });
            
              
            },
            error: err => HandleBackendError(err, this.popup)
        });
      }
    });
      
  }

  reconnectMethodsBindings(){

    this.pagesService.reconnectBindings().subscribe( _ => {
      
        if(this.pagesService.getGroupName) {
          this.usersHub.onConnectedUser()
          .then( _ => {
            this.usersHub.onInvokeJoinedGroup(this.pagesService.getGroupName!);
            this.usersHub.onReceiveUserLeftGroup(this.onReceiveUserLeftGroup.bind(this));
            this.usersHub.onReceiveUserJoinedGroup(this.onReceiveUserJoinedGroup.bind(this));
            this.usersHub.onReceiveGroupTask(this.onReceiveGroupTask.bind(this));
            this.usersHub.onReceiveDeletedGroupTask(this.onReceiveDeletedGroupTask.bind(this));
            this.usersHub.onReceiveRemovedGroup(this.onReceiveRemovedGroup.bind(this));
            this.usersHub.onReceiveGroupTaskItem(this.onReceiveGroupTaskItem.bind(this));
            this.usersHub.onReceiveRemovedTaskItem(this.onReceiveRemovedTaskItem.bind(this));
            this.usersHub.onReceiveCompletedTaskItem(this.onReceiveCompletedTaskItem.bind(this));
            this.getUsers();
    
          })
          .catch(() => this.popup.showPopup('e', "Error while joining to group server"))
        }
        
      
    });

    

  }

  addUserTask(isShared:boolean, title:string, i:number){

    if(!title) {
      this.popup.showPopup('e', "You forgot to add a title to your task");
      return;
    }

    if(!this.pagesService) {
      this.popup.showPopup('e', 'Group was not found. Created as individual task');
    }

    this.pagesService.addUserTask(isShared, title)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: createdTask => {
        this.pagesService.tempTasks.splice(i, 1);

        //Si es sharedtask entonces enviamos al grupo
        if(createdTask.isSharedTask && this.pagesService.getGroupName) {
          this.usersHub.onInvokeSendTaskToEveryone(createdTask);
        } else {
          //Setteamos en true isRemovable porque es propia task
          createdTask.isRemovable = true;
          this.userTasks.push(createdTask);
        }
        
      },
      error: err => HandleBackendError(err, this.popup)
    });
  }

  deleteUserTask(taskId:string){

    this.usersHub.onReceiveDeletedGroupTask(this.onReceiveDeletedGroupTask.bind(this));

    this.pagesService.deleteUserTask(taskId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: _ => {

        /* Eliminar temporary task por index */
        const i = this.userTasks.findIndex(ut => ut.id === taskId);
        this.userTasks.splice(i, 1);


        if(this.pagesService.userInfo.groupName){
          this.usersHub.onInvokeDeletedGroupTask(taskId, this.pagesService.userInfo.groupName);
        }
        

      },
      error: err => HandleBackendError(err, this.popup)
    });
  }

  tempUl!:HTMLUListElement | null;

  addTaskItem(taskId:string, content:HTMLInputElement, assignedTo:string, isShared:boolean, ul:HTMLUListElement){
    
    if(!content.value || !taskId) {
      return;
    }

    if(!assignedTo && isShared) {
      alert("You must provide an user to assign this task")
      return;
    }

    this.pagesService.addTaskItem(taskId, content.value, assignedTo, isShared)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: addedTaskItem => {
        if(!this.pagesService.getGroupName || !addedTaskItem.isShared)
          this.addNoGroupTaskItem(addedTaskItem, content, ul);
        else {
          this.usersHub.onInvokeSendGroupItemTask(addedTaskItem);
          this.tempUl = ul;
        }
          
      },
      error: err => HandleBackendError(err, this.popup)
    });

  }

  addNoGroupTaskItem(addedTaskItem:TaskItem, content:HTMLInputElement, ul:HTMLUListElement){

    addedTaskItem.isCompletable = true;
    addedTaskItem.isRemovable = true;

    const userTaskIndex = this.userTasks.findIndex(ut => ut.id === addedTaskItem.taskId);

    this.userTasks[userTaskIndex].taskItems.push(addedTaskItem);
    content.value = '';
    this.scrollToBottom(ul);
  }

  getUsers() {
    
    if(this.pagesService.getToken && this.pagesService.getGroupName){

      this.pagesService.getUsers();

      this.pagesService.usersInGroup_Subject.asObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => this.usersInGroup = users);

    }
    
    
  }

  scrollToBottom(ulContainer: HTMLUListElement){
    setTimeout(() => {
      ulContainer.scrollTo({
        top: ulContainer.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }

  deleteTaskItem(taskItem:TaskItem){
    this.pagesService.deleteTaskItem(taskItem.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: _ => {

        //Hay token, es decir, hay cuenta de usuario
        if(this.pagesService.getToken){

          //Hay cuenta de usuario y se encuentra unido a un grupo
          if(this.pagesService.getGroupName) {
            this.usersHub.onInvokeSendRemovedTaskItem(taskItem);
          } else {
            //Hay cuenta de usuario pero no tiene grupo
            this.applyLocalChanges(taskItem.id, taskItem.taskId);
          }

          //No hay token (cuenta de usuario), por lo tanto se está usando localStorage
        } else this.applyLocalChanges(taskItem.id, taskItem.taskId);
        
      },
      error: err => HandleBackendError(err, this.popup)
    });
  }

  applyLocalChanges(taskItemId:string, taskId:string) {
    const task = this.userTasks.find(ut => ut.id === taskId);

    if(task) {
      const taskItemIndex = task.taskItems.findIndex(ti => ti.id === taskItemId);
      if(taskItemIndex !== -1) task.taskItems.splice(taskItemIndex, 1);
    }

  }

  showActionButtons(icon:HTMLElement){
    icon.style.opacity = "1";
  }

  hideActionButtons(icon:HTMLDivElement){
    icon.style.opacity = "0";
  }

  openTaskItemContent(element:HTMLParagraphElement){

    if(element.classList.contains("truncated-text")){
      element.classList.remove("truncated-text");
      return;
    }

    element.classList.add("truncated-text");

  }

  onMarkAsCompletedTaskItem(taskItem:TaskItem, taskOwnerName:string){
    this.pagesService.markTaskItemAsCompleted(taskItem.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: res => {
        
        this.popup.showPopup('s', res.message);

        //El usuario tiene una cuenta
        if(this.pagesService.getToken) {

          //El usuario tiene un grupo y la tarea que completó es shared
          if(this.pagesService.getGroupName && taskItem.isShared){
            this.usersHub.onInvokeSendCompletedTaskItem(taskItem, taskOwnerName, this.pagesService.getUsername);
          } else {
            //El usuario no tiene grupo
            taskItem.isCompleted = true;
          }

        } else {
          //El usuario está usando el localStorage
          taskItem.isCompleted = true;
        }

      },
      error: err => HandleBackendError(err, this.popup)
    });
  }

  constructor(
    public pagesService:PagesService, private popup:PopupService, private usersHub:UsersHubService){}

  ngOnInit(): void {
    this.getUserTasks();
    this.pagesService.needsToGetUserTask_Subject.next(true);
    this.reconnectMethodsBindings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //?HUB STUFF

  onReceiveGroupTask(userTask:UserTask){
  
    if(userTask.username === this.pagesService.getUsername)
      userTask.isRemovable = true;
    
    this.userTasks.push(userTask);
  }

  onReceiveDeletedGroupTask(taskId:string){

    const index = this.userTasks.findIndex(ut => ut.id === taskId);

    if(index != -1) this.userTasks.splice(index, 1);

  }

  onReceiveRemovedGroup(sign:boolean){
    if(sign){
      this.pagesService.userInfo.groupName = null;
      this.usersHub.stopConnection()
      .then(() => {
        this.popup.showPopup('e', "The owner of this group has removed the group");
        this.pagesService.getUserTasks();
      })
      .catch(() => {
        this.popup.showPopup('e', "The owner of this group has removed the group");
        this.pagesService.getUserTasks();
      });
    }
  }

  onReceiveGroupTaskItem(taskItem:TaskItem){

    const task = this.userTasks.find(t => t.id === taskItem.taskId);
    
    if(task){

      //Asignar completable si al que se lo asignaron es igual al username
      if(taskItem.assignToUsername === this.pagesService.getUsername)
        taskItem.isCompletable = true;

      //Asignar isRemovable si soy el dueño del task
      if(task.username === this.pagesService.getUsername)
      taskItem.isRemovable = true;

      task.taskItems.push(taskItem);

      //Notificar al assignedToUsername que se le ha asignado un taskItem
      if(taskItem.assignToUsername === this.pagesService.getUsername)
        this.popup.showPopup('i', 'A new task was assigned to you');


    } else this.getUserTasks();
    
  }

  onReceiveRemovedTaskItem(taskItem:TaskItem){
    
    const taskIndex = this.userTasks.findIndex(ut => ut.id === taskItem.taskId);

    if(taskIndex !== -1) {
      const taskItemIndex = this.userTasks[taskIndex].taskItems.findIndex(ti => ti.id === taskItem.id);

      if(taskItemIndex !== -1)
        this.userTasks[taskIndex].taskItems.splice(taskItemIndex, 1);
    }

  }

  onReceiveCompletedTaskItem(completedTaskItem:TaskItem, taskOwnerName:string, username:string){

    //Procedimientos para activar respectivos buttons actions dependiendo del usuario
    completedTaskItem.isCompleted = true;

    const task = this.userTasks.find(ut => ut.id === completedTaskItem.taskId);

    if(task) {
      const taskItemIndex = task.taskItems.findIndex(ti => ti.id === completedTaskItem.id);
      task.taskItems[taskItemIndex].isCompleted = true;

      if(task.username === this.pagesService.getUsername)
        task.taskItems[taskItemIndex].isRemovable = true;

    }

    //Procedimientos para enviar notificación de completedTask al taskOwnerName
    if(taskOwnerName === this.pagesService.getUsername)
      this.popup.showPopup('i', "The user "+username+ " has completed a task");

  }

  onReceiveCompletedAssignedTask(taskItemId:string){
    const task = this.userTasks.find(ut => ut.id === taskItemId);

    if(task) {
      const taskItemIndex = task.taskItems.findIndex(ti => ti.id === taskItemId);
      task.taskItems[taskItemIndex].isCompleted = true;

      if(task.username === this.pagesService.getUsername)
        task.taskItems[taskItemIndex].isRemovable = true;

    }
  }

  onReceiveUserLeftGroup(username:string){
    const index = this.usersInGroup.findIndex(u => u === username);

    if(index !== -1) this.usersInGroup.splice(index, 1);

    this.popup.showPopup('i', "User "+username+" has left the group");
  }

  onReceiveUserJoinedGroup(username:string){

    const usernameExists = this.usersInGroup.some(u => u === username);

    if(!usernameExists){
      
    this.usersInGroup.push(username);

    if(username === this.pagesService.getUsername)
      this.popup.showPopup('i', "Joined to group "+this.pagesService.getGroupName);
    else 
      this.popup.showPopup('i', `User ${username} has joined the group`);
  }

  }

}
