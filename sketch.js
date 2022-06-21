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

var canvasContainer;
var isModalActive = false;
var isModal2Active = false;

var modal;
var modal2;
var closeBtnModal;
var closeBtnModal2;


var runtime;                     // Run Slider
var runnum;                      // Run time in seconds
var runmintxt;                   // Textbox for run
var runsectxt;                  // Textbox for run (sec);

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
var plankmin;
var plankmax;
var shuttleMin;
var shuttleMax;


var shuttlevalue;

//Score for component based on calculations.
var rscore=0;
var sscore=0;
var pscore=0;

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
  runSel.option('Exempt');
  runSel.selected('1.5 Mile');
  runSel.changed(selectChange);
  
  runnum=new Time(0,0);
  pushups = createSlider(0, pushmax, 0, 1);
  pushups.parent('sketch-holder');
  pushups.position(170,208 + 50); 
  pushups.size(175,15);
  pushups.addClass("pushups");
  hrpush = createSlider(0, hrmax, 0, 1);
  hrpush.parent('sketch-holder');
  hrpush.position(170,208 + 50);
  hrpush.size(175,15);
  hrpush.hide();
  hrpush.addClass('pushups');
  situps =createSlider(0, sitmax, 0, 1)
  situps.parent('sketch-holder');
  situps.position(170,305 + 50);
  situps.size(175,15);
  situps.addClass('situps');
  rsitups = createSlider(0, rsitmax, 0, 1)
  rsitups.parent('sketch-holder');
  rsitups.position(170,305 + 50);
  rsitups.size(175,15);
  rsitups.hide();
  rsitups.addClass('situps');
  planks = createSlider(0, plankmax, 0, 1)
  planks.parent('sketch-holder');
  planks.position(170, 305 + 50);
  planks.size(135,15);
  planks.hide();
  planks.addClass('situps');
  runtime =createSlider(runmin, runmax, 0, 1)
  runtime.parent('sketch-holder');
  runtime.position(10,450 + 55);
  runtime.size(400,15);
  runtime.addClass('run');
  shuttleRun = createSlider(0, shuttleMax, 0, 1)
  shuttleRun.parent('sketch-holder');
  shuttleRun.position(40,450 + 55);
  shuttleRun.size(350,15);
  shuttleRun.addClass('run');
  shuttleRun.hide();
  
  plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec,2);
  
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
  hrpushtxt.mouseClicked(txtInput);
  
  
  sittxt = createInput();
  sittxt.parent('sketch-holder');
  sittxt.addClass('text-box');
  sittxt.position(365, 295 + 50);
  sittxt.size(20, 20);
  sittxt.value(0);
  situps.input(sitChange);
  sittxt.mouseClicked(txtInput);
  
  rsittxt = createInput();
  rsittxt.parent('sketch-holder');
  rsittxt.addClass('text-box');
  rsittxt.position(365, 295 + 50);
  rsittxt.size(20, 20);
  rsittxt.value(0);
  rsittxt.hide();
  rsitups.input(rsitChange);
  rsittxt.mouseClicked(txtInput);

  var runMinimum = runTime(runmin);
  runmintxt = createInput();
  runmintxt.parent('sketch-holder');
  runmintxt.addClass('text-box');
  runmintxt.position (310, 395 + 50);
  runmintxt.size(20, 20);
  runmintxt.value(runMinimum.minutes);
  runmintxt.hide();
  runmintxt.mouseClicked(txtInput);

  runsectxt = createInput();
  runsectxt.parent('sketch-holder');
  runsectxt.addClass('text-box');
  runsectxt.position(365, 395 + 50); //245
  runsectxt.size(20, 20);
  runsectxt.value(runMinimum.sec);
  runsectxt.hide();
  runsectxt.mouseClicked(txtInput);
  runtime.input(runChange);
  
  plankmintxt = createInput();
  plankmintxt.parent('sketch-holder');
  plankmintxt.addClass('text-box');
  plankmintxt.position(310, 295 + 50);
  plankmintxt.size(20,20);
  plankmintxt.value(0);
  plankmintxt.hide();
  plankmintxt.mouseClicked(txtInput);
  planksectxt = createInput();
  planksectxt.parent('sketch-holder');
  planksectxt.addClass('text-box');
  planksectxt.position(365, 295 + 50);
  planksectxt.size(20,20);
  planksectxt.value(0);
  planksectxt.hide();
  planksectxt.mouseClicked(txtInput);
  planks.input(plankChange);
  
  shuttletxt = createInput();
  shuttletxt.parent('sketch-holder');
  shuttletxt.addClass('text-box');
  shuttletxt.position(365, 395 + 50);
  shuttletxt.size(22,20);
  shuttletxt.value(0);
  shuttletxt.hide();
  shuttletxt.mouseClicked(txtInput);
  shuttleRun.input(shuttleChange);

  pushImg = createImg(strengthAbsLink, "");
  pushImg.parent(modal);
  pushImg.position(-40, 0);

  cardioImg = createImg(cardioLink, "");
  cardioImg.parent(modal);
  cardioImg.position(-40, 0);
  
  shuttleImg = createImg(shuttleLink, "");
  shuttleImg.parent(modal);
  shuttleImg.position(-40, 0);


}




