import {
  SafeHtml,
  SafeResourceUrl,
  SafeScript,
  SafeStyle,
  SafeUrl,
} from '@angular/platform-browser';
import { Observable } from 'rxjs';

declare global {
  interface Window {
    dataLayer: any;
    gtag: any;
  }
}

export type CalibrationStatusType = 'error' | 'success' | 'warning' | 'disabled';

export type HandTrackerStatus = 'left-hand' | 'right-hand' | 'any-hand' | 'both-hands' | undefined;

export type OpenHandStatus =
  | 'both-hands'
  | 'left-hand'
  | 'right-hand'
  | 'none'
  | 'unknown'
  | undefined;

/**
 * We support two modes: 'full' | 'fast'.
 * 'full' mode is enabled by default.
 * * When 'full' mode is active, all the key body points must be visible, and user must be within the calibration box.
 * * When 'fast' mode is active, all the key body points must be visible.
 */
export type CalibrationMode = 'full' | 'fast';

export type CalibrationBox = {
  x: number;
  y: number;
  width: number;
  height: number;
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
  useCpuInference?: boolean;
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
export type Genre = 'classical' | 'jazz' | 'rock' | 'dance' | 'surprise me!';

export interface IsModelReady {
  isModelReady: boolean;
  downloadSource: 'local' | 'cdn';
}

export interface IsHandsModelReady {
  isHandsModelReady: boolean;
  downloadSource: 'local' | 'cdn';
}

export type TaskName = 'calibration' | 'sit' | 'stand' | 'unknown';
export type ActivityStage = 'welcome' | 'tutorial' | 'preLoop' | 'loop' | 'postLoop';

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

export type Activities = 'sit_stand_achieve' | 'beat_boxer' | 'sound_explorer' | 'moving_tones';
export type GameLevels = 'level1' | 'level2' | 'level3';

export type ActivityLevel = {
  [level: string]: {
    configuration: {
      /**
       * Number of correct reps required for an activity to end.
       */
      minCorrectReps?: number;
      /**
       * Duration for which the game should run.
       */
      gameDuration?: number;
      /**
       * Defines speed in milliseconds at which the activity should be run.
       */
      speed: number;
    };
  };
};

export interface ActivityConfiguration {
  currentLevel: GameLevels;
  levels: ActivityLevel;
}

export interface Environment {
  organizationName: string;
  stageName: string;
  production: boolean;
  speedUpSession?: boolean;
  analytics: {
    calibration: boolean;
  };
  endpoint: string;
  apiEndpoint: string;
  websocketEndpoint: string;
  googleAnalyticsTrackingID: string;
  postSessionRedirectEndpoint: string;
  /**
   * Defines the order in which activites are to be run.
   */
  order: Activities[];
  /**
   * Defines configuration of activities.
   */
  settings: {
    [key in Activities]: ActivityConfiguration;
  };
}

export type EntryAnimation = 'fadeIn' | 'slideIn';
export type ExitAnimation = 'fadeOut' | 'slideOut';

export type AnalyticsDTO = {
  prompt: AnalyticsPromptDTO;
  reaction: AnalyticsReactionDTO;
  result: AnalyticsResultDTO;
};

export type AnalyticsPromptDTO = {
  id: string;
  type: string;
  timestamp: number;
  data:
    | Sit2StandAnalyticsDTO
    | BeatboxerAnalyticsDTO
    | SoundExplorerAnalyticsDTO
    | MovingTonesAnalyticsDTO
    | GameStartAnalyticsDTO;
};

export type AnalyticsReactionDTO = {
  type: string;
  timestamp: number; // placeholder value.
  startTime: number; // placeholder value.
  completionTimeInMs: number | null;
};

export type AnalyticsResultDTO = {
  type: 'success' | 'failure';
  timestamp: number;
  score: number;
};

// individual game data
export type Sit2StandAnalyticsDTO = {
  number: number | string;
};

export type BeatboxerAnalyticsDTO = {
  leftBag: BagType | 'obstacle' | undefined;
  rightBag: BagType | 'obstacle' | undefined;
};

export type SoundExplorerAnalyticsDTO = {
  shapes: Shape[];
};

export type MovingTonesAnalyticsDTO = {
  leftPath: MovingTonesCircle[];
  rightPath: MovingTonesCircle[];
};

export type MovingTonesCurve = 'line' | 'semicircle' | 'triangle' | 'zigzag';

export type Coordinate = {
  x: number;
  y: number;
};

export type MovingTonesConfiguration = {
  startLeft?: Coordinate;
  endLeft?: Coordinate;
  startRight?: Coordinate;
  endRight?: Coordinate;
  curveType: MovingTonesCurve;
  pointsInBetween: number;
};

export type GameStartAnalyticsDTO = {
  gameStartTime: number | null;
  loopStartTime: number | null;
  firstPromptTime: number | null;
};

export type PreferenceState = {
  /**
   * Genre preferred by the patient.
   */
  genre?: Genre;
  /**
   * Patient's current mood.
   */
  mood?: string;
};

export type GameState = {
  /**
   * A random UUID to identify the game (created server-side on insertion).
   */
  id?: string;
  /**
   * Indicates when the game was created.
   */
  createdAt?: string;
  /**
   * Indicates when the game was last updated.
   */
  updatedAt?: string;
  /**
   * Indicates when the game was ended.
   */
  endedAt?: string;
  /**
   * Name of the game (eg. sit_stand_achieve, beat_boxer)
   */
  game?: string;
  /**
   * Indicates the number of reps completed
   */
  repsCompleted?: number;
  /**
   * Indicates total duration of the game.
   */
  totalDuration?: number;
  /**
   * Analytics for the game.
   */
  analytics?: AnalyticsDTO[];
  /**
   * Patient ID of the patient playing the game.
   */
  patient?: string;
  /**
   * Indicates the amount of time for which the user was calibrated. (in seconds)
   */
  calibrationDuration?: number;

  /**
   * Stores game settings. such as timeout, and game current level.
   */
  settings?: any;
};

export type ScoreElementState = {
  /**
   * Inputs a string that appears as label for the score element
   */
  label?: string;
  /**
   * Inputs the file path for an icon to be displayed in the score element
   */
  icon?: string;
  /**
   * Inputs a number or string as the current score
   */
  value?: number | string;
  /**
   * Inputs a number as high score
   */
  highScore?: number;
  /**
   * Inputs a number as the amount of time between each score update
   */
  goal?: number | string;
  transitionDuration?: number;
};

export type TimerElementState = {
  /**
   * Timer can be controlled using the modes.
   * * Note: During 'start' or 'countdown' mode the 'duration' has to be specified.
   */
  mode: 'start' | 'stop' | 'pause' | 'resume';
  /**
   * Indicates whether the timer should count down or start from 0.
   */
  isCountdown?: boolean;
  /**
   * Sets the duration of the timer.
   */
  duration?: number;
  /**
   * Function triggers on completion of the timer.
   * @param elapsedTime gives the time elapsed time since the start of the timer.
   */
  onComplete?: (elapsedTime: number) => void;
  /**
   * Function triggers when timer is paused
   * @param elapsedTime gives the time elapsed time since the start of the timer.
   */
  onPause?: (elapsedTime: number) => void;
};

export type OverlayElementState = {
  /**
   * Inputs an array of messages and icons which will be displayed in the overlay
   */
  cards: { message: string; icon: string; tts?: string }[];
  /**
   * Inputs a number as the amount of time between each card appearance
   */
  transitionDuration?: number;
};

export type BannerButton = {
  /**
   * Set button text to be shown in the UI.
   */
  title?: string;

  /**
   * Set a custom styling class.
   */
  className?: string;

  /**
   * Set duration in ms for a progress bar.
   */
  progressDurationMs?: number;

  /**
   * Show infinite progress bar.
   */
  infiniteProgress?: boolean;
};

export type BannerElementState = {
  /**
   * Inputs a string that gets rendered as HTML, bypassses Angular HTML sanitization.
   */
  htmlStr?: string;

  /**
   * Inputs an array of objects to be rendered as Buttons.
   */
  buttons?: BannerButton[];

  /**
   * Sets the type of banner.
   * * intro are to be rendered before starting an activity.
   * * outro are to be rendered after completion of an activity.
   * * loader are to be rendered while loading an activity.
   * * status are to be rendered when user has to be notified about the status of an action.
   */
  type?: 'intro' | 'outro' | 'loader' | 'status' | 'action';
};

export type GuideElementState = {
  /**
   * Inputs a string to be shown to guide the player.
   */
  title?: string;

  /**
   * Inputs a number indicating the total duration for which the title has to be shown.
   */
  titleDuration?: number;

  /**
   * Bypasses titleDuration, and shows the widget indefinitely.
   */
  showIndefinitely?: boolean;
};

export type ConfettiElementState = {
  /**
   * Optional: Inputs a number indicating the total duration for which the confetti has to be shown.
   */
  duration?: number;
};

export type ToastElementState = {
  /**
   * Set toast's body value.
   */
  body?: string;

  /**
   * Set toast's header value.
   */
  header?: string;

  /**
   * Set toast's duration value in (ms).
   */
  delay?: number;
};

export type PromptPosition = 'center' | 'top-right';

export type PromptElementState = {
  /**
   * Set value to be displayed on the prompt.
   */
  value?: string | number;

  /**
   * Set element's position.
   */
  position?: PromptPosition;

  /**
   * Set repetition status
   */
  repStatus?: 'success' | 'failure';
};

export type TimeoutElementState = {
  /**
   * Timeout can be controlled using the modes.
   * * Note: During 'start' mode the 'duration' & 'bars' have to be specified.
   */
  mode?: 'start' | 'stop';
  /**
   * Duration of the timeout in ms.
   */
  timeout?: number;
  /**
   * Determines the number of progress bars and the color of each bar (max 2)
   */
  bars?: [TimeoutColor?, TimeoutColor?];
};

export type TimeoutColor = 'red' | 'blue' | 'yellow';

export type ElementAttributes = {
  visibility?: 'visible' | 'hidden';
  className?: string;
  style?: any;
  reCalibrationCount?: number;
};

export type VideoElementState = {
  /**
   *  Set the type of the video file.
   *  * Note: currently the supported videoformat for type 'video' is mp4.
   */
  type?: 'gif' | 'youtube' | 'video';
  /**
   * Set the src of the file that you want to display.
   * * Note: youtube videos src should have '/embed/' in them to work. (Should be an embed link)
   */
  src?: string;
  /**
   * Set the title of the video element.
   */
  title?: string;
  /**
   * Set the description of the video element.
   */
  description?: string;
};

export type RibbonElementState = {
  /**
   * Inputs an array of strings which will be displayed in the ribbon one after another
   */
  titles?: string[];
  /**
   * Inputs a number as the amount of time the title is displayed on the screen
   */
  titleDuration?: number;
  /**
   * Inputs a number as the amount of time between each title
   */
  transitionDuration?: number;
  /**
   * Indicates whether TTS should be enabled for each title
   */
  tts?: boolean;
};

export type ElementsState = {
  score: { data: ScoreElementState; attributes: ElementAttributes };
  timer: { data: TimerElementState; attributes: ElementAttributes };
  prompt: { data: PromptElementState; attributes: ElementAttributes };
  timeout: { data: TimeoutElementState; attributes: ElementAttributes };
  video: { data: VideoElementState; attributes: ElementAttributes };
  ribbon: { data: RibbonElementState; attributes: ElementAttributes };
  overlay: { data: OverlayElementState; attributes: ElementAttributes };
  banner: { data: BannerElementState; attributes: ElementAttributes };
  guide: { data: GuideElementState; attributes: ElementAttributes };
  confetti: { data: ConfettiElementState; attributes: ElementAttributes };
  toast: { data: ToastElementState; attributes: ElementAttributes };
};

export type ElementsObservables = {
  score: Observable<{ data: ScoreElementState; attributes: ElementAttributes }>;
  timer: Observable<{ data: TimerElementState; attributes: ElementAttributes }>;
  prompt: Observable<{ data: PromptElementState; attributes: ElementAttributes }>;
  timeout: Observable<{ data: TimeoutElementState; attributes: ElementAttributes }>;
  video: Observable<{ data: VideoElementState; attributes: ElementAttributes }>;
  ribbon: Observable<{ data: RibbonElementState; attributes: ElementAttributes }>;
  overlay: Observable<{ data: OverlayElementState; attributes: ElementAttributes }>;
  banner: Observable<{ data: BannerElementState; attributes: ElementAttributes }>;
  guide: Observable<{ data: GuideElementState; attributes: ElementAttributes }>;
  confetti: Observable<{ data: ConfettiElementState; attributes: ElementAttributes }>;
  toast: Observable<{ data: ToastElementState; attributes: ElementAttributes }>;
};

export interface ActivityBase {
  /**
   * The screen showing the name of the next activity and waiting for the user input
   * such as raising one or two hands
   */
  welcome(): Array<(reCalibrationCount: number) => Promise<any>>;

  /**
   * The flow to teach the user how to complete the activity
   * Will run the first time for each user and run later only on based on certain conditions
   * such as:
   * 1. User had achievement ratio of less than 60% in the last attempt
   * 2. User has not done this activity in last one week
   * 3. User explicitly asks to complete the activity
   */
  tutorial(): ((reCalibrationCount: number) => Promise<void>)[];

  /**
   * The game loop. Game Service will call this function as many times as it needs.
   * The function is only supposed to take care of 1 iteration
   */
  loop(): ((reCalibrationCount: number) => Promise<void>)[];

  /**
   * Before the loop, if there is anything to let the user get ready
   */
  preLoop(): ((reCalibrationCount: number) => Promise<void>)[];

  /**
   * After the loop, if there is a score or something before sending the user on to the next
   * activity
   */
  postLoop(): ((reCalibrationCount: number) => Promise<void>)[];
}

export type BagPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type BagType = 'heavy-blue' | 'heavy-red' | 'speed-blue' | 'speed-red';
export type CenterOfMotion = 'left' | 'right';
export type ObstacleType = 'obstacle-top' | 'obstacle-bottom';

export type GameStatus = {
  stage: ActivityStage;
  breakpoint: number;
  game: Activities;
};

export type GameObjectWithBodyAndTexture = Phaser.GameObjects.GameObject & {
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
  texture?: {
    key: string;
  };
};

export interface AudioSprite {
  [audio: string]: [number, number] | [number, number, boolean];
}

export type Shape = 'circle' | 'triangle' | 'rectangle' | 'wrong' | 'hexagon';
export type Origin =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'left-center'
  | 'right-center'
  | 'top-left'
  | 'top-right';

export type SafePipeResult = SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl;
export type SafePipeTransformType = 'html' | 'style' | 'script' | 'url' | 'resourceUrl';

export enum GenreEnum {
  CLASSICAL = 'classical',
  JAZZ = 'jazz',
  ROCK = 'rock',
  DANCE = 'dance',
  SURPRISE = 'surprise me!',
}

export interface Theme {
  colors: {
    [key: string]: any;
  };
  font: {
    family: string;
    url: string;
  };
}

export enum AvailableModelsEnum {
  MEDIAPIPE = 'mediapipe',
  POSENET = 'posenet',
}

export interface MovingTonesTweenData {
  stoppedAt?: number;
  remainingDuration?: number;
  totalTimeElapsed: number;
  tween?: Phaser.Tweens.Tween;
}

export type MovingTonesCircle = {
  id: string;
  x: number;
  y: number;
  type: 'start' | 'end' | 'coin';
  hand: 'left' | 'right';
};

export type MovingTonesCircleEventName =
  | 'hidden'
  | 'visible'
  | 'collisionStarted'
  | 'collisionEnded'
  | 'collisionCompleted'
  | 'invalidCollision';

export type MovingTonesCircleEvent = {
  name: MovingTonesCircleEventName;
  circle: MovingTonesCircle;
};

export type MovingTonesCircleSettings = {
  collisionDebounce?: number;
};

export interface MovingTonesCircleData extends MovingTonesCircleSettings {
  circle: MovingTonesCircle;
  end?: MovingTonesCircle;
  path?: MovingTonesCircle[];
  variation?: string;
}

export interface QaBody {
  event: 'ready' | 'request-game-info' | 'send-game-info' | 'edit-game';
  payload: any;
}
