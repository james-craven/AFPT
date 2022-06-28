var redgreencolor;

var infoIcon = "See Charts";
var appInfoIcon;

var pushImg;

var shuttleAudioBtn;
var shuttleAudio;
var isAudioActive = false;

var strengthAbsLink = "./Score Chart jpgs/female_lessthan25_Strength_Abs.jpg";
var cardioLink = "./Score Chart jpgs/female_lessthan25_cardio.jpg"
var shuttleLink = "./Score Chart jpgs/shuttleScores.jpg"
var walkLink = "./Score Chart jpgs/walkChart.jpg"
var walkAltitudeAdjustPath = "./Score Chart jpgs/walkAltitudeAdjust.jpg";
var runAltitudeAdjustPath = "./Score Chart jpgs/runAltitudeAdjust.jpg";

var canvasContainer;
var isModalActive = false;
var isModal2Active = false;
var isModal3Active = false;

var modal;
var modal2;
var closeBtnModal;
var closeBtnModal2;

var passFailWalk


var runtime;                     // Run Slider
var runnum;                      // Run time in seconds
var runmintxt;                   // Textbox for run
var runsectxt;                  // Textbox for run (sec);

var walktime;
var walkmintxt;
var walksectxt;

var ageSel;
var pushSel;
var sitSel;
var runSel;
var sexSel;

var shuttleLevel = 0;
var shuttleNumber = 0;

var pushups;                     // Pushup Slider
var pushnum;                     // Number of pushupos
var pushtxt;                     // Textbox for pushup

var hrpush;                      // Hand-Release Slider
var hrpushnum;                   //
var hrpushtxt;                   //

var plankValue = 0;

var situps;                      // Situp Slider
var sitnum;                      // Number of situps
var sittxt;                      // Textbox for situps

var rsitups;                     // Reverse Crunch Slider
var rsitnum;                     // Number of reverse crunches
var rsittxt;                     // Textbox for reverse crunches

var planks;                      //plank slider
var planksectxt;                 //plank seconds
var plankmintxt;                 //plank mins
var planktime;                   //total plank time in seconds


var calculateBtn;                // Button to submit text box calculation

//Min Max Values Per Component. Changes based on age/sex selection.
var pushmin;
var pushmax;
var hrmax;
var hrmin;
var sitmin;
var sitmax;
var rsitmin;
var rsitmax;
var runmax;
var runmin;
var walkmin;
var walkmax;
var plankmin;
var plankmax;
var shuttleMin;
var shuttleMax;


var shuttlevalue;

//Score for component based on calculations.
var rscore = 0;
var sscore = 0;
var pscore = 0;
var walkScore = true;

function createSliders() {
  pushSel = createSelect();
  pushSel.parent('sketch-holder');
  pushSel.position(10, 245);
  pushSel.option('Pushups');
  pushSel.option('Hand-Release');
  pushSel.option('Exempt');
  pushSel.selected('Pushups');
  pushSel.changed(selectChange);

  sitSel = createSelect();
  sitSel.parent('sketch-holder');
  sitSel.position(10, 295 + 50);
  sitSel.option('Situps');
  sitSel.option('Plank');
  sitSel.option('Reverse Crunch');
  sitSel.option('Exempt');
  sitSel.selected('Situps');
  sitSel.changed(selectChange);

  runSel = createSelect();
  runSel.parent('sketch-holder');
  runSel.position(10, 395 + 50);
  runSel.option('1.5 Mile');
  runSel.option('Shuttle');
  runSel.option('Walk');
  runSel.option('Exempt');
  runSel.selected('1.5 Mile');
  runSel.changed(selectChange);

  runnum = new Time(0, 0);
  pushups = createSlider(0, pushmax, 0, 1);
  pushups.parent('sketch-holder');
  pushups.position(170, 208 + 50);
  pushups.size(175, 15);
  pushups.addClass("pushups");
  hrpush = createSlider(0, hrmax, 0, 1);
  hrpush.parent('sketch-holder');
  hrpush.position(170, 208 + 50);
  hrpush.size(175, 15);
  hrpush.hide();
  hrpush.addClass('pushups');
  situps = createSlider(0, sitmax, 0, 1)
  situps.parent('sketch-holder');
  situps.position(170, 305 + 50);
  situps.size(175, 15);
  situps.addClass('situps');
  rsitups = createSlider(0, rsitmax, 0, 1)
  rsitups.parent('sketch-holder');
  rsitups.position(170, 305 + 50);
  rsitups.size(175, 15);
  rsitups.hide();
  rsitups.addClass('situps');
  planks = createSlider(0, plankmax, 0, 1)
  planks.parent('sketch-holder');
  planks.position(170, 305 + 50);
  planks.size(135, 15);
  planks.hide();
  planks.addClass('situps');
  runtime = createSlider(runmin, runmax + 62, runmax + 62, 1)
  runtime.parent('sketch-holder');
  runtime.position(10, 450 + 55);
  runtime.size(400, 15);
  runtime.addClass('run');
  walktime = createSlider(0, walkmax+62, 0, 1);
  walktime.parent('sketch-holder');
  walktime.position(10, 450 + 55);
  walktime.size(400, 15);
  walktime.addClass('walk');
  walktime.hide();
  
  shuttleRun = createSlider(0, shuttleMax, 0, 1)
  shuttleRun.parent('sketch-holder');
  shuttleRun.position(10, 450 + 55);
  shuttleRun.size(400, 15);
  shuttleRun.addClass('shuttle');
  shuttleRun.hide();

  plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec, 2);

  pushtxt = createInput();
  pushtxt.parent('sketch-holder');
  pushtxt.addClass('text-box');
  pushtxt.position(365, 195 + 50);
  pushtxt.size(20, 20);
  pushtxt.value(0);
  pushups.input(pushChange);
  pushtxt.mouseClicked(txtInput);
  pushtxt.input(pushChangeTxt);
  pushtxt.attribute('type', 'tel')
  pushtxt.attribute('pattern', '[0-9]+')

  hrpushtxt = createInput();
  hrpushtxt.parent('sketch-holder');
  hrpushtxt.addClass('text-box');
  hrpushtxt.position(365, 195 + 50);
  hrpushtxt.size(20, 20);
  hrpushtxt.value(0);
  hrpushtxt.hide();
  hrpush.input(hrpushChange);
  hrpushtxt.input(hrpushChangeTxt)
  hrpushtxt.mouseClicked(txtInput);
  hrpushtxt.attribute('type', 'tel')
  hrpushtxt.attribute('pattern', '[0-9]+')


  sittxt = createInput();
  sittxt.parent('sketch-holder');
  sittxt.addClass('text-box');
  sittxt.position(365, 295 + 50);
  sittxt.size(20, 20);
  sittxt.value(0);
  situps.input(sitChange);
  sittxt.input(sitChangeTxt)
  sittxt.mouseClicked(txtInput);
  sittxt.attribute('type', 'tel')
  sittxt.attribute('pattern', '[0-9]+')

  rsittxt = createInput();
  rsittxt.parent('sketch-holder');
  rsittxt.addClass('text-box');
  rsittxt.position(365, 295 + 50);
  rsittxt.size(20, 20);
  rsittxt.value(0);
  rsittxt.hide();
  rsitups.input(rsitChange);
  rsittxt.input(rsitChangeTxt)
  rsittxt.mouseClicked(txtInput);
  rsittxt.attribute('type', 'tel')
  rsittxt.attribute('pattern', '[0-9]+')

  var runMaximum = runTime(runmax + 62);
  runmintxt = createInput();
  runmintxt.parent('sketch-holder');
  runmintxt.addClass('text-box');
  runmintxt.position(310, 395 + 50);
  runmintxt.size(20, 20);
  runmintxt.value(runMaximum.minutes);
  runmintxt.hide();
  runmintxt.mouseClicked(txtInput);
  runmintxt.attribute('type', 'tel')
  runmintxt.attribute('pattern', '[0-9]+')
  runmintxt.input(runChangeTxt);

  runsectxt = createInput();
  runsectxt.parent('sketch-holder');
  runsectxt.addClass('text-box');
  runsectxt.position(365, 395 + 50); //245
  runsectxt.size(20, 20);
  runsectxt.value(runMaximum.sec);
  runsectxt.hide();
  runsectxt.mouseClicked(txtInput);
  runtime.input(runChange);
  runsectxt.input(runChangeTxt);
  runsectxt.attribute('type', 'tel')
  runsectxt.attribute('pattern', '[0-9]+')


  var walkMaximum = runTime(walkmax);
  walkmintxt = createInput();
  walkmintxt.parent('sketch-holder');
  walkmintxt.addClass('text-box');
  walkmintxt.position(310, 395 + 50);
  walkmintxt.size(20, 20);
  walkmintxt.value(runMaximum.minutes);
  walkmintxt.hide();
  walkmintxt.mouseClicked(txtInput);
  walkmintxt.attribute('type', 'tel')
  walkmintxt.attribute('pattern', '[0-9]+')
  walkmintxt.input(walkChangeTxt);

  walksectxt = createInput();
  walksectxt.parent('sketch-holder');
  walksectxt.addClass('text-box');
  walksectxt.position(365, 395 + 50); //245
  walksectxt.size(20, 20);
  walksectxt.value(runMaximum.sec);
  walksectxt.hide();
  walksectxt.mouseClicked(txtInput);
  walktime.input(walkChange);
  walksectxt.input(walkChangeTxt);
  walksectxt.attribute('type', 'tel')
  walksectxt.attribute('pattern', '[0-9]+')


  plankmintxt = createInput();
  plankmintxt.parent('sketch-holder');
  plankmintxt.addClass('text-box');
  plankmintxt.position(310, 295 + 50);
  plankmintxt.size(20, 20);
  plankmintxt.value(0);
  plankmintxt.hide();
  plankmintxt.mouseClicked(txtInput);
  plankmintxt.input(plankChangeTxt);
  plankmintxt.attribute('type', 'tel')
  plankmintxt.attribute('pattern', '[0-9]+')

  planksectxt = createInput();
  planksectxt.parent('sketch-holder');
  planksectxt.addClass('text-box');
  planksectxt.position(365, 295 + 50);
  planksectxt.size(20, 20);
  planksectxt.value(0);
  planksectxt.hide();
  planksectxt.mouseClicked(txtInput);
  planks.input(plankChange);
  planksectxt.input(plankChangeTxt);
  planksectxt.attribute('type', 'tel')
  planksectxt.attribute('pattern', '[0-9]+')

  shuttletxt = createInput();
  shuttletxt.parent('sketch-holder');
  shuttletxt.addClass('text-box');
  shuttletxt.position(365, 395 + 50);
  shuttletxt.size(22, 20);
  shuttletxt.value(0);
  shuttletxt.hide();
  shuttletxt.mouseClicked(txtInput);
  shuttleRun.input(shuttleChange);
  shuttletxt.input(shuttleChangeTxt);
  shuttletxt.attribute('type', 'tel')
  shuttletxt.attribute('pattern', '[0-9]+')

  pushImg = createImg(strengthAbsLink, "");
  pushImg.parent(modal);
  pushImg.position(-40, 0);

  cardioImg = createImg(cardioLink, "");
  cardioImg.parent(modal);
  cardioImg.position(-40, 0);

  shuttleImg = createImg(shuttleLink, "");
  shuttleImg.parent(modal);
  shuttleImg.position(-40, 0);

  walkImg = createImg(walkLink, "");
  walkImg.parent(modal);
  walkImg.position(-40, 0);

  runAltitudeImg = createImg(runAltitudeAdjustPath, "");
  runAltitudeImg.parent(modal);
  runAltitudeImg.position(-40, 0);

  walkAltitudeImg = createImg(walkAltitudeAdjustPath, "");
  walkAltitudeImg.parent(modal);
  walkAltitudeImg.position(-40, 0);

}




