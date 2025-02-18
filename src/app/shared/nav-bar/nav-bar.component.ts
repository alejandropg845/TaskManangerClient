import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PagesService } from '../../services/pages.service';
import { Subject, takeUntil, tap } from 'rxjs';
import { PopupService } from '../../services/popup.service';
import { HandleBackendError } from '../../interfaces/error-handler';
import { UsersHubService } from '../../services/usersHub.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styles: ``
})
export class NavBarComponent{


  isNewTaskPressed:boolean = false;
  destroy$ = new Subject<void>();
  num:number = 0
  isLogin:boolean = false;
  isJoinGroup:boolean = false;
  
  @ViewChild('joingroup') joinGroup!:ElementRef | null;
  @ViewChild('creategroup') createGroup!:ElementRef | null;
  isPasswordType: boolean = true;

  addTempTask(){
    this.pagesService.addTemporaryTask(this.num);
    this.num++;
  }

  changeType(){
    this.isLogin = !this.isLogin;
  }

  authenticate(username:string, sc:string){

    if(!username || !sc){
      return;
    }

    let action$;

    if(this.isLogin){
      action$ = this.pagesService.loginUser(username, sc);
    } else {
      action$ = this.pagesService.registerUser(username, sc);
    }

    action$.pipe
    (
      takeUntil(this.destroy$),
      tap(res => {
        if(res.ok){
          localStorage.setItem('tmt', res.token);
          this.pagesService.token = res.token;
          this.pagesService.needsToGetUserTask_Subject.next(true);
        }
      })
    )
    .subscribe({
      next: res => {
        this.popupService.showPopup('s', res.message);
      },
      error: err => HandleBackendError(err, this.popupService)
    });

  }

  logOut(){
    this.pagesService.token = null;
    localStorage.removeItem('tmt');
    this.pagesService.groupName = null;
    this.pagesService.username = null;
    this.pagesService.isGroupOwner = false;
    this.pagesService.usersInGroup_Subject.next([]);
    this.usersHub.stopConnection();

    const userTasksLS = localStorage.getItem('userTasks');

    this.pagesService.getUserTasks_Subject.next(userTasksLS ? JSON.parse(userTasksLS) : []);

  }

  onGroupSubmit(){

    
    const joinGroupInput = this.joinGroup?.nativeElement as HTMLInputElement;
    const createGroupInput = this.createGroup?.nativeElement as HTMLInputElement;

    if(this.isJoinGroup && !joinGroupInput.value) {
      this.popupService.showPopup('e', "Group code is missing");
      return;
    }

    if(!this.isJoinGroup && !createGroupInput.value) {
      this.popupService.showPopup('e', "Group code is missing");
      return;
    }

    this.usersHub.onConnectedUser()
    .then(() => {
      let action$;
  
      if(this.isJoinGroup)
        action$ = this.pagesService.onJoinGroup(joinGroupInput.value);
      else
        action$ = this.pagesService.onCreateGroup(createGroupInput.value);
      
      action$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.popupService.showPopup('s', res.message);
          this.usersHub.onInvokeJoinedGroup(res.groupName);
          this.pagesService.groupName = res.groupName;
          this.pagesService.getUserTasks();
          this.pagesService.reconnectMethodsBindings_Subject.next(true);
        },
        error: err => HandleBackendError(err, this.popupService)
      });
    });
    

  }

  getUserInfoForAuthentication(){
    this.pagesService.getUserInfo()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: res => {
        this.pagesService.groupName = res.groupName;
        this.pagesService.username = res.username;
        this.pagesService.getUserTasks();
      },
      error: err => HandleBackendError(err, this.popupService)
    });
  }

  onLeaveGroup(){
    this.pagesService.onLeaveGroup()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: res => {
        
        this.popupService.showPopup('s', res.message);

        //Salir del group en el hub
        this.usersHub.onLeaveGroup(this.pagesService.getGroupName!)
        .then(() => {
          this.pagesService.groupName = null;
          //Eliminar conexion ya que no se usa porque no hay group
          this.usersHub.stopConnection()
          .then(() => this.pagesService.getUserTasks())
          .catch(() => this.popupService.showPopup('e', "Error while stopping connection"));

        })
        .catch(() => this.popupService.showPopup('e', "Error while leaving group in hub"));
        
      },
      error: err => HandleBackendError(err, this.popupService)
    });
  }

  onDeleteGroup(){
    if(this.pagesService.getGroupName){
      this.pagesService.onDeleteGroup(this.pagesService.getGroupName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => { 
          this.popupService.showPopup('s', res.message);
          this.pagesService.isGroupOwner = false;
          this.usersHub.onInvokeDeleteGroup(res.deletedGroup, res.deletedGroupOwnerName);
        },
        error: err => HandleBackendError(err, this.popupService)
      });
    }
  }

  getUserAssignedTasks(){
    this.pagesService.getUserAssignedTasks();
    this.pagesService.showAssignedTasks();
  }

  /* HUB METHODS */
 
  onRemoveGroup(){
    if(this.pagesService.getGroupName){
      this.usersHub.onInvokeRemoveGroup(this.pagesService.getGroupName);
    }
  }

  onReceiveRemovedGroup(sign:boolean){

    if(sign) {

      this.pagesService.groupName = null;

      this.pagesService.getUserTasks();

      this.popupService.showPopup('e', "The owner of the group has deleted this group")

    }

  }

  constructor(public pagesService:PagesService, private popupService:PopupService, private usersHub:UsersHubService){}

}
