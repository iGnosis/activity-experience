import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { Observable, Subject } from 'rxjs';

export type ActionHook = {
  beforeAction?: Array<Action>;
  afterAction?: Array<Action>;
  onSuccess?: Array<Action>;
  onFailure?: Array<Action>;
};

export type BoundingBox = {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
};

export type Action = {
  component: string;
  handler: string;
  params?: ActionParams;
  hooks?: ActionHook;
};

declare type ActionParams = {
  id?: string;
  data?: any;
};

export declare class Calibration {
  status: CalibrationStatusType;
  details: CalibrationDetails;
}

export interface CalibrationStatusType {
  SUCCESS: 'success';
  WARNING: 'warning';
  ERROR: 'error';
}

export declare enum CalibrationDetails {
  MULTIPLE_PEOPLE_DETECTED = '1',
  NO_PERSON_DETECTED = '2',
  REQUIRED_POINTS_MISSING = '3',
  CALIBRATED = '4',
}

export type CarePlan = {
  name: string;
  createdBy?: Therapist;
  assets: any;
  events: Array<SessionEvent>;
  calibration: CalibrationConfig;
  careplan_activities: Array<{
    activity: string;
    activityByActivity: {
      name: string;
    };
  }>;
  config: any;
  // trigger: Trigger
  // actions: Array<Action>
};

export type CalibrationConfig = {
  type: string;
};

// export const EventSource = {
//     Read: 'r',
//     Write: 'w',
//     Execute: 'x'
//   } as const;
//   type Permission = typeof EventSource[keyof typeof EventSource]; // 'r' | 'w' | 'x'

// export enum EventSource {
//     system = 'system',
//     user = 'user',
//     activity = 'activity',
//     spotlight = 'spotlight',
//     guide = 'guide'
// }

export type Logging = {
  level?: LogLevel;
  debug?: boolean;
  error?: boolean;
  info?: boolean;
  verbose?: boolean;
};

declare enum LogLevel {
  verbose = 'verbose',
  debug = 'debug',
  info = 'info',
  error = 'error',
}

export type SessionEvent = {
  id?: string;
  source?: string;
  description?: string;
  logging?: Logging;
  trigger: Trigger;
  actions: Array<Action>;
};

export type Therapist = {
  id: string;
  firstName: string;
  lastName: string;
};

/**
 * Each trigger must have an id or (name, source) pair
 */
export type Trigger = {
  /**
   * events can be dispatched using an event id.
   */
  id?: string;

  /**
   * name of the event
   */
  name?: string;
  source?: string;

  comment?: string;
};

export type SpotlightActionShowMessagesDTO = {
  id?: string;
  data: {
    messages: Array<SpotlightActionShowMessageDTO>;
  };
};

export type SpotlightActionShowMessageDTO = {
  text: string;
  icon: string;
  timeout: number;
};

export type GuideActionShowMessagesDTO = {
  id?: string;
  data: {
    messages: Array<GuideActionShowMessageDTO>;
  };
};

export type GuideActionShowMessageDTO = {
  title?: string;
  text?: string;
  icon?: string;
  prompt?: string;
  timeout?: number;
  entryAnimation?: string;
  exitAnimation?: string;
  id?: string; // merged text to watch
};

export type EventActionDispatchEventNameDTO = {
  name: string;
  source?: string;
  data?: any;
};

export type EventActionDispatchEventIdDTO = {
  id: string;
  data?: any;
};

export type HolisticDTO = {
  pose: Results;
};

/**
 * Source: https://github.com/google/mediapipe/issues/1408#issuecomment-810652766
 * @fileoverview Declarations for the Holistic API.
 */

/**
 * Version number of this package.
 */
export const VERSION: string;

/**
 * Represents pairs of (start,end) indexes so that we can connect landmarks
 * with lines to provide a skeleton when we draw the points.
 */
export declare type LandmarkConnectionArray = Array<[number, number]>;

/**
 * Subgroup of FACEMESH_CONNECTIONS.
 */
export declare const FACEMESH_LIPS: LandmarkConnectionArray;

/**
 * Subgroup of FACEMESH_CONNECTIONS.
 */
export declare const FACEMESH_LEFT_EYE: LandmarkConnectionArray;

/**
 * Subgroup of FACEMESH_CONNECTIONS.
 */