function setup() {

  pixelDensity(1);
  
   // check if the browser supports serviceWorker at all
  const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    let refreshing = false;
      // register the service worker from the file specified
      const registration = await navigator.serviceWorker.register('sw.js')

      // detect Service Worker update available and wait for it to become installed
      registration.addEventListener('updatefound', () => {
        if (registration.installing) {
          // wait until the new Service worker is actually installed (ready to take over)
          registration.installing.addEventListener('statechange', () => {
            if (registration.waiting) {
              // if there's an existing controller (previous Service Worker), show the prompt
              if (navigator.serviceWorker.controller) {
                if (!refreshing) {
                  refreshing = true;
                  window.location.reload();
                }
              } else {
                // otherwise it's the first install, nothing to do
                console.log('Service Worker initialized for the first time')
              }
            }
          })
        }
      })
    
  }
}

  registerServiceWorker();



  let c = createCanvas(500, 750);
  c.parent('sketch-holder');
  c.drawingContext.miterLimit = 2;

  ageSel = createSelect();
  ageSel.position(310, 85 + 50);
  ageSel.option('< 25');
  ageSel.option('25-29');
  ageSel.option('30-34');
  ageSel.option('35-39');
  ageSel.option('40-44');
  ageSel.option('45-49');
  ageSel.option('50-54');
  ageSel.option('55-59');
  ageSel.option('>60');
  ageSel.selected('< 25');
  ageSel.changed(ageChange);
  ageSel.id('ageSel');
  ageSel.parent('sketch-holder');

  sexSel = createSelect();
  sexSel.position(90, 85 + 50);
  sexSel.option('Female');
  sexSel.option('Male');
  sexSel.changed(ageChange);
  sexSel.id('sexSel');
  sexSel.parent('sketch-holder');

  minMaxValueAge()

  calculateBtn = createButton("CALCULATE SCORE");
  calculateBtn.parent('sketch-holder');
  calculateBtn.addClass('text-box');
  calculateBtn.id('calculateScoreBtn');
  calculateBtn.position(245, 555 + 50);
  calculateBtn.mousePressed(calcBtnClick);

  shuttleAudioBtn = createButton("Shuttle Audio");
  shuttleAudioBtn.parent('sketch-holder');
  shuttleAudioBtn.position(180, 395 + 50);
  shuttleAudioBtn.addClass('text-box');
  shuttleAudio = select("#shuttle-audio");
  shuttleAudio.parent('sketch-holder');
  shuttleAudioBtn.mousePressed(toggleMusicPlayer);

  altitudeSel = createSelect();
  altitudeSel.parent('sketch-holder');
  altitudeSel.addClass('text-box');
  altitudeSel.addClass('altitude-select');
  altitudeSel.position(200, 610 + 50); //240,555
  altitudeSel.option("Altitude Adjust");
  altitudeSel.option("Group 1 (5250-5499ft)");
  altitudeSel.option("Group 2 (5500-5999ft)");
  altitudeSel.option("Group 3 (6000-6599ft)");
  altitudeSel.option("Group 4 (>6600ft)");




  pushInfoBtn = createA("javascript:void(0);", "See <br>Chart"); //infoIcon found in tm.js
  pushInfoBtn.parent('sketch-holder');
  pushInfoBtn.position(365, 153 + 53);
  pushInfoBtn.id('pushBtn');
  pushInfoBtn.mousePressed(pushInfoClick);

  sitInfoBtn = createA("javascript:void(0);", "See <br>Chart");
  sitInfoBtn.parent('sketch-holder');
  sitInfoBtn.position(365, 253 + 53);
  sitInfoBtn.id('pushBtn');
  sitInfoBtn.mousePressed(pushInfoClick);

  cardioInfoBtn = createA("javascript:void(0);", "See <br>Chart");
  cardioInfoBtn.parent('sketch-holder');
  cardioInfoBtn.position(365, 353 + 53);
  cardioInfoBtn.id('pushBtn');
  cardioInfoBtn.mousePressed(cardioInfoClick);

  appInfoIcon = createButton("Info");
  appInfoIcon.parent('sketch-holder');
  appInfoIcon.addClass('text-box');
  appInfoIcon.position(10, 10);
  appInfoIcon.id("appInfoBtn");
  appInfoIcon.mousePressed(appInfoClick);

  resourceIcon = createButton("Resources");
  resourceIcon.parent('sketch-holder');
  resourceIcon.addClass('text-box');
  resourceIcon.position(210, 10);
  resourceIcon.id("resourceBtn");
  resourceIcon.mousePressed(toggleModal3);

  modal = select("#modal");
  closeBtnModal = select(".close-btn");
  canvasContainer = select("#sketch-holder");
  closeBtnModal.mousePressed(toggleModal);

  modal3 = select("#modal3");
  modal3.parent("sketch-holder");
  closeBtnModal3 = select(".close-btn3");
  closeBtnModal3.mousePressed(toggleModal3);

  runAltitudeLink = select("#runAltitudeChart");
  walkAltitudeLink = select("#walkAltitudeChart");
  runAltitudeLink.mousePressed(runAltitudeLinkClicked);
  walkAltitudeLink.mousePressed(walkAltitudeLinkClicked);

  modal2 = select('#modal2');
  modal2.parent('sketch-holder');
  closeBtnModal2 = select(".close-btn2");
  closeBtnModal2.mousePressed(appInfoClick);

  shuttleChartsBtn = createButton("Shuttle Info Charts");
  shuttleChartsBtn.parent('sketch-holder');
  shuttleChartsBtn.addClass('text-box');
  shuttleChartsBtn.position(190, 395 + 50);
  shuttleChartsBtn.mousePressed(showShuttleCharts);
  shuttleChartsBtn.hide();

  createSliders();

  setScoreArrays();

}

