import { createAction, props } from '@ngrx/store';
import {
  GuideAvatarDTO,
  GuideMessageDTO,
  GuidePromptDTO,
  GuideSpotlightDTO,
  GuideVideoDTO,
} from 'src/app/types/pointmotion';

export const guide = {
  hide: createAction('[Guide] hide'),

  updateAvatar: createAction('[Guide] Update Avatar', props<GuideAvatarDTO>()),
  sendMessage: createAction('[Guide] Send Message', props<GuideMessageDTO>()),
  sendSpotlight: createAction(
    '[Guide] Send Spotlight',
    props<GuideSpotlightDTO>(),
  ),
  sendPrompt: createAction('[Guide] Send Prompt', props<GuidePromptDTO>()),
  startVideo: createAction('[Guide] Start Video', props<GuideVideoDTO>()),

  hideAvatar: createAction('[Guide] Hide Avatar'),
  hideMessage: createAction('[Guide] Hide Message'),
  hideSpotlight: createAction('[Guide] Hide Spotlight'),
  hidePrompt: createAction('[Guide] Hide Prompt'),
  hideVideo: createAction('[Guide] Hide Video'),
};