export declare const FACEMESH_LEFT_EYEBROW: LandmarkConnectionArray;

/**
 * Subgroup of FACEMESH_CONNECTIONS.
 */
export declare const FACEMESH_LEFT_IRIS: LandmarkConnectionArray;

/**
 * Subgroup of FACEMESH_CONNECTIONS.
 */
export declare const FACEMESH_RIGHT_EYE: LandmarkConnectionArray;

/**
 * Subgroup of FACEMESH_CONNECTIONS.
 */
export declare const FACEMESH_RIGHT_EYEBROW: LandmarkConnectionArray;

/**
 * Subgroup of FACEMESH_CONNECTIONS.
 */
export declare const FACEMESH_RIGHT_IRIS: LandmarkConnectionArray;

/**
 * Subgroup of FACEMESH_CONNECTIONS.
 */
export declare const FACEMESH_FACE_OVAL: LandmarkConnectionArray;

/**
 * onResults returns an array of landmarks. This array provides the combination
 * of contours listed above.
 */
export declare const FACEMESH_CONTOURS: LandmarkConnectionArray;

/**
 * onResults returns an array of landmarks. This array provides the edges of
 * the full set of landmarks.
 */
export declare const FACEMESH_TESSELATION: LandmarkConnectionArray;

/**
 * PoseEvent.onPose returns an array of landmarks. This array provides the
 * edges to connect those landmarks to one another.
 */
export declare const POSE_CONNECTIONS: LandmarkConnectionArray;

/**
 * HandEvent.onHand returns an array of landmarks. This array provides the
 * edges to connect those landmarks to one another.
 */
export declare const HAND_CONNECTIONS: LandmarkConnectionArray;

/**
 * Provide a way to access landmarks by their friendly names. Using an
 * interface allows us to prevent obfuscation for external javascript linkage,
 * while still allowing optimization for internal linkages.
 */
export declare const POSE_LANDMARKS: {
  NOSE: number;
  RIGHT_EYE_INNER: number;
  RIGHT_EYE: number;
  RIGHT_EYE_OUTER: number;
  LEFT_EYE_INNER: number;
  LEFT_EYE: number;
  LEFT_EYE_OUTER: number;
  RIGHT_EAR: number;
  LEFT_EAR: number;
  MOUTH_RIGHT: number;
  MOUTH_LEFT: number;
  RIGHT_SHOULDER: number;
  LEFT_SHOULDER: number;
  RIGHT_ELBOW: number;
  LEFT_ELBOW: number;
  RIGHT_WRIST: number;
  LEFT_WRIST: number;
  RIGHT_PINKY: number;
  LEFT_PINKY: number;
  RIGHT_INDEX: number;
  LEFT_INDEX: number;
  RIGHT_THUMB: number;
  LEFT_THUMB: number;
  RIGHT_HIP: number;
  LEFT_HIP: number;
};

/**
 * Just the left-side landmarks for pose.
 */
export declare const POSE_LANDMARKS_LEFT: {
  LEFT_EYE_INNER: number;
  LEFT_EYE: number;
  LEFT_EYE_OUTER: number;
  LEFT_EAR: number;
  LEFT_RIGHT: number;
  LEFT_SHOULDER: number;
  LEFT_ELBOW: number;
  LEFT_WRIST: number;
  LEFT_PINKY: number;
  LEFT_INDEX: number;
  LEFT_THUMB: number;
  LEFT_HIP: number;
  LEFT_KNEE: number;
  LEFT_ANKLE: number;
  LEFT_HEEL: number;
  LEFT_FOOT_INDEX: number;
};

/**
 * Just the right-side landmarks for pose.
 */
export declare const POSE_LANDMARKS_RIGHT: {
  RIGHT_EYE_INNER: number;
  RIGHT_EYE: number;
  RIGHT_EYE_OUTER: number;
  RIGHT_EAR: number;
  RIGHT_LEFT: number;
  RIGHT_SHOULDER: number;
  RIGHT_ELBOW: number;
  RIGHT_WRIST: number;
  RIGHT_PINKY: number;
  RIGHT_INDEX: number;
  RIGHT_THUMB: number;
  RIGHT_HIP: number;
  RIGHT_KNEE: number;
  RIGHT_ANKLE: number;
  RIGHT_HEEL: number;
  RIGHT_FOOT_INDEX: number;
};