function draw() {
  clear();


  var walkAltitudeAdjustment = 0;
    let age = ageSel.value();
    let sex = sexSel.value();
    age = sex + " " + age;
    if (age == 'Male < 25' || age == 'Male 25-29') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 2;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 6;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 9;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 15;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else if(age == 'Male 30-34' || age == 'Male 35-39') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 2;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 6;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 9;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 15;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else if(age == 'Male 40-44' || age == 'Male 45-49') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 2;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 5;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 8;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 14;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else if(age == 'Male 50-54' || age == 'Male 55-59') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 2;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 5;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 8;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 13;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else if (age == 'Male >60') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 1;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 4;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 7;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 12;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else if (age == 'Female < 25' || age == 'Female 25-29') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 3;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 8;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 12;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 20;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else if(age == 'Female 30-34' || age == 'Female 35-39') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 2;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 7;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 12;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 19;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else if(age == 'Female 40-44' || age == 'Female 45-49') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 3;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 7;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 11;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 18;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else if(age == 'Female 50-54' || age == 'Female 55-59') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 2;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 6;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 10;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 17;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else if (age == 'Female >60') {
      switch (altitudeSel.value()) {
        case 'Group 1 (5250-5499ft)':
          walkAltitudeAdjustment = 1;
          break;
        case 'Group 2 (5500-5999ft)':
          walkAltitudeAdjustment = 5;
          break;
        case 'Group 3 (6000-6599ft)':
          walkAltitudeAdjustment = 9;
          break;
        case 'Group 4 (>6600ft)':
          walkAltitudeAdjustment = 15;
          break;
        default:
          walkAltitudeAdjustment = 0;
      }
    } else {
      walkAltitudeAdjustment = 0;
    }
    function runAltitudeAdjust() {
      var run = runtime.value();
      if (altitudeSel.value() == 'Group 1 (5250-5499ft)') {
        if (run <= hms('11:22')) {
          return 2;
        } else if (run <= hms('15:20')) {
          return 3;
        } else if (run <= hms('16:22')) {
          return 4;
        } else if (run <= hms('20:33')) {
          return 5;
        } else if (run <= hms('24:46')) {
          return 6;
        } else if (run <= hms('26:06')) {
          return 7;
        } else if (run >= hms('26:07')) {
          return 8;
        } else {
          return 0;
        }
    
      } else if (altitudeSel.value() == 'Group 2 (5500-5999ft)') {
        if (run <= hms('9:34')) {
          return 6;
        } else if (run <= hms('10:37')) {
          return 7;
        } else if (run <= hms('11:38')) {
          return 8;
        } else if (run <= hms('13:14')) {
          return 9;
        } else if (run <= hms('14:25')) {
          return 10;
        } else if (run <= hms('15:50')) {
          return 11;
        } else if (run >= hms('16:22')) {
          return 12;
        } else if (run <= hms('17:34')) {
          return 13;
        } else if (run <= hms('18:56')) {
          return 14;
        } else if (run <= hms('20:33')) {
          return 15;
        } else if (run <= hms('21:28')) {
          return 17;
        } else if (run <= hms('23:34')) {
          return 18;
        } else if (run >= hms('24:46')) {
          return 19;
        } else if (run <= hms('26:06')) {
          return 20;
        } else if (run >= hms('16:22')) {
          return 22;
        } else {
          return 0;
        }
  
      } else if (altitudeSel.value() == 'Group 3 (6000-6599ft)') {
        if (run <= hms('9:34')) {
          return 11;
        } else if (run <= hms('10:37')) {
          return 12;
        } else if (run <= hms('11:22')) {
          return 13;
        } else if (run <= hms('11:38')) {
          return 14;
        } else if (run <= hms('12:33')) {
          return 15;
        } else if (run <= hms('13:36')) {
          return 16;
        } else if (run >= hms('14:25')) {
          return 17;
        } else if (run <= hms('15:20')) {
          return 18;
        } else if (run <= hms('15:50')) {
          return 19;
        } else if (run <= hms('16:22')) {
          return 20;
        } else if (run <= hms('16:57')) {
          return 21;
        } else if (run <= hms('17:34')) {
          return 22;
        } else if (run >= hms('18:14')) {
          return 23;
        } else if (run <= hms('18:56')) {
          return 24;
        } else if (run >= hms('19:43')) {
          return 25;
        } else if (run <= hms('20:33')) {
          return 26;
        } else if (run <= hms('21:28')) {
          return 28;
        } else if (run <= hms('22:28')) {
          return 29;
        } else if (run >= hms('23:24')) {
          return 31;
        } else if (run <= hms('24:46')) {
          return 32;
        } else if (run >= hms('26:06')) {
          return 34;
        } else  if (run >= hms('26:07')){
          return 37;
        } else {
          return 0;
        }
  
      } else if (altitudeSel.value() == 'Group 4 (>6600ft)') {
        if (run <= hms('9:22')) {
          return 18;
        } else if (run <= hms('9:34')) {
          return 19;
        } else if (run <= hms('9:45')) {
          return 20;
        } else if (run <= hms('10:37')) {
          return 21;
        } else if (run <= hms('11:22')) {
          return 22;
        } else if (run <= hms('11:38')) {
          return 23;
        } else if (run >= hms('11:56')) {
          return 24;
        } else if (run <= hms('12:14')) {
          return 25;
        } else if (run <= hms('12:53')) {
          return 26;
        } else if (run <= hms('13:14')) {
          return 27;
        } else if (run <= hms('14:00')) {
          return 28;
        } else if (run <= hms('14:25')) {
          return 29;
        } else if (run >= hms('15:20')) {
          return 31;
        } else if (run <= hms('15:50')) {
          return 32;
        } else if (run >= hms('16:22')) {
          return 34;
        } else if (run <= hms('16:57')) {
          return 36;
        } else if (run <= hms('17:34')) {
          return 37;
        } else if (run <= hms('18:14')) {
          return 38;
        } else if (run >= hms('18:56')) {
          return 40;
        } else if (run <= hms('19:43')) {
          return 42;
        } else if (run >= hms('20:33')) {
          return 43;
        } else  if (run >= hms('21:28')){
          return 46;
        } else if (run <= hms('22:28')) {
          return 49;
        } else if (run >= hms('23:34')) {
          return 51;
        } else if (run <= hms('24:46')) {
          return 54;
        } else if (run >= hms('26:06')) {
          return 57;
        } else  if (run >= hms('26:07')){
          return 62;
        } else {
          return 0;
        }
  
      } else {
        return 0;
      }
    }
    var runAltitudeAdjustment = runAltitudeAdjust();
 

  if (runtime.value() >= runmin && runtime.value() <= runmax + runAltitudeAdjustment) {
    runtime.addClass('greenbackground')
  } else {
    runtime.removeClass('greenbackground');
  }

  if (walktime.value() <= walkmax + walkAltitudeAdjustment) {
    walktime.addClass('greenbackground')
  } else {
    walktime.removeClass('greenbackground')
  }

  if (shuttleRun.value() >= shuttleMin) {
    shuttleRun.addClass('greenbackground')
  } else {
    shuttleRun.removeClass('greenbackground')
  }

  if (pushups.value() >= pushmin) {
    pushups.addClass('greenbackground')
  } else {
    pushups.removeClass('greenbackground')
  }

  if (hrpush.value() >= hrmin) {
    hrpush.addClass('greenbackground')
  } else {
    hrpush.removeClass('greenbackground')
  }

  if (situps.value() >= sitmin) {
    situps.addClass('greenbackground')
  } else {
    situps.removeClass('greenbackground')
  }

  if (rsitups.value() >= rsitmin) {
    rsitups.addClass('greenbackground')
  } else {
    rsitups.removeClass('greenbackground')
  }

  if (planks.value() >= plankmin) {
    planks.addClass('greenbackground')
  } else {
    planks.removeClass('greenbackground')
  }

  if (isAudioActive) {
    shuttleAudio.show();
  } else {
    shuttleAudio.hide();
  }

  if (isModalActive) {
    canvasContainer.hide();
    modal.show();
  } else {
    canvasContainer.show();
    modal.hide();
  }

  if (isModal2Active) {
    modal2.show();
  } else {
    modal2.hide();
  }

  if (isModal3Active) {
    modal3.show();
  } else {
    modal3.hide();
  }

  stroke('white');
  fill('white');
  text("SEX:", 25, 115 + 50);
  text("AGE:", 235, 115 + 50);

  textSize(16);
  stroke('white');
  strokeWeight(.5);
  fill('white');
  if (pushSel.value() == 'Pushups') {
    text('Strength Score: ' + pscore + '  |  Min: ' + pushmin + "  |  Max: " + pushmax, 15, 175 + 50);
    pushups.removeAttribute('disabled');
    hrpush.removeAttribute('disabled');
    pushtxt.removeAttribute('disabled');
    hrpushtxt.removeAttribute('disabled');
  } else if (pushSel.value() == 'Hand-Release') {
    text('Strength Score: ' + pscore + '  |  Min: ' + hrmin + "  |  Max: " + hrmax, 15, 175 + 50);
    pushups.removeAttribute('disabled');
    hrpush.removeAttribute('disabled');
    pushtxt.removeAttribute('disabled');
    hrpushtxt.removeAttribute('disabled');
  } else if (pushSel.value() == 'Exempt') {
    text('Strength Score: Exempt', 15, 175 + 50);
    pushups.value(0);
    pushups.attribute('disabled', '');
    hrpush.value(0);
    hrpush.attribute('disabled', '');
    pushtxt.value(0);
    pushtxt.attribute('disabled', '');
    hrpushtxt.value(0);
    hrpushtxt.attribute('disabled', '');
  }

  if (sitSel.value() == 'Situps') {
    text('Abs Score: ' + sscore + '  |  Min: ' + sitmin + "  |  Max: " + sitmax, 15, 275 + 50);
    situps.removeAttribute('disabled');
    rsitups.removeAttribute('disabled');
    planks.removeAttribute('disabled');
    sittxt.removeAttribute('disabled');
    rsittxt.removeAttribute('disabled');
    plankmintxt.removeAttribute('disabled');
    planksectxt.removeAttribute('disabled');
  } else if (sitSel.value() == 'Plank') {
    text('Abs Score: ' + sscore + '  |  Min: ' + plankString(plankmin) + "  |  Max: " + plankString(plankmax), 15, 275 + 50);
    situps.removeAttribute('disabled');
    rsitups.removeAttribute('disabled');
    planks.removeAttribute('disabled');
    sittxt.removeAttribute('disabled');
    rsittxt.removeAttribute('disabled');
    plankmintxt.removeAttribute('disabled');
    planksectxt.removeAttribute('disabled');
  } else if (sitSel.value() == 'Reverse Crunch') {
    text('Abs Score: ' + sscore + '  |  Min: ' + rsitmin + "  |  Max: " + rsitmax, 15, 275 + 50);
    situps.removeAttribute('disabled');
    rsitups.removeAttribute('disabled');
    planks.removeAttribute('disabled');
    sittxt.removeAttribute('disabled');
    rsittxt.removeAttribute('disabled');
    plankmintxt.removeAttribute('disabled');
    planksectxt.removeAttribute('disabled');
  } else if (sitSel.value() == 'Exempt') {
    text('Abs Score: Exempt', 15, 275 + 50);
    situps.value(0);
    situps.attribute('disabled', '');
    rsitups.value(0);
    rsitups.attribute('disabled', '');
    planks.value(0);
    planks.attribute('disabled', '');
    sittxt.value(0);
    sittxt.attribute('disabled', '');
    rsittxt.value(0);
    rsittxt.attribute('disabled', '');
    plankmintxt.value(0);
    plankmintxt.attribute('disabled', '');
    planksectxt.value(0);
    planksectxt.attribute('disabled', '');
  }


  


  var runMinimum = runTime(runmax);
  if (runSel.value() == '1.5 Mile') {
    text('Cardio Score: ' + rscore + '  |  Min: ' + plankString(runmax + runAltitudeAdjustment) + "  |  Max: " + plankString(runmin), 15, 375 + 50);
    runtime.removeAttribute('disabled');
    runmintxt.removeAttribute('disabled');
    if (runmintxt.value() === '0') { runmintxt.value(runMinimum.minutes); }
    runsectxt.removeAttribute('disabled');
    shuttleRun.removeAttribute('disabled');
    shuttletxt.removeAttribute('disabled');
    walktime.removeAttribute('disabled');
    walkmintxt.removeAttribute('disabled');
    walksectxt.removeAttribute('disabled');

  } else if (runSel.value() == 'Shuttle') {
    text('Cardio Score: ' + rscore + '  |  Min: ' + shuttleMin + "  |  Max: " + shuttleMax, 15, 375 + 50);
    runtime.removeAttribute('disabled');
    runmintxt.removeAttribute('disabled');
    runsectxt.removeAttribute('disabled');
    shuttleRun.removeAttribute('disabled');
    shuttletxt.removeAttribute('disabled');
    walktime.removeAttribute('disabled');
    walkmintxt.removeAttribute('disabled');
    walksectxt.removeAttribute('disabled');

  } else if (runSel.value() == 'Exempt') {
    text('Cardio Score: Exempt', 85, 375 + 50);
    runtime.value(runmax + 62);
    runtime.attribute('disabled', '');
    runmintxt.value(0);
    runmintxt.attribute('disabled', '');
    runsectxt.value(0);
    runsectxt.attribute('disabled', '');
    shuttleRun.value(0);
    shuttleRun.attribute('disabled', '');
    shuttletxt.value(0);
    shuttletxt.attribute('disabled', '');
    walktime.value(runmax + 62);
    walktime.attribute('disabled', '');
    walkmintxt.value(0);
    walkmintxt.attribute('disabled', '');
    walksectxt.value(0);
    walksectxt.attribute('disabled', '');
    
  } else if (runSel.value() == 'Walk') {
    text('Walk Is Pass/Fail. Max Time To Pass: ' + plankString(walkmax + walkAltitudeAdjustment), 15, 375 + 50);
    walktime.removeAttribute('disabled');
    walkmintxt.removeAttribute('disabled');
    walksectxt.removeAttribute('disabled');
  }





  fill(0);

  stroke('white');
  strokeWeight(2);
  line(10, 150 + 50, 410, 150 + 50);
  stroke(0);
  strokeWeight(1);

  stroke('white');
  strokeWeight(2);
  line(10, 350 + 50, 410, 350 + 50);
  stroke(0);
  strokeWeight(1);

  stroke('white');
  strokeWeight(2);
  line(10, 250 + 50, 410, 250 + 50);
  stroke(0);
  strokeWeight(.5);


  textSize(20);
  fill('white');
  stroke('white');
  if (runSel.value() == '1.5 Mile') {
    text(":", 356, 423 + 50);
    runmintxt.show();
    runsectxt.show();
    shuttletxt.hide();
    walkmintxt.hide();
    walksectxt.hide();
    lapTime = runTime(floor(runtime.value() / 6));
    text("Req'd 6 Lap Time: ~" + lapTime.minutes + ":" + nf(lapTime.sec, 2), 10, 505 + 50);
    text("(Rounded down to nearest sec)", 10, 525 + 50);
    //textSize(15);
    for (var i = 0; i < 6; i++) {
      var lp = floor(runtime.value() / 6)  // num secs per lap
      var nl = runTime(lp * (i + 1));      // Next lap
      // console.log(nl);
      text("Lap " + int(i + 1) + ": ≤ " + nl.minutes + ":" + nf(nl.sec, 2), 10, 600 + (i * 20));
    }
  } else if (runSel.value() == 'Shuttle') {
    text('Shuttle Level: ' + hamrLevel(), 10, 505 + 50);
    text('Current Level Shuttles: ' + hamrShuttles(), 10, 535 + 50);
  }
  pushnum = pushups.value();
  sitnum = situps.value();
  hrpushnum = hrpush.value();
  rsitnum = rsitups.value();
  runnum = runTime(runtime.value());
  plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec, 2);
  shuttlevalue = shuttleRun.value();




  

  var shuttleAltitudeAdjustment = 0;

    var a = altitudeSel.value();
    if (a == 'Group 1 (5250-5499ft)') {
      shuttleAltitudeAdjustment = 1;
    } else if (a == 'Group 2 (5500-5999ft)') {
      shuttleAltitudeAdjustment = 2;
    } else if (a == 'Group 3 (6000-6599ft)') {
      shuttleAltitudeAdjustment = 3;
    } else if (a == 'Group 4 (>6600ft)') {
      shuttleAltitudeAdjustment = 4;
    } else {
      shuttleAltitudeAdjustment = 0;
    }
    var numOfShuttles = shuttleRun.value() + shuttleAltitudeAdjustment;


    

  if (runSel.value() == '1.5 Mile') {
    rscore = runScore(runtime.value() - runAltitudeAdjustment);
  } else if (runSel.value() == 'Shuttle') {
    console.log(shuttleRun.value() + shuttleAltitudeAdjustment);
    console.log(hamrScore(numOfShuttles))
    rscore = hamrScore(shuttleRun.value() + shuttleAltitudeAdjustment);
  } else if (runSel.value() == 'Walk') {
    rscore = 0; walkScore = didWalkPass(walktime.value() - walkAltitudeAdjustment, scoreArrays)
  }


  if (pushSel.value() == 'Pushups') {
    pscore = pushScore(pushnum);
  } else if (pushSel.value() == 'Hand-Release') {
    pscore = hrpushScore(hrpushnum);
  }

  if (sitSel.value() == 'Situps') {
    sscore = sitScore(sitnum);
  } else if (sitSel.value() == 'Reverse Crunch') {
    sscore = rsitScore(rsitnum);
  } else if (sitSel.value() == 'Plank') {
    sscore = plankScore(planks.value());
    text(":", 356, 323 + 50);
  }



  var total = sscore + pscore + rscore;

  //Exemptions

  var p = pushSel.value(), s = sitSel.value(), r = runSel.value(), e = 'Exempt';
  if (p == e && s != e && r != e) {        //only pushups exempt
    total = (sscore + rscore) / 80 * 100;
  } else if (s == e && r != e && p != e) { //only situps exempt
    total = (pscore + rscore) / 80 * 100;
  } else if ((r == e || r == 'Walk') && s != e && p != e) { //only run exempt
    total = (pscore + sscore) / 40 * 100;
  } else if (p == e && s == e && r != e) { //pushups & situps exempt
    total = rscore / 60 * 100;
  } else if (p == e && (r == e || r == 'Walk') && s != e) { //pushups & run exempt
    total = sscore / 20 * 100;
  } else if (s == e && (r == e || r == 'Walk') && p != e) { //situps & run exempt
    total = pscore / 20 * 100;
  }

 

  var totalScoreText = 'FAIL! Minimum Not Met!';
  if ((sscore == 0 && s != e) || (rscore == 0 && r != e && r != 'Walk') || (pscore == 0 && p != e) || (r == 'Walk' && !walkScore)) {
    totalScoreText = "FAIL! Minimum Not Met!";
  }
  else if ((total < 75)) {

    totalScoreText = "Unsatisfactory!";
  }
  else if ((total < 90)) {
    totalScoreText = "Satisfactory!";
  }
  else if ((total >= 90)) {
    totalScoreText = "Excellent!";
  }

  textSize(23);
  fill('white');
  stroke('white');
  if (totalScoreText == 'FAIL! Minimum Not Met!') {
    redgreencolor = color(220, 35, 0);
    fill(redgreencolor);
    stroke('black');
    strokeWeight(6)
    text('FAIL! Minimum Not Met!', 85, 65 + 50)
  } else if (totalScoreText == "Unsatisfactory!") {
    redgreencolor = color(220, 35, 0);
    fill(redgreencolor)
    stroke('black')
    strokeWeight(6)
    text(totalScoreText, 135, 65 + 50)
  } else if (totalScoreText == "Satisfactory!") {
    redgreencolor = 'lightgreen';
    fill(redgreencolor)
    stroke('black')
    strokeWeight(5)
    text(totalScoreText, 155, 65 + 50)
  } else if (totalScoreText == "Excellent!") {
    redgreencolor = 'lightgreen';
    fill(redgreencolor)
    stroke('black')
    strokeWeight(5)
    text(totalScoreText, 165, 65 + 50)
  }

  fill('white');
  stroke('white');
  strokeWeight(0)

  text('Total Score:', 125, 85);

  fill(redgreencolor)
  stroke('black')
  strokeWeight(6)
  text(total.toFixed(1), 255, 85)
  fill('white')
  stroke('white')
  strokeWeight(1)


  function hamrLevel() {

    var hamrLevels = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

    var level = 5;

    if (shuttleRun.value() >= 93) level = hamrLevels[0]; //level 11
    else if (shuttleRun.value() >= 82 && shuttleRun.value() < 93) level = hamrLevels[1]; //level 10
    else if (shuttleRun.value() >= 71 && shuttleRun.value() < 82) level = hamrLevels[2]; //level 9
    else if (shuttleRun.value() >= 61 && shuttleRun.value() < 71) level = hamrLevels[3]; //level 8
    else if (shuttleRun.value() >= 51 && shuttleRun.value() < 61) level = hamrLevels[4]; //level 7
    else if (shuttleRun.value() >= 42 && shuttleRun.value() < 51) level = hamrLevels[5]; //level 6
    else if (shuttleRun.value() >= 33 && shuttleRun.value() < 42) level = hamrLevels[6]; //level 5
    else if (shuttleRun.value() >= 24 && shuttleRun.value() < 33) level = hamrLevels[7]; //level 4
    else if (shuttleRun.value() >= 16 && shuttleRun.value() < 24) level = hamrLevels[8]; //level 3
    else if (shuttleRun.value() >= 8 && shuttleRun.value() < 16) level = hamrLevels[9]; //level 2
    if (shuttleRun.value() >= 0 && shuttleRun.value() < 8) level = hamrLevels[10]; //level 1


    return level
  }

  function hamrShuttles() {

    var shuttles = 1;

    var levelMax = [7, 15, 23, 32, 41, 50, 60, 70, 81, 92, 104];

    if (hamrLevel() == 1) shuttles = shuttleRun.value() - levelMax[0] + 7;
    if (hamrLevel() == 2) shuttles = shuttleRun.value() - levelMax[1] + 8;
    if (hamrLevel() == 3) shuttles = shuttleRun.value() - levelMax[2] + 8;
    if (hamrLevel() == 4) shuttles = shuttleRun.value() - levelMax[3] + 9;
    if (hamrLevel() == 5) shuttles = shuttleRun.value() - levelMax[4] + 9;
    if (hamrLevel() == 6) shuttles = shuttleRun.value() - levelMax[5] + 9;
    if (hamrLevel() == 7) shuttles = shuttleRun.value() - levelMax[6] + 10;
    if (hamrLevel() == 8) shuttles = shuttleRun.value() - levelMax[7] + 10;
    if (hamrLevel() == 9) shuttles = shuttleRun.value() - levelMax[8] + 11;
    if (hamrLevel() == 10) shuttles = shuttleRun.value() - levelMax[9] + 11;
    if (hamrLevel() == 11) shuttles = shuttleRun.value() - levelMax[10] + 12;

    return shuttles
  }

  stroke(0);
  fill(0);
}



