import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Results } from '@mediapipe/pose';
import { provideMockStore } from '@ngrx/store/testing';
import { PoseModelAdapter } from '../../pose-model-adapter/pose-model-adapter.service';
import { SitToStandService } from './sit-to-stand.service';

describe('SitToStandService', () => {
  let service: SitToStandService;
  let poseModelAdapter: PoseModelAdapter;

  const stand: Pick<Results, 'poseLandmarks'> = {
    poseLandmarks: [
      {
        x: 0.5309268832206726,
        y: 0.16922087967395782,
        z: -0.2282911092042923,
        visibility: 0.9999962449073792,
      },
      {
        x: 0.5353615283966064,
        y: 0.15612584352493286,
        z: -0.2140180617570877,
        visibility: 0.9999855756759644,
      },
      {
        x: 0.5375186800956726,
        y: 0.15652376413345337,
        z: -0.2140618860721588,
        visibility: 0.9999846816062927,
      },
      {
        x: 0.5401343107223511,
        y: 0.15686750411987305,
        z: -0.2140618860721588,
        visibility: 0.9999842643737793,
      },
      {
        x: 0.5260557532310486,
        y: 0.1559658944606781,
        z: -0.2144414484500885,
        visibility: 0.9999843835830688,
      },
      {
        x: 0.522473156452179,
        y: 0.15641091763973236,
        z: -0.21444182097911835,
        visibility: 0.9999836683273315,
      },
      {
        x: 0.5195726752281189,
        y: 0.15697355568408966,
        z: -0.2144417017698288,
        visibility: 0.9999834299087524,
      },
      {
        x: 0.5441374778747559,
        y: 0.1657678335905075,
        z: -0.12464509159326553,
        visibility: 0.9999732971191406,
      },
      {
        x: 0.5147745609283447,
        y: 0.16750729084014893,
        z: -0.126882404088974,
        visibility: 0.9999673366546631,
      },
      {
        x: 0.5359150767326355,
        y: 0.18653704226016998,
        z: -0.19458715617656708,
        visibility: 0.9999948143959045,
      },
      {
        x: 0.524621844291687,
        y: 0.18758291006088257,
        z: -0.19533824920654297,
        visibility: 0.9999934434890747,
      },
      {
        x: 0.568425714969635,
        y: 0.2644989490509033,
        z: -0.06504364311695099,
        visibility: 0.9999814629554749,
      },
      {
        x: 0.4928365647792816,
        y: 0.2587945759296417,
        z: -0.06294584274291992,
        visibility: 0.9999734163284302,
      },
      {
        x: 0.5806306004524231,
        y: 0.36962491273880005,
        z: -0.017030799761414528,
        visibility: 0.9905900955200195,
      },
      {
        x: 0.4778107702732086,
        y: 0.3690553307533264,
        z: -0.02451303042471409,
        visibility: 0.9812389612197876,
      },
      {
        x: 0.5969548225402832,
        y: 0.46090275049209595,
        z: -0.09337128698825836,
        visibility: 0.984775185585022,
      },
      {
        x: 0.4607425332069397,
        y: 0.4603809416294098,
        z: -0.1021076887845993,
        visibility: 0.972942054271698,
      },
      {
        x: 0.6013237237930298,
        y: 0.49054837226867676,
        z: -0.11472763866186142,
        visibility: 0.9674825072288513,
      },
      {
        x: 0.4553842544555664,
        y: 0.4917130470275879,
        z: -0.1254875212907791,
        visibility: 0.9475940465927124,
      },
      {
        x: 0.5971983671188354,
        y: 0.49068471789360046,
        z: -0.1447354257106781,
        visibility: 0.9703102111816406,
      },
      {
        x: 0.45854902267456055,
        y: 0.4910869300365448,
        z: -0.15766248106956482,
        visibility: 0.952237606048584,
      },
      {
        x: 0.5944200158119202,
        y: 0.4827406108379364,
        z: -0.10691889375448227,
        visibility: 0.9636757969856262,
      },
      {
        x: 0.4617408215999603,
        y: 0.4835831820964813,
        z: -0.11726014316082001,
        visibility: 0.9471015334129333,
      },
      {
        x: 0.5567737221717834,
        y: 0.4690495431423187,
        z: -0.002262236550450325,
        visibility: 0.9997970461845398,
      },
      {
        x: 0.5105863809585571,
        y: 0.4698319733142853,
        z: 0.0022169623989611864,
        visibility: 0.9998104572296143,
      },
      {
        x: 0.558428168296814,
        y: 0.6273779273033142,
        z: -0.00769594544544816,
        visibility: 0.9931877851486206,
      },
      {
        x: 0.5083616971969604,
        y: 0.6264130473136902,
        z: 0.00017940765246748924,
        visibility: 0.9929853677749634,
      },
      {
        x: 0.562896728515625,
        y: 0.7557618021965027,
        z: 0.12939712405204773,
        visibility: 0.989575207233429,
      },
      {
        x: 0.5047414898872375,
        y: 0.7647066116333008,
        z: 0.12977483868598938,
        visibility: 0.9903064370155334,
      },
      {
        x: 0.5563898682594299,
        y: 0.7729536294937134,
        z: 0.1360371708869934,
        visibility: 0.845815122127533,
      },
      {
        x: 0.511657178401947,
        y: 0.7806233167648315,
        z: 0.13594941794872284,
        visibility: 0.8631284832954407,
      },
      {
        x: 0.5685957670211792,
        y: 0.8105059266090393,
        z: 0.031120147556066513,
        visibility: 0.9829500317573547,
      },
      {
        x: 0.49227374792099,
        y: 0.8134823441505432,
        z: 0.03156239911913872,
        visibility: 0.984714150428772,
      },
    ],
  };

  const sit: Pick<Results, 'poseLandmarks'> = {
    poseLandmarks: [
      {
        x: 0.5277866125106812,
        y: 0.3726132810115814,
        z: -0.11269302666187286,
        visibility: 0.999990701675415,
      },
      {
        x: 0.5317542552947998,
        y: 0.3615604341030121,
        z: -0.10357415676116943,
        visibility: 0.9999775886535645,
      },
      {
        x: 0.5337957739830017,
        y: 0.36195212602615356,
        z: -0.1035698652267456,
        visibility: 0.9999773502349854,
      },
      {
        x: 0.5357933640480042,
        y: 0.3624956011772156,
        z: -0.1035698652267456,
        visibility: 0.9999770522117615,
      },
      {
        x: 0.5240733027458191,
        y: 0.36158233880996704,
        z: -0.10454490035772324,
        visibility: 0.9999836683273315,
      },
      {
        x: 0.5214437246322632,
        y: 0.3619045317173004,
        z: -0.1045486181974411,
        visibility: 0.9999855160713196,
      },
      {
        x: 0.5190411806106567,
        y: 0.3622249662876129,
        z: -0.10454465448856354,
        visibility: 0.9999867081642151,
      },
      {
        x: 0.5399906635284424,
        y: 0.36988136172294617,
        z: -0.0479334257543087,
        visibility: 0.9999603033065796,
      },
      {
        x: 0.5154302716255188,
        y: 0.36935150623321533,
        z: -0.05199773982167244,
        visibility: 0.9999793171882629,
      },
      {
        x: 0.5325857400894165,
        y: 0.38663575053215027,
        z: -0.09159170091152191,
        visibility: 0.9999904036521912,
      },
      {
        x: 0.5227697491645813,
        y: 0.3856271207332611,
        z: -0.09267844259738922,
        visibility: 0.9999926686286926,
      },
      {
        x: 0.564358115196228,
        y: 0.4368875324726105,
        z: -0.020030880346894264,
        visibility: 0.999961793422699,
      },
      {
        x: 0.49118247628211975,
        y: 0.4356015920639038,
        z: -0.023453619331121445,
        visibility: 0.9999767541885376,
      },
      {
        x: 0.5851873159408569,
        y: 0.48301559686660767,
        z: 0.0018132064724341035,
        visibility: 0.9757925271987915,
      },
      {
        x: 0.4636291563510895,
        y: 0.482310026884079,
        z: -0.007077506277710199,
        visibility: 0.9934883713722229,
      },
      {
        x: 0.58443284034729,
        y: 0.5440360307693481,
        z: -0.03304922208189964,
        visibility: 0.9150968790054321,
      },
      {
        x: 0.4712144434452057,
        y: 0.5439013838768005,
        z: -0.03652600944042206,
        visibility: 0.969783365726471,
      },
      {
        x: 0.5885970592498779,
        y: 0.5636657476425171,
        z: -0.04317465052008629,
        visibility: 0.8603169322013855,
      },
      {
        x: 0.469007670879364,
        y: 0.5646770596504211,
        z: -0.04693494737148285,
        visibility: 0.9318957924842834,
      },
      {
        x: 0.5826669931411743,
        y: 0.5615859627723694,
        z: -0.053139228373765945,
        visibility: 0.8643783330917358,
      },
      {
        x: 0.4756971299648285,
        y: 0.5617896914482117,
        z: -0.055155448615550995,
        visibility: 0.9326634407043457,
      },
      {
        x: 0.5799840688705444,
        y: 0.5560245513916016,
        z: -0.03739232197403908,
        visibility: 0.8537545800209045,
      },
      {
        x: 0.4786072373390198,
        y: 0.5562712550163269,
        z: -0.04004894942045212,
        visibility: 0.9183104634284973,
      },
      {
        x: 0.5488137602806091,
        y: 0.5882523655891418,
        z: -0.0012831989442929626,
        visibility: 0.9993458986282349,
      },
      {
        x: 0.5050025582313538,
        y: 0.589110255241394,
        z: 0.0012774902861565351,
        visibility: 0.9994792342185974,
      },
      {
        x: 0.5793123841285706,
        y: 0.6285773515701294,
        z: -0.1703587770462036,
        visibility: 0.9883346557617188,
      },
      {
        x: 0.4787099361419678,
        y: 0.6306567788124084,
        z: -0.1665266454219818,
        visibility: 0.9940513968467712,
      },
      {
        x: 0.5612286329269409,
        y: 0.7594185471534729,
        z: -0.09977580606937408,
        visibility: 0.9844372868537903,
      },
      {
        x: 0.49120432138442993,
        y: 0.7588289976119995,
        z: -0.09776753187179565,
        visibility: 0.9894943833351135,
      },
      {
        x: 0.5530425906181335,
        y: 0.7768499851226807,
        z: -0.09505701065063477,
        visibility: 0.9141213893890381,
      },
      {
        x: 0.499230295419693,
        y: 0.7735339403152466,
        z: -0.09226464480161667,
        visibility: 0.9442446827888489,
      },
      {
        x: 0.5729736089706421,
        y: 0.8116883039474487,
        z: -0.16034409403800964,
        visibility: 0.9724438190460205,
      },
      {
        x: 0.48051443696022034,
        y: 0.8106420040130615,
        z: -0.1508427858352661,
        visibility: 0.9818371534347534,
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(SitToStandService);
    poseModelAdapter = TestBed.inject(PoseModelAdapter);
    poseModelAdapter.setModel('mediapipe');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should enable sit to stand', () => {
    service.enable();
    expect(service.enabled).toBeTrue();
  });

  it('should classify the pose', () => {
    // should return 'disabled'
    expect(service.classify(stand as Results).result).toEqual('disabled');

    service.enable();
    expect(service.classify(stand as Results).result).toEqual('stand');
    expect(service.classify(sit as Results).result).toEqual('sit');
  });

  it('should wait for class change or timeout', async () => {
    service.enable();
    service.currentClass = 'sit';
    const res = await service.waitForClassChangeOrTimeOut('sit', 3000);
    expect(res.result).toEqual('success');

    service.currentClass = 'stand';
    setTimeout(() => {
      service.currentClass = 'sit';
    }, 500);
    const res2 = await service.waitForClassChangeOrTimeOut('stand', 1000);
    expect(res2.result).toEqual('failure');
  });

  it('should disable sit to stand', () => {
    service.disable();
    expect(service.enabled).toBeFalse();
  });

  it('should check if sit to stand is enabled or not', () => {
    service.enable();
    expect(service.isEnabled()).toBeTrue();
    service.disable();
    expect(service.isEnabled()).toBeFalse();
  });

  it('should update the timer', () => {
    expect(service.updateTimer(1000)).toEqual({ minutes: '16', seconds: '40' });
  });
});
