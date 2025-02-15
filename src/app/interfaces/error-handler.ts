import { HttpErrorResponse } from "@angular/common/http";
import { PopupService } from "../services/popup.service";

export function HandleBackendError(res:HttpErrorResponse, popup:PopupService){

    if(res.status === 0){
        popup.showPopup('e', "No internet for doing this action");
    } else if (res.error?.message) {
        popup.showPopup('e', res.error.message);
    } else if(res.error?.errors){
        const errors = res.error.errors;
        for(const fieldNameKey in errors){
            errors[fieldNameKey].forEach((messageError:string) => {
                popup.showPopup('e', messageError);
            });
        }
    } else {
        popup.showPopup('e', "Unknown error");
    }
}