function plankTime(secs) {
  var minutes = 0;
  var seconds = 0;
  minutes = floor(secs / 60);
  seconds = secs - (minutes * 60);
  //console.log(seconds);
  var tot = new Time(minutes, seconds);

  return tot;
}


function runTime(secs) {
  var minutes = 0;
  var seconds = 0;


  minutes = floor(secs / 60);
  seconds = secs - (minutes * 60);
  // console.log(minutes + " : " + seconds);

  var tot = new Time(minutes, seconds);

  return tot;
}

function runScore(secs) {
  return calculateRunScore(secs, scoreArrays.cardio);
}

function plankScore(secs) {
  return calculatePlankScore(secs, scoreArrays);
}

function pushScore(pnum) {
  return calculateStrengthScore(pnum, scoreArrays);
}

function hrpushScore(hrpnum) {
  return calculateStrengthScore(hrpnum, scoreArrays);
}

function sitScore(snum) {
  return calculateSitupsScore(snum, scoreArrays);
}

function rsitScore(rsitnum) {
  return calculateSitupsScore(rsitnum, scoreArrays);
}

function hamrScore(shuttles) {
  return calculateShuttleScore(shuttles, scoreArrays);
}



function selectChange() {
  setScoreArrays();
  if (pushSel.value() == 'Pushups') {
    pushupsText = 'Pushups: ';
    pushups.show();
    pushtxt.show();
    hrpush.hide();
    hrpushtxt.hide();
    pushtxt.value('0');
  } else if (pushSel.value() == 'Hand-Release') {
    pushupsText = 'Hand-Release Pushups: ';
    pushups.hide();
    pushtxt.hide();
    hrpush.show();
    hrpushtxt.show();
    hrpushtxt.value('0');
  }

  if (sitSel.value() == 'Situps') {
    situpsText = 'Sit Ups: ';
    situps.show();
    sittxt.show();
    sittxt.value('0');
    rsitups.hide();
    rsittxt.hide();
    planks.hide();
    plankmintxt.hide();
    planksectxt.hide();

  } else if (sitSel.value() == 'Plank') {
    situpsText = 'Plank: ';
    planks.show();
    plankmintxt.show();
    plankmintxt.value('0');
    planksectxt.show();
    planksectxt.value('0');
    situps.hide();
    sittxt.hide();
    rsitups.hide();
    rsittxt.hide();


  } else if (sitSel.value() == 'Reverse Crunch') {
    situpsText = 'Reverse Crunch: ';
    situps.hide();
    sittxt.hide();
    planks.hide();
    plankmintxt.hide();
    planksectxt.hide();
    rsitups.show();
    rsittxt.show();
    rsittxt.value('0');
  }

  if (runSel.value() == '1.5 Mile') {
    var runMinimum = runTime(runmax + 62);
    runText = 'Run Time: ';
    runtime.show();
    runmintxt.show();
    runmintxt.value(runMinimum.minutes);
    runsectxt.value(runMinimum.sec);
    runsectxt.show();
    shuttleRun.hide();
    shuttleChartsBtn.hide();
    walkmintxt.hide();
    walksectxt.hide();
    walktime.hide();
    isAudioActive = false;
    shuttleAudioBtn.position(180, 395 + 50);

  } else if (runSel.value() == 'Shuttle') {
    runtime.hide();
    runmintxt.hide();
    runsectxt.hide();
    shuttletxt.show();
    shuttletxt.value('0');
    shuttleRun.show();
    shuttleChartsBtn.show();
    walkmintxt.hide();
    walksectxt.hide();
    walktime.hide();
    runText = 'Shuttles: ';
    shuttlevalue = shuttleRun.value();
    shuttleAudioBtn.position(290, 495 + 50);

  } else if (runSel.value() == 'Walk') {
    runText = 'Walk : ';
    runtime.hide();
    runmintxt.hide();
    runsectxt.hide();
    shuttletxt.hide();
    shuttleRun.hide();
    shuttleChartsBtn.hide();
    shuttleAudioBtn.position(180, 395 + 50);
    walktime.show();
    walkmintxt.show();
    walksectxt.show();
    walkmintxt.value(0);
    walksectxt.value(0);
    walktime.value(0);
  }
}