function setup() {
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
  calculateBtn.position(245, 610 + 50);
  calculateBtn.mousePressed(calcBtnClick);
  
  shuttleAudioBtn = createButton("Shuttle Audio");
  shuttleAudioBtn.parent('sketch-holder');
  shuttleAudioBtn.position(180, 395 + 50);
  shuttleAudioBtn.addClass('text-box');
  shuttleAudio = select("#shuttle-audio");
  shuttleAudio.parent('sketch-holder');
  shuttleAudioBtn.mousePressed(toggleMusicPlayer);
  
  resetBtn = createButton("Reset Values");
  resetBtn.parent('sketch-holder');
  resetBtn.addClass('text-box');
  resetBtn.position(290, 555 + 50); //240,555
  resetBtn.mousePressed(ageChange);

  pushInfoBtn = createA("javascript:void(0);", "See <br>Chart"); //infoIcon found in tm.js
  pushInfoBtn.parent('sketch-holder');
  pushInfoBtn.position(365, 153 + 50);
  pushInfoBtn.id('pushBtn');
  pushInfoBtn.mousePressed(pushInfoClick);

  sitInfoBtn = createA("javascript:void(0);", "See <br>Chart");
  sitInfoBtn.parent('sketch-holder');
  sitInfoBtn.position(365, 253 + 50);
  sitInfoBtn.id('pushBtn');
  sitInfoBtn.mousePressed(pushInfoClick);

  cardioInfoBtn = createA("javascript:void(0);", "See <br>Chart");
  cardioInfoBtn.parent('sketch-holder');
  cardioInfoBtn.position(365, 353 + 50);
  cardioInfoBtn.id('pushBtn');
  cardioInfoBtn.mousePressed(cardioInfoClick);

  appInfoIcon = createButton("Info");
  appInfoIcon.parent('sketch-holder');
  appInfoIcon.addClass('text-box');
  appInfoIcon.position(10, 10);
  appInfoIcon.id("appInfoBtn");
  appInfoIcon.mousePressed(appInfoClick);


  modal = select("#modal");
  closeBtnModal = select(".close-btn");
  canvasContainer = select("#sketch-holder");
  closeBtnModal.mousePressed(toggleModal);

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

  if (runtime.value() >= runmin) {
    runtime.addClass('greenbackground')
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
  
  var runMinimum = runTime(runmin);
  if (runSel.value() == '1.5 Mile') {
    text('Cardio Score: ' + rscore + '  |  Min: ' + plankString(runmin) + "  |  Max: " + plankString(runmax), 15, 375 + 50);
    runtime.removeAttribute('disabled');
    runmintxt.removeAttribute('disabled');
    if (runmintxt.value() === '0') {runmintxt.value(runMinimum.minutes);}
    runsectxt.removeAttribute('disabled');
    shuttleRun.removeAttribute('disabled');
    shuttletxt.removeAttribute('disabled');
  } else if (runSel.value() == 'Shuttle') {
    text('Cardio Score: ' + rscore + '  |  Min: ' + shuttleMin + "  |  Max: " + shuttleMax, 15, 375 + 50);
    runtime.removeAttribute('disabled');
    runmintxt.removeAttribute('disabled');
    runsectxt.removeAttribute('disabled');
    shuttleRun.removeAttribute('disabled');
    shuttletxt.removeAttribute('disabled');
  } else if (runSel.value() == 'Exempt') {
    text('Cardio Score: Exempt', 85, 375 + 50);
    runtime.value(runmin);
    runtime.attribute('disabled', '');
    runmintxt.value(0);
    runmintxt.attribute('disabled', '');
    runsectxt.value(0);
    runsectxt.attribute('disabled', '');
    shuttleRun.value(0);
    shuttleRun.attribute('disabled', '');
    shuttletxt.value(0);
    shuttletxt.attribute('disabled', '');
  }
  
  fill(0);
  
  stroke('white');
  strokeWeight(2);
  line(10,150 + 50,410,150 + 50);
  stroke(0);
  strokeWeight(1);
  
  stroke('white');
  strokeWeight(2);
  line(10,350 + 50,410,350 + 50);
  stroke(0);
  strokeWeight(1);
  
  stroke('white');
  strokeWeight(2);
  line(10,250 + 50,410,250 + 50);
  stroke(0);
  strokeWeight(.5);
  

  textSize(20);
  fill('white');
  stroke('white');
  if (runSel.value()=='1.5 Mile') {
    text(":", 356, 423 + 50);
    runmintxt.show();
    runsectxt.show();
    shuttletxt.hide();
    lapTime=runTime(floor(runtime.value()/6));
    text("Req'd 6 Lap Time: ~" + lapTime.minutes +":" + nf(lapTime.sec,2), 10, 505 + 50);
    text("(Rounded down to nearest sec)", 10, 525 + 50);
    //textSize(15);
    for(var i=0; i<6; i++)
    {
    var lp=floor(runtime.value()/6)  // num secs per lap
    var nl=runTime(lp*(i+1));      // Next lap
     // console.log(nl);
    text("Lap " + int(i+1) + ": ≤ " + nl.minutes  +":" +nf(nl.sec,2), 10, 600+(i*20));    
    }
  } else if (runSel.value() == 'Shuttle') {
    text('Shuttle Level: ' + hamrLevel(), 10, 505 + 50);
    text('Current Level Shuttles: ' + hamrShuttles(), 10, 535 + 50);
  }
  pushnum=pushups.value();
  sitnum=situps.value();
  hrpushnum=hrpush.value();
  rsitnum=rsitups.value();
  runnum=runTime(runtime.value());
  plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec,2);
  shuttlevalue = shuttleRun.value();
  
  if (runSel.value() == '1.5 Mile') {
    rscore=runScore(runtime.value());
  } else if (runSel.value() == 'Shuttle') {
    rscore = hamrScore(shuttleRun.value());
  }
  
  if (pushSel.value() == 'Pushups') {
    pscore=pushScore(pushnum);
  } else if (pushSel.value() == 'Hand-Release') {
    pscore=hrpushScore(hrpushnum);
  }
  
  if (sitSel.value() == 'Situps') {
    sscore=sitScore(sitnum);
  } else if (sitSel.value() == 'Reverse Crunch') {
    sscore=rsitScore(rsitnum);
  } else if (sitSel.value() == 'Plank') {
    sscore = plankScore(planks.value());
    text(":", 356, 323 + 50);
  }
  

    
  var total=sscore+pscore+rscore;
  
  //Exemptions
  
  var p = pushSel.value(), s = sitSel.value(), r = runSel.value(), e = 'Exempt';
  if (p == e && s != e && r != e) {        //only pushups exempt
    total = (sscore + rscore) / 80 * 100;
  } else if (s == e && r != e && p != e) { //only situps exempt
    total = (pscore + rscore) / 80 * 100;
  } else if (r == e && s != e && p != e) { //only run exempt
    total = (pscore + sscore) / 40 * 100;
  } else if (p == e && s == e && r != e) { //pushups & situps exempt
    total = rscore / 60 * 100;
  } else if (p == e && r == e && s != e) { //pushups & run exempt
    total = sscore / 20 * 100;
  } else if (s == e && r == e && p != e) { //situps & run exempt
    total = pscore / 20 * 100;
  }
  
  
  var totalScoreText = 'FAIL! Minimum Not Met!';
  if ((sscore==0 && s != e) || (rscore==0 && r != e) || (pscore==0 && p != e))
  {
  totalScoreText = "FAIL! Minimum Not Met!";
  }
  else if((total<75))
  {

  totalScoreText = "Unsatisfactory!";
  }
  else if((total<90))
  {
  totalScoreText = "Satisfactory!";
  }
  else if((total>=90))
  {
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
    text('FAIL! Minimum Not Met!', 85,65 + 50)
  } else if (totalScoreText == "Unsatisfactory!") {
    redgreencolor = color(220, 35, 0);
    fill(redgreencolor)
    stroke('black')
    strokeWeight(6)
    text(totalScoreText, 135,65 + 50)
  } else if (totalScoreText == "Satisfactory!") {
    redgreencolor = 'lightgreen';
    fill(redgreencolor)
    stroke('black')
    strokeWeight(5)
    text(totalScoreText, 155,65 + 50)
  } else if (totalScoreText == "Excellent!") { 
    redgreencolor = 'lightgreen';
    fill(redgreencolor)
    stroke('black')
    strokeWeight(5)
    text(totalScoreText, 165,65 + 50)
  }

  fill('white');
  stroke('white');
  strokeWeight(0)

  text('Total Score:', 125, 85);

  fill(redgreencolor)
  stroke('black')
  strokeWeight(6)
  text(total.toFixed(1), 255,85)
  fill('white')
  stroke('white')
  strokeWeight(1)
  
  
function hamrLevel() {
  
  var hamrLevels = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  
  var level = 5;
  
  if (shuttleRun.value() >= 93) level=hamrLevels[0]; //level 11
  else if (shuttleRun.value() >= 82 && shuttleRun.value() <93) level=hamrLevels[1]; //level 10
  else if (shuttleRun.value() >= 71 && shuttleRun.value() <82) level=hamrLevels[2]; //level 9
  else if (shuttleRun.value() >= 61 && shuttleRun.value() <71) level=hamrLevels[3]; //level 8
  else if (shuttleRun.value() >= 51 && shuttleRun.value() <61) level=hamrLevels[4]; //level 7
  else if (shuttleRun.value() >= 42 && shuttleRun.value() <51) level=hamrLevels[5]; //level 6
  else if (shuttleRun.value() >= 33 && shuttleRun.value() <42) level=hamrLevels[6]; //level 5
  else if (shuttleRun.value() >= 24 && shuttleRun.value() <33) level=hamrLevels[7]; //level 4
  else if (shuttleRun.value() >= 16 && shuttleRun.value() <24) level=hamrLevels[8]; //level 3
  else if (shuttleRun.value() >= 8 && shuttleRun.value() <16) level=hamrLevels[9]; //level 2
  if (shuttleRun.value() >= 0 && shuttleRun.value() <8) level=hamrLevels[10]; //level 1
  
  
  return level
}
  
function hamrShuttles() {
  
  var shuttles = 1;
  
  var levelMax = [7, 15, 23, 32, 41, 50, 60, 70, 81, 92, 104];
  
  if (hamrLevel() == 1) shuttles = shuttleRun.value() - levelMax[0] +7;
  if (hamrLevel() == 2) shuttles = shuttleRun.value() - levelMax[1] +8;
  if (hamrLevel() == 3) shuttles = shuttleRun.value() - levelMax[2] +8;
  if (hamrLevel() == 4) shuttles = shuttleRun.value() - levelMax[3] +9;
  if (hamrLevel() == 5) shuttles = shuttleRun.value() - levelMax[4] +9;
  if (hamrLevel() == 6) shuttles = shuttleRun.value() - levelMax[5] +9;
  if (hamrLevel() == 7) shuttles = shuttleRun.value() - levelMax[6] +10;
  if (hamrLevel() == 8) shuttles = shuttleRun.value() - levelMax[7] +10;
  if (hamrLevel() == 9) shuttles = shuttleRun.value() - levelMax[8] +11;
  if (hamrLevel() == 10) shuttles = shuttleRun.value() - levelMax[9] +11;
  if (hamrLevel() == 11) shuttles = shuttleRun.value() - levelMax[10] +12;
  
  return shuttles
}
  
  stroke(0);
  fill(0);
}



