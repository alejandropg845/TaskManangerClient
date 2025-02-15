import { Component, Input, OnInit } from '@angular/core';
import { PagesService } from '../../services/pages.service';
import { Subject, takeUntil } from 'rxjs';
import { PopupService } from '../../services/popup.service';
import { HandleBackendError } from '../../interfaces/error-handler';
import { UsersHubService } from '../../services/usersHub.service';
import { TaskItem } from '../../interfaces/user-tasks.interface';

@Component({
  selector: 'app-assigned-tasks',
  templateUrl: './assigned-tasks.component.html',
  styles: ``
})
export class AssignedTasksComponent implements OnInit{

  pendingTasks:TaskItem[] = [];
  destroy$ = new Subject<void>();

  hideAssignedTasks(){
    this.pagesService.hideAssignedTasks();
  }

  markTaskItemAsCompleted(taskItem:TaskItem){
    this.pagesService.markTaskItemAsCompleted(taskItem.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: res => {
        this.popupService.showPopup('s', res.message);
        this.applyChanges(taskItem);
      },
      error: err => HandleBackendError(err, this.popupService)
    });
  }

  getUserPendingTasks(){
    this.pagesService.getUserAssignedTasks$()
    .pipe(takeUntil(this.destroy$))
    .subscribe(assignedTasks => {
      this.pendingTasks = assignedTasks;
    });
  }

  applyChanges(assignedTask:TaskItem){
    assignedTask.isCompleted = true;


    this.pagesService.getTaskOwnerName(assignedTask.taskId)
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => this.usersHub.onInvokeSendCompletedTaskItem
      (
        assignedTask, 
        res.taskOwnerName, 
        this.pagesService.getUsername
      )
    );

  }

  constructor(public pagesService:PagesService, private popupService:PopupService, private usersHub:UsersHubService){}
  
  ngOnInit(): void {
    this.getUserPendingTasks();
  }

}