function shuttleChange() {
  shuttletxt.value(shuttleRun.value());
  shuttlevalue = shuttleRun.value();
}

function shuttleChangeTxt() {
  shuttleRun.value(shuttletxt.value());
  shuttlevalue = shuttleRun.value();
}

// If Slider is used, sets the pushup txt boxes to slider value
function pushChange() {
  pushtxt.value(pushups.value());
}

function pushChangeTxt() {
  pushups.value(pushtxt.value());
}

function keyPressed() {
  if (keyCode == ENTER) {
    calcBtnClick();
    document.activeElement.blur();
    console.log(keyCode);
  }
}

// If Slider is used, sets the situp txt boxes to slider value
function sitChange() {
  sittxt.value(situps.value());
}

function sitChangeTxt() {
  situps.value(sittxt.value());
}

function rsitChange() {
  rsittxt.value(rsitups.value());
}

function rsitChangeTxt() {
  rsitups.value(rsittxt.value());
}

function plankString(secs) {
  var tm = plankTime(secs);
  return tm.minutes + ":" + nf(tm.sec, 2);
}

function plankChange() {
  var tm = plankTime(planks.value());
  plankmintxt.value(tm.minutes);
  planksectxt.value(nf(tm.sec, 2));
  plankValue = tm.minutes + ":" + nf(tm.sec, 2);
}

