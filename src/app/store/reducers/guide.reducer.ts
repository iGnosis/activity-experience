import { createReducer, on } from "@ngrx/store";
import { GuideActionShowMessageDTO } from "src/app/types/pointmotion";
import { guide } from "../actions/guide.actions";

const initialState = {}


const _guideReducer = createReducer(initialState, 
    on(guide.sendMessages, (state, data): GuideActionShowMessageDTO => {
        return {
            title: data.title,
            text: data.text,
            icon: data.icon,
            timeout: data.timeout,
            id: data.title + data.text // if either the title or text changes...make the change happen
        }
    }),
    on(guide.hide, (state, data) => {
        return {
            title: undefined,
            text: undefined,
            icon: undefined,
            id: undefined
        }
    })
)


export function guideReducer(state:any, action:any) {
    return _guideReducer(state, action);
}