/**
 * Just the neutral landmarks for pose.
 */
export declare const POSE_LANDMARKS_NEUTRAL: {
  NOSE: number;
};

/**
 * Represents a single normalized landmark.
 */
export declare interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * One list of landmarks.
 */
export type NormalizedLandmarkList = NormalizedLandmark[];

/**
 * Multiple lists of landmarks.
 */
export type NormalizedLandmarkListList = NormalizedLandmarkList[];

/**
 * Represents a single landmark (not normalized).
 */
export type Landmark = NormalizedLandmark;

/**
 * Detected points are returned as a collection of landmarks.
 */
export type LandmarkList = Landmark[];

/**
 * We support several ways to get image inputs.
 */
export type InputImage = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

/**
 * Legal inputs.
 */
export interface InputMap {
  image: InputImage;
}

/**
 * GpuBuffers should all be compatible with Canvas' `drawImage`
 */
type GpuBuffer = HTMLCanvasElement | HTMLImageElement | ImageBitmap;

/**
 * The descriptiong of the hand represented by the corresponding landmarks.
 */
export interface Holisticedness {
  /**
   * Index of the object as it appears in multiHolisticLandmarks.
   */
  index: number;
  /**
   * Confidence score between 0..1.
   */
  score: number;
  /**
   * Identifies which hand is detected at this index.
   */
  label: 'Right' | 'Left';
}

/**
 * Shows the vertex type of a mesh in order to decode the vertex buffer list.
 */
export interface VertexType {
  VERTEX_PT: 0; // Position (XYZ) + Texture (UV)
}

/**
 * Shows the type of primitive shape in a mesh in order to give shape.
 */
export interface PrimitiveType {
  TRIANGLE: 0;
}

/**
 * Represents the Layout of a Matrix for the MatrixData proto
 */
export interface Layout {
  COLUMN_MAJOR: 0;
  ROW_MAJOR: 1;
}

/**
 * Represents the parameters a camera has.
 */
export interface CameraParams {
  verticalFovDegrees: number;
  near: number;
  far: number;
}

/**
 * Collects the enums into a single namespace
 */
export declare const FACE_GEOMETRY: {
  VertexType: VertexType;
  PrimitiveType: PrimitiveType;
  Layout: Layout;
  DEFAULT_CAMERA_PARAMS: CameraParams;
};

/**
 * A representation of a mesh given by the Mesh3d proto
 * google3/third_party/mediapipe/modules/face_geometry/protos/mesh_3d.proto
 */
export interface Mesh {
  getVertexBufferList(): Float32Array;
  getVertexType(): VertexType;
  getIndexBufferList(): Uint32Array;
  getPrimitiveType(): PrimitiveType;
}

/**
 * A representation of a matrix given by the MatrixData proto.
 * google3/research/drishti/framework/formats/matrix_data.proto
 */
export interface MatrixData {
  getPackedDataList(): number[];
  getRows(): number;
  getCols(): number;
  getLayout(): Layout;
}

/**
 * A representation of a face geometry from the face geometry proto.
 * google3/third_party/mediapipe/modules/face_geometry/protos/face_geometry.proto
 */
export interface FaceGeometry {
  getMesh(): Mesh;
  getPoseTransformMatrix(): MatrixData;
}

/**
 * Possible results from Holistic.
 */
export interface Results {
  poseLandmarks: NormalizedLandmarkList;
  faceLandmarks: NormalizedLandmarkList;
  multiFaceGeometry: FaceGeometry[];
  rightHandLandmarks: NormalizedLandmarkList;
  leftHandLandmarks: NormalizedLandmarkList;
  segmentationMask: GpuBuffer;
  image: GpuBuffer;
}

/**
 * Configurable options for Holistic.
 */