function plankTime(secs) {
  var minutes=0;
  var seconds=0;
  minutes=floor(secs/60);
  seconds=secs- (minutes*60);
  //console.log(seconds);
  var tot = new Time(minutes, seconds);
  
return tot;
}


function runTime(secs)
{
var minutes=0;
var seconds=0;

  
minutes=floor(secs/60);
seconds=secs-(minutes*60);
  // console.log(minutes + " : " + seconds);
  
var tot = new Time(minutes, seconds);
  
return tot; 
}

function runScore(secs)
{
  return calculateRunScore(secs,scoreArrays.cardio);
}

function plankScore(secs) {
  return calculatePlankScore(secs, scoreArrays);
}

function pushScore(pnum)
{
  return calculateStrengthScore(pnum, scoreArrays);
}

function hrpushScore(hrpnum) {
  return calculateStrengthScore(hrpnum, scoreArrays);
}

function sitScore(snum)
{
  return calculateSitupsScore(snum, scoreArrays);
}

function rsitScore(rsitnum) {
  return calculateSitupsScore(rsitnum, scoreArrays);
}

function hamrScore() {
  return calculateShuttleScore(shuttleRun.value(), scoreArrays);
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
    var runMinimum = runTime(runmin);
    runText = 'Run Time: ';
    runtime.show();
    runmintxt.show();
    runmintxt.value(runMinimum.minutes);
    runsectxt.value(runMinimum.sec);
    runsectxt.show();
    shuttleRun.hide();
    shuttleChartsBtn.hide();
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
    runText = 'Shuttles: ';
    shuttlevalue = shuttleRun.value();
    shuttleAudioBtn.position(290, 495 + 50);
  }
}