function plankChangeTxt() {
  var plankTimeValue = plankmintxt.value() + ":" + planksectxt.value();
  var seconds = hmsToSecs(plankTimeValue);
  planks.value(seconds);
}

function hrpushChange() {
  hrpushtxt.value(hrpush.value());
}

function hrpushChangeTxt() {
  hrpush.value(hrpushtxt.value());
}
// If Slider is used, sets the runtime txt boxes to slider value
function runChange() {
  var tm = runTime(runtime.value());
  runmintxt.value(tm.minutes);
  // console.log(nf(tm.sec,2) + " : " + tm.sec)
  runsectxt.value(tm.sec);
}

function runChangeTxt() {
  var tm = runmintxt.value() + ':' + runsectxt.value();
  var seconds = hmsToSecs(tm);
  runtime.value(seconds);
}


function walkChange() {
  var tm = runTime(walktime.value());
  walkmintxt.value(tm.minutes);
  // console.log(nf(tm.sec,2) + " : " + tm.sec)
  walksectxt.value(tm.sec);
}

function walkChangeTxt() {
  var tm = walkmintxt.value() + ':' + walksectxt.value();
  var seconds = hmsToSecs(tm);
  walktime.value(seconds);
}


// If submit button is clicked, use the values manually input from textboxes
function calcBtnClick() {
  plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec, 2);
  shuttlevalue = shuttleRun.value();
  var validSit;
  var validRunMin;
  var validRunSec;
  var validPlankMin;
  var validPlankSec;
  var validShuttles;
  var validPush;

  if (pushSel.value() == 'Pushups') {
    validPush = int(pushtxt.value());
  } else if (pushSel.value() == 'Hand-Release') {
    validPush = int(hrpushtxt.value());
  } else if (pushSel.value() == 'Exempt') {
    validPush = 0;
  }

  if (sitSel.value() == 'Situps') {
    validSit = int(sittxt.value());
    validPlankMin = 0;
    validPlankSec = 0;
  } else if (sitSel.value() == 'Plank') {
    validSit = 0;
    validPlankMin = int(plankmintxt.value());
    validPlankSec = int(planksectxt.value());
  } else if (sitSel.value() == 'Reverse Crunch') {
    validSit = int(rsittxt.value());
    validPlankMin = 0;
    validPlankSec = 0;
  } else if (sitSel.value() == 'Exempt') {
    validPlankMin = 0;
    validPlankSec = 0;
    validSit = 0;
  }

  if (runSel.value() == '1.5 Mile') {
    validRunMin = int(runmintxt.value());
    validRunSec = int(runsectxt.value());
    validShuttles = 0;
  } else if (runSel.value() == 'Shuttle') {
    validRunMin = 0;
    validRunSec = 0;
    validShuttles = int(shuttletxt.value());
  } else if (runSel.value() == 'Exempt') {
    validRunMin = 0;
    validRunSec = 0;
    validShuttles = 0;
  } else if (runSel.value() == 'Walk') {
    validWalkMin = int(walkmintxt.value());
    validWalkSecs = int(walksectxt.value());
    validRunMin = 0;
    validRunSec = 0;
    validShuttles = 0;
  }

  // Validate textbox inputs
  // Once validated, if they are > max, set the sliders to max
  // this will automatically calculate the score. 
  // I think I'm pretty clever for coming up with this
  // It minimized the amount of code I have to paste into 
  // each score program. 
  if (!isNaN(validPush) && !isNaN(validSit) && !isNaN(validRunMin) && !isNaN(validRunSec) && !isNaN(validPlankMin) && !isNaN(validPlankSec) && !isNaN(validShuttles) && !isNaN(validWalkMin) && !isNaN(validWalkSecs)) {
    if (pushSel.value() == 'Pushups') {
      if (validPush > pushmax) {
        validPush = pushmax;
      }
    } else if (pushSel.value() == 'Hand-Release') {
      if (validPush > hrmax) {
        validPush = hrmax;
      }
    }
    if (sitSel.value() == 'Situps') {
      if (validSit > sitmax) {
        validSit = sitmax;
      }
    } else if (sitSel.value() == 'Reverse Crunch') {
      if (validSit > rsitmax) {
        validSit = rsitmax;
      }
    }

    var mins = validRunMin;
    var secs = validRunSec;
    var runsecs = (mins * 60) + secs;

    if (runsecs > runmax) {
      runsecs = runmax;
    }
    else if (runsecs < runmin) {
      runsecs = runmin;
    }

    var walkmins = validWalkMin;
    var walksecs = validwalkSecs;

    var walkseconds = (walkmins * 60) + walkseconds;

    if (walkseconds > walkmax) {
      walkseconds = walkmax;
    }

    var plankMins = validPlankMin;
    var plankSecs = validPlankSec;
    var plankSeconds = (plankMins * 60) + plankSecs;

    if (plankSeconds > plankmax) {
      plankSeconds = plankmax;
    }

    if (validShuttles > shuttleMax) {
      validShuttles = shuttleMax;
    }

    if (pushSel.value() == 'Pushups') {
      pushups.value(validPush);
    } else if (pushSel.value() == 'Hand-Release') {
      hrpush.value(validPush);
    }
    if (sitSel.value() == 'Situps') {
      situps.value(validSit);
    } else if (sitSel.value() == 'Reverse Crunch') {
      rsitups.value(validSit);
    }
    runtime.value(runsecs);
    planks.value(plankSeconds);
    shuttleRun.value(validShuttles);
    walktime.value(validwalksecs);
  }
  else {
    alert("Please verify that only numbers are input for times!");
  }



  
}

