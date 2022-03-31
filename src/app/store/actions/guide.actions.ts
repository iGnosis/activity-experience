import { createAction, props } from "@ngrx/store";
import { GuideActionShowMessagesDTO } from "src/app/types/pointmotion";

export const guide = {
    sendMessages: createAction('[Guide] Send Messages', props<GuideActionShowMessagesDTO>())
}