function shuttleChange() {
  shuttletxt.value(shuttleRun.value());
  shuttlevalue = shuttleRun.value();
}

// If Slider is used, sets the pushup txt boxes to slider value
function pushChange()
{
pushtxt.value(pushups.value()); 
}

function pushChangeTxt()
{
  pushups.value(pushtxt.value());
}

function keyPressed() {
  if (keyCode == ENTER) {
    calcBtnClick();
  }
}

// If Slider is used, sets the situp txt boxes to slider value
function sitChange()
{
sittxt.value(situps.value()); 
}

function rsitChange() {
  rsittxt.value(rsitups.value());
}

function plankString(secs) {
  var tm = plankTime(secs);
  return tm.minutes + ":" + nf(tm.sec,2);
}

function plankChange() {
  var tm = plankTime(planks.value());
  plankmintxt.value(tm.minutes);
  planksectxt.value(nf(tm.sec,2));
  plankValue = tm.minutes + ":" + nf(tm.sec,2);
}

function hrpushChange() {
  hrpushtxt.value(hrpush.value());
}
// If Slider is used, sets the runtime txt boxes to slider value
function runChange() 
{
var tm= runTime(runtime.value());
runmintxt.value(tm.minutes);
// console.log(nf(tm.sec,2) + " : " + tm.sec)
runsectxt.value(tm.sec); 
}