function removeSliders() {
  pushSel.remove();
  sitSel.remove();
  runSel.remove();
  pushups.remove();
  situps.remove();
  hrpush.remove();
  rsitups.remove();
  shuttleRun.remove();
  planks.remove();
  runtime.remove();
  pushtxt.remove();
  hrpushtxt.remove();
  sittxt.remove();
  rsittxt.remove();
  runmintxt.remove();
  runsectxt.remove();
  plankmintxt.remove();
  planksectxt.remove();
  shuttletxt.remove();
  pushImg.remove();
  cardioImg.remove();
  shuttleImg.remove();
  walktime.remove();
  walkmintxt.remove();
  walksectxt.remove();
}

function ageChange() {
  minMaxValueAge();
  selectChange();
  removeSliders();
  createSliders();
  setScoreArrays();
}

function minMaxValueAge() {


  function hms(str) {
    var p = str.split(':'),
      s = 0, m = 1;

    while (p.length > 0) {
      if (p[0] == '') p[0] = 0;
      s += m * parseInt(p.pop(), 10);
      m *= 60;
    }
    return s;
  }


  var age = ageSel.value();
  var sex = sexSel.value();
  age = sex + " " + age;
  if (age == 'Male < 25') {
    pushmin = 30;
    pushmax = 67;
    sitmin = 39;
    sitmax = 58;
    hrmin = 15;
    hrmax = 40;
    rsitmin = 21;
    rsitmax = 49;
    plankmin = 65;
    plankmax = 215;
    runmin = 552;
    runmax = 950;
    shuttleMin = 36;
    shuttleMax = 100;
    walkmax = hms("16:16");
    strengthAbsLink = "./Score Chart jpgs/male_lessthan25_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/male_lessthan25_Run_Shuttle.jpg";
  } else if (age == 'Male 25-29') {
    pushmin = 27;
    pushmax = 62;
    sitmin = 38;
    sitmax = 56;
    hrmin = 15;
    hrmax = 40;
    rsitmin = 20;
    rsitmax = 48;
    plankmin = 60;
    plankmax = 210;
    runmin = 562;
    runmax = 982;
    shuttleMin = 33;
    shuttleMax = 97;
    walkmax = hms("16:16");
    strengthAbsLink = "./Score Chart jpgs/male_25-29_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/male_25-29_cardio.jpg";
  } else if (age == 'Male 30-34') {
    pushmin = 24;
    pushmax = 57;
    sitmin = 36;
    sitmax = 54;
    hrmin = 15;
    hrmax = 40;
    rsitmin = 19;
    rsitmax = 47;
    plankmin = 55;
    plankmax = 205;
    runmin = 574;
    runmax = 1017;
    shuttleMin = 30;
    shuttleMax = 94;
    walkmax = hms("16:18");
    strengthAbsLink = "./Score Chart jpgs/male_30-34_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/male_30-34_cardio.jpg";
  } else if (age == 'Male 35-39') {
    pushmin = 21;
    pushmax = 51;
    sitmin = 34;
    sitmax = 52;
    hrmin = 15;
    hrmax = 40;
    rsitmin = 18;
    rsitmax = 46;
    plankmin = 50;
    plankmax = 200;
    runmin = 585;
    runmax = 1054;
    shuttleMin = 36;
    shuttleMax = 100;
    walkmax = hms("16:18");
    strengthAbsLink = "./Score Chart jpgs/male_35-39_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/male_35-39_cardio.jpg";
  } else if (age == 'Male 40-44') {
    pushmin = 18;
    pushmax = 44;
    sitmin = 31;
    sitmax = 50;
    hrmin = 13;
    hrmax = 38;
    rsitmin = 16;
    rsitmax = 44;
    plankmin = 45;
    plankmax = 195;
    runmin = 598;
    runmax = 1094;
    shuttleMin = 24;
    shuttleMax = 88;
    walkmax = hms("16:23");
    strengthAbsLink = "./Score Chart jpgs/male_40-44_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/male_40-44_Run_Shuttle.jpg";
  } else if (age == 'Male 45-49') {
    pushmin = 15;
    pushmax = 44;
    sitmin = 28;
    sitmax = 48;
    hrmin = 13;
    hrmax = 38;
    rsitmin = 11;
    rsitmax = 43;
    plankmin = 40;
    plankmax = 190;
    runmin = 610;
    runmax = 1136;
    shuttleMin = 22;
    shuttleMax = 86;
    walkmax = hms("16:23");
    strengthAbsLink = "./Score Chart jpgs/male_45-49_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/male_45-49_cardio.jpg";
  } else if (age == 'Male 50-54') {
    pushmin = 12;
    pushmax = 36;
    sitmin = 25;
    sitmax = 46;
    hrmin = 11;
    hrmax = 35;
    rsitmin = 9;
    rsitmax = 42;
    plankmin = 35;
    plankmax = 185;
    runmin = 637;
    runmax = 1233;
    shuttleMin = 16;
    shuttleMax = 80;
    walkmax = hms("16:40");
    strengthAbsLink = "./Score Chart jpgs/male_50-54_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/male_50-54_cardio.jpg";
  } else if (age == 'Male 55-59') {
    pushmin = 12;
    pushmax = 33;
    sitmin = 22;
    sitmax = 44;
    hrmin = 10;
    hrmax = 33;
    rsitmin = 8;
    rsitmax = 41;
    plankmin = 30;
    plankmax = 180;
    runmin = 651;
    runmax = 1288;
    shuttleMin = 13;
    shuttleMax = 77;
    walkmax = hms("16:40");
    strengthAbsLink = "./Score Chart jpgs/male_55-59_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/male_55-59_cardio.jpg";
  } else if (age == 'Male >60') {
    pushmin = 11;
    pushmax = 30;
    sitmin = 19;
    sitmax = 42;
    hrmin = 10;
    hrmax = 30;
    rsitmin = 7;
    rsitmax = 35;
    plankmin = 25;
    plankmax = 175;
    runmin = 682;
    runmax = 1348;
    shuttleMin = 10;
    shuttleMax = 71;
    walkmax = hms("16:58");
    strengthAbsLink = "./Score Chart jpgs/male_over60_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/male_over60_cardio.jpg";
  } else if (age == 'Female < 25') {
    pushmin = 15;
    pushmax = 47;
    sitmin = 35;
    sitmax = 54;
    hrmin = 6;
    hrmax = 31;
    rsitmin = 11;
    rsitmax = 47;
    plankmin = 55;
    plankmax = 210;
    runmin = hms('10:23');
    runmax = hms('18:56');
    shuttleMin = 22;
    shuttleMax = 83;
    walkmax = hms("17:22");
    strengthAbsLink = "./web formatted jpgs/female_lessthan25_Strength_Abs.webp";
    cardioLink = "./web formatted jpgs/female_lessthan25_cardio.webp";
  } else if (age == 'Female 25-29') {
    pushmin = 14;
    pushmax = 47;
    sitmin = 31;
    sitmax = 50;
    hrmin = 6;
    hrmax = 31;
    rsitmin = 9;
    rsitmax = 45;
    plankmin = 50;
    plankmax = 205;
    runmin = hms("10:37");
    runmax = hms("19:43");
    shuttleMin = 19;
    shuttleMax = 80;
    walkmax = hms("17:22");
    strengthAbsLink = "./web formatted jpgs/female_25-29_Strength_Abs.webp";
    cardioLink = "./web formatted jpgs/female_25-29_cardio.webp";
  } else if (age == 'Female 30-34') {
    pushmin = 11;
    pushmax = 46;
    sitmin = 26;
    sitmax = 45;
    hrmin = 6;
    hrmax = 31;
    rsitmin = 9;
    rsitmax = 44;
    plankmin = 45;
    plankmax = 200;
    runmin = hms("10:51");
    runmax = hms("20:33");
    shuttleMin = 16;
    shuttleMax = 77;
    walkmax = hms("17:28");
    strengthAbsLink = "./web formatted jpgs/female_30-34_Strength_Abs.webp";
    cardioLink = "./web formatted jpgs/female_30-34_cardio.webp";
  } else if (age == 'Female 35-39') {
    pushmin = 10;
    pushmax = 42;
    sitmin = 24;
    sitmax = 43;
    hrmin = 6;
    hrmax = 31;
    rsitmin = 7;
    rsitmax = 43;
    plankmin = 45;
    plankmax = 195;
    runmin = hms("11:06");
    runmax = hms("21:28");
    shuttleMin = 13;
    shuttleMax = 74;
    walkmax = hms("17:28");
    strengthAbsLink = "./web formatted jpgs/female_35-39_Strength_Abs.webp";
    cardioLink = "./web formatted jpgs/female_35-39_cardio.webp";
  } else if (age == 'Female 40-44') {
    pushmin = 8;
    pushmax = 38;
    sitmin = 21;
    sitmax = 41;
    hrmin = 4;
    hrmax = 28;
    rsitmin = 6;
    rsitmax = 42;
    plankmin = 35;
    plankmax = 190;
    runmin = hms("11:22");
    runmax = hms("22:28");
    shuttleMin = 10;
    shuttleMax = 71;
    walkmax = hms("17:49");
    strengthAbsLink = "./web formatted jpgs/female_40-44_Strength_Abs.webp";
    cardioLink = "./web formatted jpgs/female_40-44_cardio.webp";
  } else if (age == 'Female 45-49') {
    pushmin = 7;
    pushmax = 37;
    sitmin = 19;
    sitmax = 35;
    hrmin = 4;
    hrmax = 28;
    rsitmin = 6;
    rsitmax = 40;
    plankmin = 30;
    plankmax = 185;
    runmin = hms("11:38");
    runmax = hms("23:34");
    shuttleMin = 7;
    shuttleMax = 68;
    walkmax = hms("17:49");
    strengthAbsLink = "./web formatted jpgs/female_45-49_Strength_Abs.webp";
    cardioLink = "./web formatted jpgs/female_45-49_cardio.webp";
  } else if (age == 'Female 50-54') {
    pushmin = 6;
    pushmax = 35;
    sitmin = 17;
    sitmax = 32;
    hrmin = 1;
    hrmax = 25;
    rsitmin = 6;
    rsitmax = 39;
    plankmin = 25;
    plankmax = 180;
    runmin = hms("12:53");
    runmax = hms("24:46");
    shuttleMin = 5;
    shuttleMax = 56;
    walkmax = hms("18:11");
    strengthAbsLink = "./web formatted jpgs/female_50-54_Strength_Abs.webp";
    cardioLink = "./web formatted jpgs/female_50-54_cardio.webp";
  } else if (age == 'Female 55-59') {
    pushmin = 5;
    pushmax = 28;
    sitmin = 12;
    sitmax = 32;
    hrmin = 1;
    hrmax = 25;
    rsitmin = 6;
    rsitmax = 38;
    plankmin = 20;
    plankmax = 175;
    runmin = hms("13:14");
    runmax = hms("26:06");
    shuttleMin = 2;
    shuttleMax = 54;
    walkmax = hms("18:11");
    strengthAbsLink = "./web formatted jpgs/female_55-59_Strength_Abs.webp";
    cardioLink = "./web formatted jpgs/female_55-59_cardio.webp";
  } else if (age == 'Female >60') {
    pushmin = 4;
    pushmax = 21;
    sitmin = 8;
    sitmax = 31;
    hrmin = 1;
    hrmax = 24;
    rsitmin = 5;
    rsitmax = 32;
    plankmin = 15;
    plankmax = 170;
    runmin = hms("14:00");
    runmax = hms("27:27");
    shuttleMin = 1;
    shuttleMax = 48;
    walkmax = hms("18:53");
    strengthAbsLink = "./web formatted jpgs/female_over60_Strength_Abs.webp";
    cardioLink = "./web formatted jpgs/female_over60_cardio.webp";
  }
}

