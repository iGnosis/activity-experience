import { createAction, props } from "@ngrx/store";
import { GuideActionShowMessageDTO } from "src/app/types/pointmotion";

export const guide = {
    sendMessages: createAction('[Guide] Send Messages', props<GuideActionShowMessageDTO>()),
    hide: createAction('[Guide] hide')
}