// If submit button is clicked, use the values manually input from textboxes
function calcBtnClick()
{
  plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec,2);
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
  }

  // Validate textbox inputs
  // Once validated, if they are > max, set the sliders to max
  // this will automatically calculate the score. 
  // I think I'm pretty clever for coming up with this
  // It minimized the amount of code I have to paste into 
  // each score program. 
  if(!isNaN(validPush) && !isNaN(validSit) && !isNaN(validRunMin) && !isNaN(validRunSec) && !isNaN(validPlankMin) && !isNaN(validPlankSec) && !isNaN(validShuttles))
  {
    if (pushSel.value() == 'Pushups') {
      if(validPush>pushmax) {
      validPush=pushmax;  
      }
    } else if (pushSel.value() == 'Hand-Release') {
      if (validPush>hrmax) {
        validPush = hrmax;
      }
    }
    if (sitSel.value() == 'Situps') {
      if(validSit>sitmax) {
      validSit=sitmax;  
      }
    } else if (sitSel.value() == 'Reverse Crunch') {
      if (validSit>rsitmax) {
        validSit = rsitmax;
      }
    }

    var mins=validRunMin;
    var secs=validRunSec;
    var runsecs=(mins*60) + secs;
  
    if(runsecs > runmax)
    {
    runsecs=runmax; 
    }
    else if(runsecs < runmin)
    {
    runsecs = runmin;  
    }
    
    var plankMins=validPlankMin;
    var plankSecs=validPlankSec;
    var plankSeconds=(plankMins*60) + plankSecs;
    
    if(plankSeconds > plankmax) {
      plankSeconds = plankmax;
    }
  
    if (validShuttles > shuttleMax) {
      validShuttles = shuttleMax;
    }
    
    if (pushSel.value() == 'Pushups'){
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
  }
  else
  {
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
}

function ageChange() {
  minMaxValueAge();
  removeSliders();
  createSliders();
  selectChange();
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
    strengthAbsLink = "./Score Chart jpgs/female_lessthan25_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/female_lessthan25_cardio.jpg";
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
    runmin = 635;
    runmax = 1190;
    shuttleMin = 19;
    shuttleMax = 80;
    strengthAbsLink = "./Score Chart jpgs/female_25-29_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/female_25-29_cardio.jpg";
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
    runmin = 651;
    runmax = 1235;
    shuttleMin = 16;
    shuttleMax = 77;
    strengthAbsLink = "./Score Chart jpgs/female_30-34_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/female_30-34_cardio.jpg";
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
    runmin = 660;
    runmax = 1290;
    shuttleMin = 13;
    shuttleMax = 74;
    strengthAbsLink = "./Score Chart jpgs/female_35-39_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/female_35-39_cardio.jpg";
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
    runmin = 680;
    runmax = 1350;
    shuttleMin = 10;
    shuttleMax = 71;
    strengthAbsLink = "./Score Chart jpgs/female_40-44_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/female_40-44_cardio.jpg";
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
    runmin = 690;
    runmax = 1420;
    shuttleMin = 7;
    shuttleMax = 68;
    strengthAbsLink = "./Score Chart jpgs/female_45-49_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/female_45-49_cardio.jpg";
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
    runmin = 770;
    runmax = 1490;
    shuttleMin = 5;
    shuttleMax = 56;
    strengthAbsLink = "./Score Chart jpgs/female_50-54_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/female_50-54_cardio.jpg";
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
    runmin = 790;
    runmax = 1570;
    shuttleMin = 2;
    shuttleMax = 54;
    strengthAbsLink = "./Score Chart jpgs/female_55-59_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/female_55-59_cardio.jpg";
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
    runmin = 835;
    runmax = 1650;
    shuttleMin = 1;
    shuttleMax = 48;
    strengthAbsLink = "./Score Chart jpgs/female_over60_Strength_Abs.jpg";
    cardioLink = "./Score Chart jpgs/female_over60_cardio.jpg";
  }
}

function scoreChartBtnPressed() {
  window.open('https://www.afpc.af.mil/Career-Management/Fitness-Program/', '_blank')
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
  cardioImg.show();
  
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

function showShuttleCharts() {
  if (isModalActive) {
    isModalActive = false;
  } else {
    isModalActive = true;
  }
  pushImg.hide();
  shuttleImg.show();
  cardioImg.hide();
}

function txtInput() {
  this.value('');
}