export interface Options {
  enableFaceGeometry?: boolean;
  selfieMode?: boolean;
  modelComplexity?: 0 | 1 | 2;
  smoothLandmarks?: boolean;
  enableSegmentation?: boolean;
  smoothSegmentation?: boolean;
  refineFaceLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

/**
 * Listener for any results from Holistic.
 */
export type ResultsListener = (results: Results) => Promise<void> | void;

/**
 * Contains all of the setup options to drive the hand solution.
 */
export interface HolisticConfig {
  locateFile?: (path: string, prefix?: string) => string;
}

/**
 * Declares the interface of Holistic.
 */
declare interface HolisticInterface {
  close(): Promise<void>;
  onResults(listener: ResultsListener): void;
  initialize(): Promise<void>;
  reset(): void;
  send(inputs: InputMap): Promise<void>;
  setOptions(options: Options): void;
}

/**
 * Encapsulates the entire Holistic solution. All that is needed from the
 * developer is the source of the image data. The user will call `send`
 * repeatedly and if a hand is detected, then the user can receive callbacks
 * with this metadata.
 */
export declare class Holistic implements HolisticInterface {
  constructor(config?: HolisticConfig);

  /**
   * Shuts down the object. Call before creating a new instance.
   */
  close(): Promise<void>;

  /**
   * Registers a single callback that will carry any results that occur
   * after calling Send().
   */
  onResults(listener: ResultsListener): void;

  /**
   * Initializes the solution. This includes loading ML models and mediapipe
   * configurations, as well as setting up potential listeners for metadata. If
   * `initialize` is not called manually, then it will be called the first time
   * the developer calls `send`.
   */
  initialize(): Promise<void>;

  /**
   * Tells the graph to restart before the next frame is sent.
   */
  reset(): void;

  /**
   * Processes a single frame of data, which depends on the options sent to the
   * constructor.
   */
  send(inputs: InputMap): Promise<void>;

  /**
   * Adjusts options in the solution. This may trigger a graph reload the next
   * time the graph tries to run.
   */
  setOptions(options: Options): void;
}

export type PreSessionMood = 'Irritated' | 'Anxious' | 'Okay' | 'Good' | 'Daring';
export type PreSessionGenre = 'Classical' | 'Jazz' | 'Rock' | 'Dance' | 'Surprise Me!';

export interface CalibrationState {
  pose?: Results;
  status: string;
  reason: string;
  poseHash?: number;
}

export type TaskName = 'calibration' | 'sit' | 'stand' | 'unknown';
export type AnalyticsEventType =
  | 'sessionStarted'
  | 'activityStarted'
  | 'taskStarted'
  | 'taskReacted'
  | 'taskEnded'
  | 'activityEnded'
  | 'sessionEnded';

export type AnalyticsRow = {
  patient: string;
  session: string;
  activity?: string;
  task_id?: string;
  attempt_id?: string;
  task_name?: TaskName;
  event_type: AnalyticsEventType;
  created_at: number;
  score?: number;
};

// A light-weight version of what different context will send
export type AnalyticsEvent = {
  activity?: string;
  task_id?: string;
  attempt_id?: string;
  task_name?: TaskName;
  event_type: AnalyticsEventType;
  score?: number;
};

export type AnalyticsSessionEventType = 'sessionStarted' | 'sessionEnded';
export type AnalyticsSessionEventRow = {
  patient: string;
  session: string;
  event_type: AnalyticsSessionEventType;
  created_at: number;
};
export type AnalyticsSessionEvent = {
  event_type: AnalyticsSessionEventType;
};

export type ActivityEventType = 'activityStarted' | 'activityEnded';

export type ActivityEventRow = {
  patient: string;
  session: string;
  activity: string;
  event_type: ActivityEventType;
  created_at: number;
};

export type ActivityEvent = {
  event_type: ActivityEventType;
  activity: string;
};

export type TaskEventType = 'taskStarted' | 'taskReacted' | 'taskEnded';

export type TaskEventRow = {
  patient: string;
  session: string;
  activity: string;
  task_id: string;
  attempt_id: string;
  task_name: TaskName;
  event_type: TaskEventType;
  created_at: number;
  score?: number;
};

export type TaskEvent = {
  activity: string;
  task_id: string;
  attempt_id: string;
  task_name: any; // TODO: Fix this later.
  event_type: TaskEventType;
  score?: number;
};

export type SessionState = {
  session?: SessionRow;
  currentActivity?: ActivityState;
  nextActivity?: ActivityState;
  isSessionEnded?: boolean;
  stage?: ActivityStage;
};

export type SessionStateField = {
  stage?: ActivityStage;
  currentActivity?: ActivityState;
};

export type ActivityStage = 'welcome' | 'explain' | 'preGame' | 'game' | 'postGame';

export type ActivityState = {
  name?: string;
  totalReps?: number;
  repsCompleted: number;
  timeElapsed?: number;
};

export type SessionRow = {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  endedAt?: Date;
  patient?: string;
  careplan?: string;
  preSessionMood?: string;
  postSessionMood?: string;
  genre?: PreSessionGenre;
  patientByPatient?: Patient;
  careplanByCareplan?: CarePlan;
  state?: {
    stage?: ActivityStage;
    currentActivity?: ActivityState;
  };
};

export type Patient = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  provider: string;
  identifier: string;
  medicalConditions: any;
  preferredGenres?: any;
  primaryTherapist: string;
  onboardedBy: string;
};

