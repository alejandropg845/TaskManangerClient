export interface UserTask {
    id              : string,
    username        : string,
    title           : string,
    createdOn       : Date,
    isSharedTask    : boolean,
    taskItems       : TaskItem[],
    groupName       : string,
    isRemovable     : boolean
}

export interface TaskItem {
    id              : string,
    taskId          : string,
    assignToUsername  : string,
    content         : string,
    isCompleted     : boolean,
    isRemovable     : boolean,
    isCompletable   : boolean,
    isShared        : boolean
}