function toggleMusicPlayer() {
  if (isAudioActive) {
    isAudioActive = false;
  } else {
    isAudioActive = true;
  }
}

function pushInfoClick() {
  if (isModalActive) {
    isModalActive = false;
  } else {
    isModalActive = true;
  }
  cardioImg.hide();
  shuttleImg.hide();
  runAltitudeImg.hide();
  walkAltitudeImg.hide();
  walkImg.hide();
  pushImg.show();

  return false;
}
function cardioInfoClick() {
  if (isModalActive) {
    isModalActive = false;
  } else {
    isModalActive = true;
  }
  pushImg.hide();
  shuttleImg.hide();
  runAltitudeImg.hide();
  walkAltitudeImg.hide();
  if (runSel.value() == 'Walk') {
    walkImg.show();
    cardioImg.hide();
  } else {
    cardioImg.show();
    walkImg.hide();
  }


  return false;
}

function appInfoClick() {
  if (isModal2Active) {
    isModal2Active = false;
  } else {
    isModal2Active = true;
  }

}

function toggleModal() {
  if (isModalActive) {
    isModalActive = false;
  } else {
    isModalActive = true;
  }
}

function toggleModal3() {
  if (isModal3Active) {
    isModal3Active = false;
  } else {
    isModal3Active = true;
  }
}

function showShuttleCharts() {
  if (isModalActive) {
    isModalActive = false;
  } else {
    isModalActive = true;
  }
  pushImg.hide();
  shuttleImg.show();
  cardioImg.hide();
  runAltitudeImg.hide();
  walkAltitudeImg.hide();
}

function runAltitudeLinkClicked() {
  if (isModalActive) {
    isModalActive = false;
  } else {
    isModalActive = true;
  }
  pushImg.hide();
  shuttleImg.hide();
  cardioImg.hide();
  walkAltitudeImg.hide();
  runAltitudeImg.show();
}

function walkAltitudeLinkClicked() {
  if (isModalActive) {
    isModalActive = false;
  } else {
    isModalActive = true;
  }
  pushImg.hide();
  shuttleImg.hide();
  cardioImg.hide();
  runAltitudeImg.hide();
  walkAltitudeImg.show();
}

function txtInput() {
  this.value('');
}



//add altitude differential to runtime.value() in score calculation if altitude select is used...