// export type SessionConfig = {
//   sessionId?: string,
//   enableAnalytics: boolean,
//   mood?: string,
//   genre?: string
// }
export interface Environment {
  stageName: string;
  production: boolean;
  // token: string;
  endpoint: string;
  analytics: {
    calibration: boolean;
  };
  // patient: string;
  // careplan: string;
  apiEndpoint: string;
  musicExperience: 'music_experience_1' | 'music_experience_2';
  speedUpSession?: boolean;
  postSessionRedirectEndpoint: string;
}

export type EntryAnimation = 'fadeIn' | 'slideIn';
export type ExitAnimation = 'fadeOut' | 'slideOut';
export type GuideAvatarDTO = {
  name: 'kevin' | 'mila';
  expression?: 'neutral' | 'happy' | 'sad';
  position?: 'center' | 'bottom';
  className?: string;
  entryAnimation?: EntryAnimation;
  exitAnimation?: ExitAnimation;
};

export type GuideMessageDTO = {
  text?: string;
  className?: string;
  position: 'center' | 'bottom';
  entryAnimation?: EntryAnimation;
  exitAnimation?: ExitAnimation;
};

export type GuideSpotlightDTO = {
  text: string;
  className?: string;
  entryAnimation?: EntryAnimation;
  exitAnimation?: ExitAnimation;
};

export type GuidePromptDTO = {
  text?: string;
  icon?: IconDefinition; // font-awesome icon only
  className?: string;
  promptType?: string;
  position:
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'center'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
  entryAnimation?: EntryAnimation;
  exitAnimation?: ExitAnimation;
};

export type GuideVideoDTO = {
  url: string;
  size: 'md' | 'lg';
};

export type GuideTimerDTO = {
  timeout: number;
  position?: 'top' | 'bottom';
  color?: string;
};

export type GuideState = {
  avatar?: GuideAvatarDTO;
  message?: GuideMessageDTO;
  spotlight?: GuideSpotlightDTO;
  prompt?: GuidePromptDTO;
  video?: GuideVideoDTO;
  timer?: GuideTimerDTO;
};

export type AnnouncementState = {
  message: string;
  timeout?: number;
  background?: string;
};

export type DebugTaskEvent = {
  event_type: TaskEventType;
  task_id: string;
  task_name: TaskName;
  reacted: boolean;
};

export type DebugStackEvents = AnalyticsSessionEvent | ActivityEvent | DebugTaskEvent;

export type ScoreElementState = {
  show?: boolean;
  label?: string;
  value?: string;
};

export type TimerElementState = {
  show?: boolean;
  label?: string;
  value?: string;
};

export type PromptElementState = {
  show?: boolean;
  value?: string;
  entryAnimation?: 'fadeIn' | 'slideIn';
  exitAnimation?: 'fadeOut' | 'slideOut';
  entryAnimationDuration?: number;
  exitAnimationDuration?: number;
};

export type TimeoutElementState = {
  show?: boolean;
  timeout?: number;
  className?: string;
};

export type VideoElementState = {
  show?: boolean;
  url?: string;
};

export type ElementsState = {
  score: ScoreElementState;
  timer: TimerElementState;
  prompt: PromptElementState;
  timeout: TimeoutElementState;
  video: VideoElementState;
};

export type ElementsObservables = {
  score: Observable<ScoreElementState>;
  timer: Observable<TimerElementState>;
  prompt: Observable<PromptElementState>;
  timeout: Observable<TimeoutElementState>;
  video: Observable<VideoElementState>;
};
