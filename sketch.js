var shuttleAudioBtn;
var shuttleAudio;
var isAudioActive = false;

var runtime;                     // Run Slider
var runnum;                      // Run time in seconds
var runmintxt;                   // Textbox for run
var runsectxt;                  // Textbox for run (sec);

var ageSel;
var pushSel;
var sitSel;
var runSel;

var shuttleLevel = 0;
var shuttleNumber = 0;

var pushups;                     // Pushup Slider
var pushnum;                     // Number of pushupos
var pushtxt;                     // Textbox for pushup

var hrpush;
var hrpushnum;
var hrpushtxt;

var runValue;
var plankValue = 0;

var situps;                      // Situp Slider
var sitnum;                      // Number of situps
var sittxt;                      // Textbox for situps

var rsitups;                     // Reverse Crunch Slider
var rsitnum;                      // Number of reverse crunches
var rsittxt;                     // Textbox for reverse crunches

var planks; //plank slider
var planksectxt; //plank seconds
var plankmintxt; //plank mins
var planktime; //total plank time in seconds


var butt;                        // Button to submit text box calculation

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

var rscore=0;
var sscore=0;
var pscore=0;

var selectValue;

function createSliders() {
  pushSel = createSelect();
  pushSel.parent('sketch-holder');
  pushSel.position(10, 195);
  pushSel.option('Pushups');
  pushSel.option('Hand-Release');
  pushSel.option('Exempt');
  pushSel.selected('Pushups');
  pushSel.changed(selectChange);

  sitSel = createSelect();
  sitSel.parent('sketch-holder');
  sitSel.position(10, 295);
  sitSel.option('Situps');
  sitSel.option('Plank');
  sitSel.option('Reverse Crunch');
  sitSel.option('Exempt');
  sitSel.selected('Situps');
  sitSel.changed(selectChange);
  
  runSel = createSelect();
  runSel.parent('sketch-holder');
  runSel.position(10, 395);
  runSel.option('1.5 Mile');
  runSel.option('Shuttle');
  runSel.option('Exempt');
  runSel.selected('1.5 Mile');
  runSel.changed(selectChange);
  
  runnum=new Time(0,0);
  pushups =createSlider(0, pushmax, 0, 1)
  pushups.parent('sketch-holder');
  pushups.position(170,208); 
  pushups.size(175,15);
  hrpush = createSlider(0, hrmax, 0, 1)
  hrpush.parent('sketch-holder');
  hrpush.position(170,208);
  hrpush.size(175,15);
  hrpush.hide();
  situps =createSlider(0, sitmax, 0, 1)
  situps.parent('sketch-holder');
  situps.position(170,305);
  situps.size(175,15);
  rsitups = createSlider(0, rsitmax, 0, 1)
  rsitups.parent('sketch-holder');
  rsitups.position(170,305);
  rsitups.size(175,15);
  rsitups.hide();
  planks = createSlider(0, plankmax, 0, 1)
  planks.parent('sketch-holder');
  planks.position(170, 305);
  planks.size(135,15);
  planks.hide();
  runtime =createSlider(runmin, runmax, 0, 1)
  runtime.parent('sketch-holder');
  runtime.position(40,450);
  runtime.size(350,15);
  shuttleRun = createSlider(0, shuttleMax, 0, 1)
  shuttleRun.parent('sketch-holder');
  shuttleRun.position(40,450);
  shuttleRun.size(350,15);
  shuttleRun.hide();
  
  runValue = runTime(runtime.value()).minutes + ":" + nf(runTime(runtime.value()).sec,2);
  
  plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec,2);
  
  pushtxt = createInput();
  pushtxt.parent('sketch-holder');
  pushtxt.addClass('text-box');
  pushtxt.position(365, 195);
  pushtxt.size(20, 20);
  pushtxt.value(0);
  pushups.input(pushChange);
  
  hrpushtxt = createInput();
  hrpushtxt.parent('sketch-holder');
  hrpushtxt.addClass('text-box');
  hrpushtxt.position(365, 195);
  hrpushtxt.size(20, 20);
  hrpushtxt.value(0);
  hrpushtxt.hide();
  hrpush.input(hrpushChange);
  
  
  sittxt = createInput();
  sittxt.parent('sketch-holder');
  sittxt.addClass('text-box');
  sittxt.position(365, 295);
  sittxt.size(20, 20);
  sittxt.value(0);
  situps.input(sitChange);
  
  rsittxt = createInput();
  rsittxt.parent('sketch-holder');
  rsittxt.addClass('text-box');
  rsittxt.position(365, 295);
  rsittxt.size(20, 20);
  rsittxt.value(0);
  rsittxt.hide();
  rsitups.input(rsitChange);

  var runMinimum = runTime(runmin);
  runmintxt = createInput();
  runmintxt.parent('sketch-holder');
  runmintxt.addClass('text-box');
  runmintxt.position (290, 395);
  runmintxt.size(20, 20);
  runmintxt.value(runMinimum.minutes);
  runmintxt.hide();
  runsectxt = createInput();
  runsectxt.parent('sketch-holder');
  runsectxt.addClass('text-box');
  runsectxt.position(345, 395); //245
  runsectxt.size(20, 20);
  runsectxt.value(runMinimum.sec);
  runsectxt.hide();
  runtime.input(runChange);
  
  plankmintxt = createInput();
  plankmintxt.parent('sketch-holder');
  plankmintxt.addClass('text-box');
  plankmintxt.position(310, 295);
  plankmintxt.size(20,20);
  plankmintxt.value(0);
  plankmintxt.hide();
  planksectxt = createInput();
  planksectxt.parent('sketch-holder');
  planksectxt.addClass('text-box');
  planksectxt.position(365, 295);
  planksectxt.size(20,20);
  planksectxt.value(0);
  planksectxt.hide();
  planks.input(plankChange);
  
  shuttletxt = createInput();
  shuttletxt.parent('sketch-holder');
  shuttletxt.addClass('text-box');
  shuttletxt.position(365, 395);
  shuttletxt.size(22,20);
  shuttletxt.value(0);
  shuttletxt.hide();
  shuttleRun.input(shuttleChange);
}




function setup() {
  let c = createCanvas(500, 750);  
  c.parent('sketch-holder');
  
  ageSel = createSelect();
  ageSel.position(10, 85);
  ageSel.option('Female 18-24');
  ageSel.option('Female 25-29');
  ageSel.option('Female 30-34');
  ageSel.option('Female 35-39');
  ageSel.option('Female 40-44');
  ageSel.option('Female 45-49');
  ageSel.option('Female 50-54');
  ageSel.option('Female 55-59');
  ageSel.option('Female >60');
  ageSel.option('Male 18-24');
  ageSel.option('Male 25-29');
  ageSel.option('Male 30-34');
  ageSel.option('Male 35-39');
  ageSel.option('Male 40-44');
  ageSel.option('Male 45-49');
  ageSel.option('Male 50-54');
  ageSel.option('Male 55-59');
  ageSel.option('Male >60');
  ageSel.selected('Female 18-24');
  ageSel.changed(ageChange);
  ageSel.parent('sketch-holder');
  
  minMaxValueAge()
  
  butt = createButton("CALCULATE SCORE");
  butt.parent('sketch-holder');
  butt.addClass('text-box');
  butt.position(240, 85);
  butt.mousePressed(calcButton);
  
  shuttleAudioBtn = createButton("Shuttle Audio");
  shuttleAudioBtn.parent('sketch-holder');
  shuttleAudioBtn.position(210, 395);
  shuttleAudioBtn.addClass('text-box');
  shuttleAudioBtn.hide();
  shuttleAudio = select("#shuttle-audio");
  shuttleAudio.parent('sketch-holder');
  shuttleAudioBtn.mousePressed(toggleMusicPlayer);
  
  scoreChartBtn = createButton("See PT Score Charts");
  scoreChartBtn.parent('sketch-holder');
  scoreChartBtn.addClass('text-box');
  scoreChartBtn.position(240, 615);
  scoreChartBtn.mousePressed(scoreChartBtnPressed);
  
  resetBtn = createButton("Reset Values");
  resetBtn.parent('sketch-holder');
  resetBtn.addClass('text-box');
  resetBtn.position(290, 555); //240,555
  resetBtn.mousePressed(ageChange);
  
  createSliders();
  
  
}

function draw() {
  clear();
  
  if (isAudioActive) {
    shuttleAudio.show();
  } else {
    shuttleAudio.hide();
  }
  
  textSize(15);
  stroke('white');
  strokeWeight(.5);
  fill('white');
  if (pushSel.value() == 'Pushups') {
    text('Strength Score: ' + pscore + '  |  Min: ' + pushmin + "  |  Max: " + pushmax, 85, 175);
    pushups.removeAttribute('disabled');
    hrpush.removeAttribute('disabled');
    pushtxt.removeAttribute('disabled');
    hrpushtxt.removeAttribute('disabled');
  } else if (pushSel.value() == 'Hand-Release') {
    text('Strength Score: ' + pscore + '  |  Min: ' + hrmin + "  |  Max: " + hrmax, 85, 175);
    pushups.removeAttribute('disabled');
    hrpush.removeAttribute('disabled');
    pushtxt.removeAttribute('disabled');
    hrpushtxt.removeAttribute('disabled');
  } else if (pushSel.value() == 'Exempt') {
    text('Strength Score: Exempt', 85, 175);
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
    text('Abs Score: ' + sscore + '  |  Min: ' + sitmin + "  |  Max: " + sitmax, 85, 275);
    situps.removeAttribute('disabled');
    rsitups.removeAttribute('disabled');
    planks.removeAttribute('disabled');
    sittxt.removeAttribute('disabled');
    rsittxt.removeAttribute('disabled');
    plankmintxt.removeAttribute('disabled');
    planksectxt.removeAttribute('disabled');
  } else if (sitSel.value() == 'Plank') {
    text('Abs Score: ' + sscore + '  |  Min: ' + plankString(plankmin) + "  |  Max: " + plankString(plankmax), 85, 275);
    situps.removeAttribute('disabled');
    rsitups.removeAttribute('disabled');
    planks.removeAttribute('disabled');
    sittxt.removeAttribute('disabled');
    rsittxt.removeAttribute('disabled');
    plankmintxt.removeAttribute('disabled');
    planksectxt.removeAttribute('disabled');
  } else if (sitSel.value() == 'Reverse Crunch') {
    text('Abs Score: ' + sscore + '  |  Min: ' + rsitmin + "  |  Max: " + rsitmax, 85, 275);
    situps.removeAttribute('disabled');
    rsitups.removeAttribute('disabled');
    planks.removeAttribute('disabled');
    sittxt.removeAttribute('disabled');
    rsittxt.removeAttribute('disabled');
    plankmintxt.removeAttribute('disabled');
    planksectxt.removeAttribute('disabled');
  } else if (sitSel.value() == 'Exempt') {
    text('Abs Score: Exempt', 85, 275);
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
    text('Cardio Score: ' + rscore + '  |  Min: ' + plankString(runmin) + "  |  Max: " + plankString(runmax), 85, 375);
    runtime.removeAttribute('disabled');
    runmintxt.removeAttribute('disabled');
    if (runmintxt.value() == 0) {runmintxt.value(runMinimum.minutes);}
    runsectxt.removeAttribute('disabled');
    shuttleRun.removeAttribute('disabled');
    shuttletxt.removeAttribute('disabled');
  } else if (runSel.value() == 'Shuttle') {
    text('Cardio Score: ' + rscore + '  |  Min: ' + shuttleMin + "  |  Max: " + shuttleMax, 85, 375);
    runtime.removeAttribute('disabled');
    runmintxt.removeAttribute('disabled');
    runsectxt.removeAttribute('disabled');
    shuttleRun.removeAttribute('disabled');
    shuttletxt.removeAttribute('disabled');
  } else if (runSel.value() == 'Exempt') {
    text('Cardio Score: Exempt', 85, 375);
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
  line(10,150,410,150);
  stroke(0);
  strokeWeight(1);
  
  stroke('white');
  strokeWeight(2);
  line(10,350,410,350);
  stroke(0);
  strokeWeight(1);
  
  stroke('white');
  strokeWeight(2);
  line(10,250,410,250);
  stroke(0);
  strokeWeight(.5);
  

  textSize(20);
  fill('white');
  stroke('white');
  if (runSel.value()=='1.5 Mile') {
    text(":", 336, 423);
    runmintxt.show();
    runsectxt.show();
    shuttletxt.hide();
    lapTime=runTime(floor(runtime.value()/6));
    text("Req'd 6 Lap Time: ~" + lapTime.minutes +":" + nf(lapTime.sec,2), 10, 505);
    text("(Rounded down to nearest sec)", 10, 525);
    //textSize(15);
    for(var i=0; i<6; i++)
    {
    var lp=floor(runtime.value()/6)  // num secs per lap
    var nl=runTime(lp*(i+1));      // Next lap
     // console.log(nl);
    text("Lap " + int(i+1) + ": ≤ " + nl.minutes  +":" +nf(nl.sec,2), 10, 550+(i*20));    
    }
  } else if (runSel.value() == 'Shuttle') {
    text('Shuttle Level: ' + hamrLevel(), 10, 505);
    text('Current Level Shuttles: ' + hamrShuttles(), 10, 535);
  }
  pushnum=pushups.value();
  sitnum=situps.value();
  hrpushnum=hrpush.value();
  rsitnum=rsitups.value();
  runnum=runTime(runtime.value());
  plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec,2);
  runValue = runTime(runtime.value()).minutes + ":" + nf(runTime(runtime.value()).sec,2);
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
    text(":", 356, 323);
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
  text('Total Score: ' + total.toFixed(1), 125,35)
  if (totalScoreText == 'FAIL! Minimum Not Met!') {
    text(totalScoreText, 85,65)
  } else if (totalScoreText == "Unsatisfactory!") {
    text(totalScoreText, 125,65)
  } else if (totalScoreText == "Satisfactory!") {
    text(totalScoreText, 135,65)
  } else if (totalScoreText == "Excellent!") { 
    text(totalScoreText, 155,65)
  }
  
  
  
function hamrLevel() {
  
  var hamrLevels = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  
  var level = 5;
  
  if (shuttleRun.value() >= 95) level=hamrLevels[0]; //level 11
  else if (shuttleRun.value() >= 84 && shuttleRun.value() <95) level=hamrLevels[1]; //level 10
  else if (shuttleRun.value() >= 73 && shuttleRun.value() <84) level=hamrLevels[2]; //level 9
  else if (shuttleRun.value() >= 62 && shuttleRun.value() <73) level=hamrLevels[3]; //level 8
  else if (shuttleRun.value() >= 52 && shuttleRun.value() <62) level=hamrLevels[4]; //level 7
  else if (shuttleRun.value() >= 42 && shuttleRun.value() <52) level=hamrLevels[5]; //level 6
  else if (shuttleRun.value() >= 33 && shuttleRun.value() <42) level=hamrLevels[6]; //level 5
  else if (shuttleRun.value() >= 24 && shuttleRun.value() <33) level=hamrLevels[7]; //level 4
  else if (shuttleRun.value() >= 16 && shuttleRun.value() <24) level=hamrLevels[8]; //level 3
  else if (shuttleRun.value() >= 8 && shuttleRun.value() <16) level=hamrLevels[9]; //level 2
  if (shuttleRun.value() >= 0 && shuttleRun.value() <8) level=hamrLevels[10]; //level 1
  
  
  return level
}
  
function hamrShuttles() {
  
  var shuttles = 1;
  
  var levelMax = [7, 15, 23, 32, 41, 52, 61, 72, 83, 94, 106];
  
  if (hamrLevel() == 1) shuttles = shuttleRun.value() - levelMax[0] +7;
  if (hamrLevel() == 2) shuttles = shuttleRun.value() - levelMax[1] +8;
  if (hamrLevel() == 3) shuttles = shuttleRun.value() - levelMax[2] +8;
  if (hamrLevel() == 4) shuttles = shuttleRun.value() - levelMax[3] +9;
  if (hamrLevel() == 5) shuttles = shuttleRun.value() - levelMax[4] +9;
  if (hamrLevel() == 6) shuttles = shuttleRun.value() - levelMax[5] +11;
  if (hamrLevel() == 7) shuttles = shuttleRun.value() - levelMax[6] +10;
  if (hamrLevel() == 8) shuttles = shuttleRun.value() - levelMax[7] +11;
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
seconds=secs- (minutes*60);
  //console.log(seconds);
  
var tot = new Time(minutes, seconds);
  
return tot; 
}

function runScore(secs)
{
  var runPoints = [];
  var age = ageSel.value();
  var points = 0;
  
  if (age == 'Male 18-24') {
    runPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46.5, 44, 41, 38, 35, 0];
    if (secs<= 552)points=runPoints[0];
    else if (secs<= 574) points=runPoints[1];
    else if (secs<= 585) points=runPoints[2];
    else if (secs<= 598) points=runPoints[3];
    else if (secs<= 610) points=runPoints[4]
    else if (secs<= 623) points=runPoints[5];
    else if (secs<= 637) points=runPoints[6];
    else if (secs<= 651) points=runPoints[7];
    else if (secs<= 666) points=runPoints[8];
    else if (secs<= 682) points=runPoints[9];
    else if (secs<= 698) points=runPoints[10];
    else if (secs<= 716) points=runPoints[11];
    else if (secs<= 734) points=runPoints[12];
    else if (secs<= 753) points=runPoints[13];
    else if (secs<= 773) points=runPoints[14];
    else if (secs<= 794) points=runPoints[15];
    else if (secs<= 816) points=runPoints[16];
    else if (secs<= 840) points=runPoints[17];
    else if (secs<= 865) points=runPoints[18];
    else if (secs<= 892) points=runPoints[19];
    else if (secs<= 920) points=runPoints[20];
    else if (secs<= 950) points=runPoints[21];
    if (secs> 950) points=runPoints[22];
  } else if (age == 'Male 25-29') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46.5, 44, 41, 38, 35, 0];
  
    if (secs<= 562)points=runPoints[0];
    else if (secs<= 585) points=runPoints[1];
    else if (secs<= 598) points=runPoints[2];
    else if (secs<= 610) points=runPoints[3]
    else if (secs<= 623) points=runPoints[4];
    else if (secs<= 637) points=runPoints[5];
    else if (secs<= 651) points=runPoints[6];
    else if (secs<= 666) points=runPoints[7];
    else if (secs<= 682) points=runPoints[8];
    else if (secs<= 698) points=runPoints[9];
    else if (secs<= 716) points=runPoints[10];
    else if (secs<= 734) points=runPoints[11];
    else if (secs<= 753) points=runPoints[12];
    else if (secs<= 773) points=runPoints[13];
    else if (secs<= 794) points=runPoints[14];
    else if (secs<= 816) points=runPoints[15];
    else if (secs<= 840) points=runPoints[16];
    else if (secs<= 865) points=runPoints[17];
    else if (secs<= 892) points=runPoints[18];
    else if (secs<= 920) points=runPoints[19];
    else if (secs<= 950) points=runPoints[20];
    else if (secs<= 982) points=runPoints[21];  
    if (secs> 982) points=runPoints[22];
  } else if (age == 'Male 30-34') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 43, 40.5, 38, 35, 0];
    
    if (secs<= 574)points=runPoints[0];
    else if (secs<= 598) points=runPoints[1];
    else if (secs<= 610) points=runPoints[2]
    else if (secs<= 623) points=runPoints[3];
    else if (secs<= 637) points=runPoints[4];
    else if (secs<= 651) points=runPoints[5];
    else if (secs<= 666) points=runPoints[6];
    else if (secs<= 682) points=runPoints[7];
    else if (secs<= 698) points=runPoints[8];
    else if (secs<= 716) points=runPoints[9];
    else if (secs<= 734) points=runPoints[10];
    else if (secs<= 753) points=runPoints[11];
    else if (secs<= 773) points=runPoints[12];
    else if (secs<= 794) points=runPoints[13];
    else if (secs<= 816) points=runPoints[14];
    else if (secs<= 840) points=runPoints[15];
    else if (secs<= 865) points=runPoints[16];
    else if (secs<= 892) points=runPoints[17];
    else if (secs<= 920) points=runPoints[18];
    else if (secs<= 950) points=runPoints[19];
    else if (secs<= 982) points=runPoints[20]; 
    else if (secs<= 1017) points=runPoints[21];   
    if (secs> 1017) points=runPoints[22];
  } else if (age == 'Male 35-39') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 43, 40.5, 38, 35, 0];
    
    if (secs<= 585)points=runPoints[0];
    else if (secs<= 610) points=runPoints[1]
    else if (secs<= 623) points=runPoints[2];
    else if (secs<= 637) points=runPoints[3];
    else if (secs<= 651) points=runPoints[4];
    else if (secs<= 666) points=runPoints[5];
    else if (secs<= 682) points=runPoints[6];
    else if (secs<= 698) points=runPoints[7];
    else if (secs<= 716) points=runPoints[8];
    else if (secs<= 734) points=runPoints[9];
    else if (secs<= 753) points=runPoints[10];
    else if (secs<= 773) points=runPoints[11];
    else if (secs<= 794) points=runPoints[12];
    else if (secs<= 816) points=runPoints[13];
    else if (secs<= 840) points=runPoints[14];
    else if (secs<= 865) points=runPoints[15];
    else if (secs<= 892) points=runPoints[16];
    else if (secs<= 920) points=runPoints[17];
    else if (secs<= 950) points=runPoints[18];
    else if (secs<= 982) points=runPoints[19]; 
    else if (secs<= 1017) points=runPoints[20];
    else if (secs<= 1053) points=runPoints[21];  
    if (secs> 1053) points=runPoints[22];
  } else if (age == 'Male 40-44') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46.5, 44, 41, 38, 35, 0];
    
    if (secs<= 598)points=runPoints[0];
    else if (secs<= 623) points=runPoints[1];
    else if (secs<= 637) points=runPoints[2];
    else if (secs<= 651) points=runPoints[3];
    else if (secs<= 666) points=runPoints[4];
    else if (secs<= 682) points=runPoints[5];
    else if (secs<= 698) points=runPoints[6];
    else if (secs<= 716) points=runPoints[7];
    else if (secs<= 734) points=runPoints[8];
    else if (secs<= 753) points=runPoints[9];
    else if (secs<= 773) points=runPoints[10];
    else if (secs<= 794) points=runPoints[11];
    else if (secs<= 816) points=runPoints[12];
    else if (secs<= 840) points=runPoints[13];
    else if (secs<= 865) points=runPoints[14];
    else if (secs<= 892) points=runPoints[15];
    else if (secs<= 920) points=runPoints[16];
    else if (secs<= 950) points=runPoints[17];
    else if (secs<= 982) points=runPoints[18]; 
    else if (secs<= 1017) points=runPoints[19];
    else if (secs<= 1053) points=runPoints[20];
    else if (secs<= 1094) points=runPoints[21];
    if (secs> 1094) points=runPoints[22];
  } else if(age == 'Male 45-49') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46.5, 44, 41, 38, 35, 0];
    
    if (secs<= 610)points=runPoints[0];
    else if (secs<= 623) points=runPoints[1];
    else if (secs<= 651) points=runPoints[2];
    else if (secs<= 666) points=runPoints[3];
    else if (secs<= 682) points=runPoints[4];
    else if (secs<= 698) points=runPoints[5];
    else if (secs<= 716) points=runPoints[6];
    else if (secs<= 734) points=runPoints[7];
    else if (secs<= 753) points=runPoints[8];
    else if (secs<= 773) points=runPoints[9];
    else if (secs<= 794) points=runPoints[10];
    else if (secs<= 816) points=runPoints[11];
    else if (secs<= 840) points=runPoints[12];
    else if (secs<= 865) points=runPoints[13];
    else if (secs<= 892) points=runPoints[14];
    else if (secs<= 920) points=runPoints[15];
    else if (secs<= 950) points=runPoints[16];
    else if (secs<= 982) points=runPoints[17]; 
    else if (secs<= 1017) points=runPoints[18];
    else if (secs<= 1053) points=runPoints[19];
    else if (secs<= 1094) points=runPoints[20];
    else if (secs<= 1136) points=runPoints[21];  
    if (secs> 1136) points=runPoints[22];
  } else if(age == 'Male 50-54') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 43, 40.5, 38, 35, 0];
    
    if (secs<= 637)points=runPoints[0];
    else if (secs<= 666) points=runPoints[1];
    else if (secs<= 682) points=runPoints[2];
    else if (secs<= 698) points=runPoints[3];
    else if (secs<= 716) points=runPoints[4];
    else if (secs<= 734) points=runPoints[5];
    else if (secs<= 753) points=runPoints[6];
    else if (secs<= 773) points=runPoints[7];
    else if (secs<= 794) points=runPoints[8];
    else if (secs<= 816) points=runPoints[9];
    else if (secs<= 840) points=runPoints[10];
    else if (secs<= 865) points=runPoints[11];
    else if (secs<= 892) points=runPoints[12];
    else if (secs<= 920) points=runPoints[13];
    else if (secs<= 950) points=runPoints[14];
    else if (secs<= 982) points=runPoints[15]; 
    else if (secs<= 1017) points=runPoints[16];
    else if (secs<= 1054) points=runPoints[17];
    else if (secs<= 1094) points=runPoints[18];
    else if (secs<= 1136) points=runPoints[19];
    else if (secs<= 1183) points=runPoints[20];
    else if (secs<= 1233) points=runPoints[21];   
    if (secs> 1233) points=runPoints[22];
  } else if(age == 'Male 55-59') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 43, 40.5, 38, 35, 0];
    
    if (secs<= 651)points=runPoints[0];
    else if (secs<= 682) points=runPoints[1];
    else if (secs<= 698) points=runPoints[2];
    else if (secs<= 716) points=runPoints[3];
    else if (secs<= 734) points=runPoints[4];
    else if (secs<= 753) points=runPoints[5];
    else if (secs<= 773) points=runPoints[6];
    else if (secs<= 794) points=runPoints[7];
    else if (secs<= 816) points=runPoints[8];
    else if (secs<= 840) points=runPoints[9];
    else if (secs<= 865) points=runPoints[10];
    else if (secs<= 892) points=runPoints[11];
    else if (secs<= 920) points=runPoints[12];
    else if (secs<= 950) points=runPoints[13];
    else if (secs<= 982) points=runPoints[14]; 
    else if (secs<= 1017) points=runPoints[15];
    else if (secs<= 1053) points=runPoints[16];
    else if (secs<= 1094) points=runPoints[17];
    else if (secs<= 1136) points=runPoints[18];
    else if (secs<= 1183) points=runPoints[19];
    else if (secs<= 1233) points=runPoints[20];
    else if (secs<= 1288) points=runPoints[21];     
    if (secs> 1288) points=runPoints[22];
  } else if(age == 'Male >60') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 52.5, 51, 49.5, 47, 44.5, 41.5, 38.5, 35, 0];
    
    if (secs<= 682)points=runPoints[0];
    else if (secs<= 716) points=runPoints[1];
    else if (secs<= 734) points=runPoints[2];
    else if (secs<= 753) points=runPoints[3];
    else if (secs<= 773) points=runPoints[4];
    else if (secs<= 794) points=runPoints[5];
    else if (secs<= 816) points=runPoints[6];
    else if (secs<= 840) points=runPoints[7];
    else if (secs<= 865) points=runPoints[8];
    else if (secs<= 892) points=runPoints[9];
    else if (secs<= 920) points=runPoints[10];
    else if (secs<= 950) points=runPoints[11];
    else if (secs<= 982) points=runPoints[12]; 
    else if (secs<= 1017) points=runPoints[13];
    else if (secs<= 1054) points=runPoints[14];
    else if (secs<= 1094) points=runPoints[15];
    else if (secs<= 1136) points=runPoints[16];
    else if (secs<= 1183) points=runPoints[17];
    else if (secs<= 1233) points=runPoints[18];
    else if (secs<= 1288) points=runPoints[19];     
    else if (secs<= 1348) points=runPoints[20]; 
    if (secs> 1348) points=runPoints[21];
    
  } else if (age == 'Female 18-24') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46, 42.5, 39, 35, 0];
    
    if (secs<= 623)points=runPoints[0];
    else if (secs<= 651) points=runPoints[1];
    else if (secs<= 666) points=runPoints[2];
    else if (secs<= 682) points=runPoints[3];
    else if (secs<= 698) points=runPoints[4]
    else if (secs<= 716) points=runPoints[5];
    else if (secs<= 734) points=runPoints[6];
    else if (secs<= 753) points=runPoints[7];
    else if (secs<= 773) points=runPoints[8];
    else if (secs<= 794) points=runPoints[9];
    else if (secs<= 816) points=runPoints[10];
    else if (secs<= 840) points=runPoints[11];
    else if (secs<= 865) points=runPoints[12];
    else if (secs<= 892) points=runPoints[13];
    else if (secs<= 920) points=runPoints[14];
    else if (secs<= 950) points=runPoints[15];
    else if (secs<= 982) points=runPoints[16];
    else if (secs<= 1017) points=runPoints[17];
    else if (secs<= 1054) points=runPoints[18];
    else if (secs<= 1094) points=runPoints[19];
    else if (secs<= 1136) points=runPoints[20];
    //else if (secs<= 950) points=runPoints[21];
    if (secs> 1136) points=runPoints[21];
    
  } else if (age == 'Female 25-29') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 45.5, 42, 38.5, 35, 0];
      
    if (secs<= 637)points=runPoints[0];
    else if (secs<= 666) points=runPoints[1];
    else if (secs<= 682) points=runPoints[2];
    else if (secs<= 698) points=runPoints[3]
    else if (secs<= 716) points=runPoints[4];
    else if (secs<= 734) points=runPoints[5];
    else if (secs<= 753) points=runPoints[6];
    else if (secs<= 773) points=runPoints[7];
    else if (secs<= 794) points=runPoints[8];
    else if (secs<= 816) points=runPoints[9];
    else if (secs<= 840) points=runPoints[10];
    else if (secs<= 865) points=runPoints[11];
    else if (secs<= 892) points=runPoints[12];
    else if (secs<= 920) points=runPoints[13];
    else if (secs<= 950) points=runPoints[14];
    else if (secs<= 982) points=runPoints[15];
    else if (secs<= 1017) points=runPoints[16];
    else if (secs<= 1053) points=runPoints[17];
    else if (secs<= 1094) points=runPoints[18];
    else if (secs<= 1136) points=runPoints[19];
    else if (secs<= 1183) points=runPoints[20];
    if (secs> 1183) points=runPoints[21];
    
  } else if (age == 'Female 30-34') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 52.5, 51, 49.5, 47, 44.5, 42, 38.5, 35, 0];
    
    if (secs<= 651)points=runPoints[0];
    else if (secs<= 682) points=runPoints[1];
    else if (secs<= 698) points=runPoints[2]
    else if (secs<= 716) points=runPoints[3];
    else if (secs<= 734) points=runPoints[4];
    else if (secs<= 753) points=runPoints[5];
    else if (secs<= 773) points=runPoints[6];
    else if (secs<= 794) points=runPoints[7];
    else if (secs<= 816) points=runPoints[8];
    else if (secs<= 840) points=runPoints[9];
    else if (secs<= 865) points=runPoints[10];
    else if (secs<= 892) points=runPoints[11];
    else if (secs<= 920) points=runPoints[12];
    else if (secs<= 950) points=runPoints[13];
    else if (secs<= 982) points=runPoints[14];
    else if (secs<= 1017) points=runPoints[15];
    else if (secs<= 1054) points=runPoints[16];
    else if (secs<= 1094) points=runPoints[17];
    else if (secs<= 1136) points=runPoints[18];
    else if (secs<= 1183) points=runPoints[19];
    else if (secs<= 1233) points=runPoints[20];  
    if (secs> 1233) points=runPoints[21];
    
  } else if (age == 'Female 35-39') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 52.5, 51, 49.5, 47, 44, 41, 38, 35, 0];
    
    if (secs<= 666)points=runPoints[0];
    else if (secs<= 698) points=runPoints[1]
    else if (secs<= 716) points=runPoints[2];
    else if (secs<= 734) points=runPoints[3];
    else if (secs<= 753) points=runPoints[4];
    else if (secs<= 773) points=runPoints[5];
    else if (secs<= 794) points=runPoints[6];
    else if (secs<= 816) points=runPoints[7];
    else if (secs<= 840) points=runPoints[8];
    else if (secs<= 865) points=runPoints[9];
    else if (secs<= 892) points=runPoints[10];
    else if (secs<= 920) points=runPoints[11];
    else if (secs<= 950) points=runPoints[12];
    else if (secs<= 982) points=runPoints[13];
    else if (secs<= 1017) points=runPoints[14];
    else if (secs<= 1053) points=runPoints[15];
    else if (secs<= 1094) points=runPoints[16];
    else if (secs<= 1136) points=runPoints[17];
    else if (secs<= 1183) points=runPoints[18];
    else if (secs<= 1233) points=runPoints[19];
    else if (secs<= 1288) points=runPoints[20];  
    if (secs> 1288) points=runPoints[21];
    
  } else if (age == 'Female 40-44') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 42, 38.5, 35, 0];
    
    if (secs<= 682)points=runPoints[0];
    else if (secs<= 716) points=runPoints[1];
    else if (secs<= 734) points=runPoints[2];
    else if (secs<= 753) points=runPoints[3];
    else if (secs<= 773) points=runPoints[4];
    else if (secs<= 794) points=runPoints[5];
    else if (secs<= 816) points=runPoints[6];
    else if (secs<= 840) points=runPoints[7];
    else if (secs<= 865) points=runPoints[8];
    else if (secs<= 892) points=runPoints[9];
    else if (secs<= 920) points=runPoints[10];
    else if (secs<= 950) points=runPoints[11];
    else if (secs<= 982) points=runPoints[12];
    else if (secs<= 1017) points=runPoints[13];
    else if (secs<= 1053) points=runPoints[14];
    else if (secs<= 1094) points=runPoints[15];
    else if (secs<= 1136) points=runPoints[16];
    else if (secs<= 1183) points=runPoints[17];
    else if (secs<= 1233) points=runPoints[18];
    else if (secs<= 1288) points=runPoints[19];  
    else if (secs<= 1348) points=runPoints[20];    
    if (secs> 1348) points=runPoints[21];
    
  } else if (age == 'Female 45-49') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45, 42, 38.5, 35, 0];
    
    if (secs<= 698)points=runPoints[0];
    else if (secs<= 734) points=runPoints[1];
    else if (secs<= 753) points=runPoints[2];
    else if (secs<= 773) points=runPoints[3];
    else if (secs<= 794) points=runPoints[4];
    else if (secs<= 816) points=runPoints[5];
    else if (secs<= 840) points=runPoints[6];
    else if (secs<= 865) points=runPoints[7];
    else if (secs<= 892) points=runPoints[8];
    else if (secs<= 920) points=runPoints[9];
    else if (secs<= 950) points=runPoints[10];
    else if (secs<= 982) points=runPoints[11];
    else if (secs<= 1017) points=runPoints[12];
    else if (secs<= 1053) points=runPoints[13];
    else if (secs<= 1094) points=runPoints[14];
    else if (secs<= 1136) points=runPoints[15];
    else if (secs<= 1183) points=runPoints[16];
    else if (secs<= 1233) points=runPoints[17];
    else if (secs<= 1288) points=runPoints[18];  
    else if (secs<= 1348) points=runPoints[19];
    else if (secs<= 1414) points=runPoints[20];  
    if (secs> 1414) points=runPoints[21];
    
  } else if (age == 'Female 50-54') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 53.5, 52, 49.5, 46, 42.5, 39, 35, 0];
    
    if (secs<= 773)points=runPoints[0];
    else if (secs<= 816) points=runPoints[1];
    else if (secs<= 840) points=runPoints[2];
    else if (secs<= 865) points=runPoints[3];
    else if (secs<= 892) points=runPoints[4];
    else if (secs<= 920) points=runPoints[5];
    else if (secs<= 950) points=runPoints[6];
    else if (secs<= 982) points=runPoints[7];
    else if (secs<= 1017) points=runPoints[8];
    else if (secs<= 1053) points=runPoints[9];
    else if (secs<= 1094) points=runPoints[10];
    else if (secs<= 1136) points=runPoints[11];
    else if (secs<= 1183) points=runPoints[12];
    else if (secs<= 1233) points=runPoints[13];
    else if (secs<= 1288) points=runPoints[14];  
    else if (secs<= 1348) points=runPoints[15];
    else if (secs<= 1414) points=runPoints[16];
    else if (secs<= 1486) points=runPoints[17];   
    if (secs> 1486) points=runPoints[18];
    
  } else if (age == 'Female 55-59') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 53.5, 52, 49, 46, 43, 39, 35, 0];
    
    if (secs<= 794)points=runPoints[0];
    else if (secs<= 840) points=runPoints[1];
    else if (secs<= 865) points=runPoints[2];
    else if (secs<= 892) points=runPoints[3];
    else if (secs<= 920) points=runPoints[4];
    else if (secs<= 950) points=runPoints[5];
    else if (secs<= 982) points=runPoints[6];
    else if (secs<= 1017) points=runPoints[7];
    else if (secs<= 1053) points=runPoints[8];
    else if (secs<= 1094) points=runPoints[9];
    else if (secs<= 1136) points=runPoints[10];
    else if (secs<= 1183) points=runPoints[11];
    else if (secs<= 1233) points=runPoints[12];
    else if (secs<= 1288) points=runPoints[13];  
    else if (secs<= 1348) points=runPoints[14];
    else if (secs<= 1414) points=runPoints[15];
    else if (secs<= 1486) points=runPoints[16];
    else if (secs<= 1566) points=runPoints[17];
    if (secs> 1566) points=runPoints[18];
    
  } else if (age == 'Female >60') {
    runPoints=[60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 54, 52.5, 51, 47, 43, 39, 35, 0];
    
    if (secs<= 840)points=runPoints[0];
    else if (secs<= 892) points=runPoints[1];
    else if (secs<= 920) points=runPoints[2];
    else if (secs<= 950) points=runPoints[3];
    else if (secs<= 982) points=runPoints[4];
    else if (secs<= 1017) points=runPoints[5];
    else if (secs<= 1054) points=runPoints[6];
    else if (secs<= 1094) points=runPoints[7];
    else if (secs<= 1136) points=runPoints[8];
    else if (secs<= 1183) points=runPoints[9];
    else if (secs<= 1233) points=runPoints[10];
    else if (secs<= 1288) points=runPoints[11];  
    else if (secs<= 1348) points=runPoints[12];
    else if (secs<= 1414) points=runPoints[13];
    else if (secs<= 1486) points=runPoints[14];
    else if (secs<= 1566) points=runPoints[15];
    else if (secs<= 1647) points=runPoints[16];  
    if (secs> 1647) points=runPoints[17];
  }
  
  return points; 
}

function plankScore(secs) {
  var plankPoint=[];
  var plankpoints = 0;
  var age = ageSel.value();
  
  //This function converts time string to seconds so I dont have to do the math for the times. I wish i would've thought of this before all the run times but it will be implemented in female planks and shuttles.
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
  
  if (age == 'Male 18-24') {
      plankPoint=[20.0, 19.7, 19.3, 18.9, 18.5, 18.0, 16.7, 15.3, 14.0, 13.3, 11.3, 10.0];
    
    if (secs>= 215) plankpoints=plankPoint[0]; //3:35
    else if (secs>= 210) plankpoints=plankPoint[1]; //3:30
    else if (secs>= 205) plankpoints=plankPoint[2]; //3:25
    else if (secs>= 198) plankpoints=plankPoint[3];  //3:18
    else if (secs>= 192) plankpoints=plankPoint[4]; //3:12
    else if (secs>= 185) plankpoints=plankPoint[5]; //3:05
    else if (secs>= 165) plankpoints=plankPoint[6]; //2:45
    else if (secs>= 145) plankpoints=plankPoint[7]; //2:25
    else if (secs>= 125) plankpoints=plankPoint[8]; //2:05
    else if (secs>= 115) plankpoints=plankPoint[9]; //1:55
    else if (secs>= 85) plankpoints=plankPoint[10]; //1:25
    else if (secs>= 65) plankpoints=plankPoint[11]; //1:05
    
  } else if (age == 'Male 25-29') {
    plankPoint=[20.0, 19.7, 19.3, 18.9, 18.2, 18.0, 16.7, 15.3, 14.0, 12.7, 11.3, 10.0];
    
    if (secs>= 210) plankpoints=plankPoint[0];
    else if (secs>= 205) plankpoints=plankPoint[1];
    else if (secs>= 200) plankpoints=plankPoint[2];
    else if (secs>= 194) plankpoints=plankPoint[3];
    else if (secs>= 183) plankpoints=plankPoint[4];
    else if (secs>= 180) plankpoints=plankPoint[5];
    else if (secs>= 160) plankpoints=plankPoint[6];
    else if (secs>= 140) plankpoints=plankPoint[7];
    else if (secs>= 120) plankpoints=plankPoint[8];
    else if (secs>= 100) plankpoints=plankPoint[9];
    else if (secs>= 80) plankpoints=plankPoint[10];
    else if (secs>= 60) plankpoints=plankPoint[11];
    
  } else if (age == 'Male 30-34') {
    plankPoint=[20.0, 19.7, 19.3, 18.9, 18.5, 18.0, 16.7, 15.3, 14.0, 12.7, 11.3, 10.0];
    
    if (secs>= 210) plankpoints=plankPoint[0]; //3:25
    else if (secs>= 200) plankpoints=plankPoint[1]; //3:20
    else if (secs>= 195) plankpoints=plankPoint[2]; //3:15
    else if (secs>= 189) plankpoints=plankPoint[3]; //3:09
    else if (secs>= 182) plankpoints=plankPoint[4]; //3:02
    else if (secs>= 175) plankpoints=plankPoint[5]; //2:55
    else if (secs>= 155) plankpoints=plankPoint[6]; //2:35
    else if (secs>= 135) plankpoints=plankPoint[7]; //2:15
    else if (secs>= 115) plankpoints=plankPoint[8]; //1:55
    else if (secs>= 95) plankpoints=plankPoint[9]; // 1:35
    else if (secs>= 75) plankpoints=plankPoint[10]; //1:15
    else if (secs>= 55) plankpoints=plankPoint[11]; //0:55
    
  } else if (age == 'Male 35-39') {
    plankPoint=[20.0, 19.7, 19.3, 18.9, 18.5, 18.0, 16.7, 15.3, 14.0, 12.7, 11.3, 10.0];
    
    if (secs>= 200) plankpoints=plankPoint[0]; //3:20 
    else if (secs>= 195) plankpoints=plankPoint[1]; //3:15 
    else if (secs>= 190) plankpoints=plankPoint[2]; //3:10 
    else if (secs>= 184) plankpoints=plankPoint[3]; //3:04 
    else if (secs>= 177) plankpoints=plankPoint[4]; //2:57 
    else if (secs>= 170) plankpoints=plankPoint[5]; //2:50 
    else if (secs>= 150) plankpoints=plankPoint[6]; //2:30 
    else if (secs>= 130) plankpoints=plankPoint[7]; //2:10 
    else if (secs>= 110) plankpoints=plankPoint[8]; //1:50 
    else if (secs>= 90) plankpoints=plankPoint[9]; //1:30 
    else if (secs>= 70) plankpoints=plankPoint[10]; //1:10 
    else if (secs>= 50) plankpoints=plankPoint[11]; //0:50 
    
  } else if (age == 'Male 40-44') {
    plankPoint=[20.0, 19.7, 19.3, 18.9, 18.5, 18.0, 16.7, 15.3, 14.0, 12.7, 11.3, 10.0];
    
    if (secs>= 195) plankpoints=plankPoint[0]; //3:15 5
    else if (secs>= 190) plankpoints=plankPoint[1]; //3:10 5
    else if (secs>= 185) plankpoints=plankPoint[2]; //3:05 5
    else if (secs>= 179) plankpoints=plankPoint[3]; //2:59 5
    else if (secs>= 172) plankpoints=plankPoint[4]; //2:52 5
    else if (secs>= 165) plankpoints=plankPoint[5]; //2:45 5
    else if (secs>= 145) plankpoints=plankPoint[6]; //2:25 5
    else if (secs>= 125) plankpoints=plankPoint[7]; //2:05 5
    else if (secs>= 105) plankpoints=plankPoint[8]; //1:45 5
    else if (secs>= 85) plankpoints=plankPoint[9]; //1:25 5
    else if (secs>= 65) plankpoints=plankPoint[10]; //1:05 5
    else if (secs>= 45) plankpoints=plankPoint[11]; //0:45 5
    
  } else if (age == 'Male 45-49') {
    plankPoint=[20.0, 19.7, 19.3, 18.9, 18.5, 18.0, 16.7, 15.3, 14.0, 12.7, 11.3, 10.0];
    
    if (secs>= 195-5) plankpoints=plankPoint[0]; //3:10 5
    else if (secs>= 190-5) plankpoints=plankPoint[1]; //3:05 5
    else if (secs>= 185-5) plankpoints=plankPoint[2]; //3:00 5
    else if (secs>= 179-5) plankpoints=plankPoint[3]; //2:54 5
    else if (secs>= 172-5) plankpoints=plankPoint[4]; //2:47 5
    else if (secs>= 165-5) plankpoints=plankPoint[5]; //2:40 5
    else if (secs>= 145-5) plankpoints=plankPoint[6]; //2:20 5
    else if (secs>= 125-5) plankpoints=plankPoint[7]; //2:00 5
    else if (secs>= 105-5) plankpoints=plankPoint[8]; //1:40 5
    else if (secs>= 85-5) plankpoints=plankPoint[9]; //1:20 5
    else if (secs>= 65-5) plankpoints=plankPoint[10]; //1:00 5
    else if (secs>= 45-5) plankpoints=plankPoint[11]; //0:40 5
    
  } else if (age == 'Male 50-54') {
    plankPoint=[20.0, 19.7, 19.3, 18.9, 18.5, 18.0, 16.7, 15.3, 14.0, 12.7, 11.3, 10.0];
    
    if (secs>= 190) plankpoints=plankPoint[0]; //3:10 5
    else if (secs>= 185-5) plankpoints=plankPoint[1]; //3:05 5
    else if (secs>= 180-5) plankpoints=plankPoint[2]; //3:00 5
    else if (secs>= 172-5) plankpoints=plankPoint[3]; //2:54 5
    else if (secs>= 167-5) plankpoints=plankPoint[4]; //2:47 5
    else if (secs>= 160-5) plankpoints=plankPoint[5]; //2:40 5
    else if (secs>= 140-5) plankpoints=plankPoint[6]; //2:20 5
    else if (secs>= 120-5) plankpoints=plankPoint[7]; //2:00 5
    else if (secs>= 100-5) plankpoints=plankPoint[8]; //1:40 5
    else if (secs>= 80-5) plankpoints=plankPoint[9]; //1:20 5
    else if (secs>= 60-5) plankpoints=plankPoint[10]; //1:00 5
    else if (secs>= 40-5) plankpoints=plankPoint[11]; //0:40 5
    
  } else if (age == 'Male 55-59') {
    plankPoint=[20.0, 19.7, 19.3, 18.9, 18.5, 18.0, 16.7, 15.3, 14.0, 12.7, 11.3, 10.0];
    
    if (secs>= 180) plankpoints=plankPoint[0]; //3:10 5
    else if (secs>= 175) plankpoints=plankPoint[1]; //3:05 5
    else if (secs>= 170) plankpoints=plankPoint[2]; //3:00 5
    else if (secs>= 162) plankpoints=plankPoint[3]; //2:54 5
    else if (secs>= 157) plankpoints=plankPoint[4]; //2:47 5
    else if (secs>= 150) plankpoints=plankPoint[5]; //2:40 5
    else if (secs>= 130) plankpoints=plankPoint[6]; //2:20 5
    else if (secs>= 110) plankpoints=plankPoint[7]; //2:00 5
    else if (secs>= 90) plankpoints=plankPoint[8]; //1:40 5
    else if (secs>= 70) plankpoints=plankPoint[9]; //1:20 5
    else if (secs>= 50) plankpoints=plankPoint[10]; //1:00 5
    else if (secs>= 30) plankpoints=plankPoint[11]; //0:40 5
    
  } else if (age == 'Male >60') {
    plankPoint=[20.0, 19.7, 19.3, 18.9, 18.5, 18.0, 16.7, 16.0, 14.0, 12.7, 11.3, 10.0];
    
    if (secs>= 175) plankpoints=plankPoint[0]; 
    else if (secs>= 170) plankpoints=plankPoint[1]; 
    else if (secs>= 165) plankpoints=plankPoint[2]; 
    else if (secs>= 159) plankpoints=plankPoint[3]; //2:39
    else if (secs>= 152) plankpoints=plankPoint[4]; 
    else if (secs>= 145) plankpoints=plankPoint[5]; 
    else if (secs>= 125) plankpoints=plankPoint[6]; 
    else if (secs>= 115) plankpoints=plankPoint[7]; 
    else if (secs>= 85) plankpoints=plankPoint[8]; 
    else if (secs>= 65) plankpoints=plankPoint[9]; 
    else if (secs>= 45) plankpoints=plankPoint[10]; 
    else if (secs>= 25) plankpoints=plankPoint[11]; 
    
  } else if (age == 'Female 18-24') {
      plankPoint=[20.0,19.0,18.7,18.5,18.3,15.9,15.2,14.4,12.1,11.3,10.5,10.3,10.0];
    if (secs>= 210) plankpoints=plankPoint[0];
    else if (secs>= 205) plankpoints=plankPoint[1]; 
    else if (secs>= 198) plankpoints=plankPoint[2]; 
    else if (secs>= 192) plankpoints=plankPoint[3]; 
    else if (secs>= 185) plankpoints=plankPoint[4];  
    else if (secs>= 165) plankpoints=plankPoint[5];
    else if (secs>= 145) plankpoints=plankPoint[6];
    else if (secs>= 125) plankpoints=plankPoint[7]; 
    else if (secs>= 105) plankpoints=plankPoint[8]; 
    else if (secs>= 85) plankpoints=plankPoint[9]; 
    else if (secs>= 65) plankpoints=plankPoint[10]; 
    else if (secs>= 60) plankpoints=plankPoint[11]; 
    else if (secs>= hms(':55')) plankpoints=plankPoint[12];
    
  } else if (age == 'Female 25-29') {
    plankPoint=[20.0, 19.8,19.6,19.3,19.1,16.9,16.2,15.5,13.3,12.5,11.8,10.2,10.0];
    if (secs>= hms('3:25')) plankpoints=plankPoint[0];
    else if (secs>= hms('3:20')) plankpoints=plankPoint[1];
    else if (secs>= hms('3:14')) plankpoints=plankPoint[2];
    else if (secs>= hms('3:07')) plankpoints=plankPoint[3];
    else if (secs>= hms('3:00')) plankpoints=plankPoint[4];
    else if (secs>= hms('2:40')) plankpoints=plankPoint[5];
    else if (secs>= hms('2:20')) plankpoints=plankPoint[6];
    else if (secs>= hms('2:00')) plankpoints=plankPoint[7];
    else if (secs>= hms('1:40')) plankpoints=plankPoint[8];
    else if (secs>= hms('1:20')) plankpoints=plankPoint[9];
    else if (secs>= hms('1:00')) plankpoints=plankPoint[10];
    else if (secs>= hms(':55')) plankpoints=plankPoint[11];
    else if (secs>= hms(':50')) plankpoints=plankPoint[12];
    
  } else if (age == 'Female 30-34') {
    plankPoint=[20.0,19.7,19.3,18.8,18.4,17.1,15.8,14.5,13.2,11.9,10.6,10.3,10.0];
    if (secs>= hms('3:20')) plankpoints=plankPoint[0];
    else if (secs>= hms('3:15')) plankpoints=plankPoint[1]; //3:25
    else if (secs>= hms('3:09')) plankpoints=plankPoint[2]; //3:20
    else if (secs>= hms('3:02')) plankpoints=plankPoint[3]; //3:15
    else if (secs>= hms('2:55')) plankpoints=plankPoint[4]; //3:09
    else if (secs>= hms('2:35')) plankpoints=plankPoint[5]; //3:02
    else if (secs>= hms('2:15')) plankpoints=plankPoint[6]; //2:55
    else if (secs>= hms('1:55')) plankpoints=plankPoint[7]; //2:35
    else if (secs>= hms('1:35')) plankpoints=plankPoint[8]; //2:15
    else if (secs>= hms('1:15')) plankpoints=plankPoint[9]; //1:55
    else if (secs>= hms('0:55')) plankpoints=plankPoint[10]; // 1:35
    else if (secs>= hms(':50')) plankpoints=plankPoint[11]; //1:15
    else if (secs>= hms(':45')) plankpoints=plankPoint[12]; //0:55
    
  } else if (age == 'Female 35-39') {
    plankPoint=[20.0,19.7,19.3,18.8,18.4,17.1,15.8,14.5,13.2,11.9,10.6,10.3,10.0];
    
    if (secs>= hms('3:15')) plankpoints=plankPoint[0];
    else if (secs>= hms('3:10')) plankpoints=plankPoint[1]; //3:25
    else if (secs>= hms('3:04')) plankpoints=plankPoint[2]; //3:20
    else if (secs>= hms('2:57')) plankpoints=plankPoint[3]; //3:15
    else if (secs>= hms('2:50')) plankpoints=plankPoint[4]; //3:09
    else if (secs>= hms('2:30')) plankpoints=plankPoint[5]; //3:02
    else if (secs>= hms('2:10')) plankpoints=plankPoint[6]; //2:55
    else if (secs>= hms('1:50')) plankpoints=plankPoint[7]; //2:35
    else if (secs>= hms('1:30')) plankpoints=plankPoint[8]; //2:15
    else if (secs>= hms('1:10')) plankpoints=plankPoint[9]; //1:55
    else if (secs>= hms('0:50')) plankpoints=plankPoint[10]; // 1:35
    else if (secs>= hms(':45')) plankpoints=plankPoint[11]; //1:15
    else if (secs>= hms(':40')) plankpoints=plankPoint[12]; //0:55 
    
  } else if (age == 'Female 40-44') {
    plankPoint=[20.0,19.7,19.3,18.8,18.4,17.1,15.8,14.5,13.2,11.9,10.6,10.3,10.0];
    
    if (secs>= hms('3:10')) plankpoints=plankPoint[0];
    else if (secs>= hms('3:05')) plankpoints=plankPoint[1]; //3:25
    else if (secs>= hms('2:59')) plankpoints=plankPoint[2]; //3:20
    else if (secs>= hms('2:52')) plankpoints=plankPoint[3]; //3:15
    else if (secs>= hms('2:45')) plankpoints=plankPoint[4]; //3:09
    else if (secs>= hms('2:25')) plankpoints=plankPoint[5]; //3:02
    else if (secs>= hms('2:05')) plankpoints=plankPoint[6]; //2:55
    else if (secs>= hms('1:45')) plankpoints=plankPoint[7]; //2:35
    else if (secs>= hms('1:25')) plankpoints=plankPoint[8]; //2:15
    else if (secs>= hms('1:05')) plankpoints=plankPoint[9]; //1:55
    else if (secs>= hms('0:45')) plankpoints=plankPoint[10]; // 1:35
    else if (secs>= hms(':40')) plankpoints=plankPoint[11]; //1:15
    else if (secs>= hms(':35')) plankpoints=plankPoint[12]; //0:55
    
  } else if (age == 'Female 45-49') {
    plankPoint=[20.0,19.7,19.3,18.8,18.4,17.1,15.8,14.5,13.2,11.9,10.6,10.3,10.0];
    
    if (secs>= hms('3:05')) plankpoints=plankPoint[0];
    else if (secs>= hms('3:00')) plankpoints=plankPoint[1]; //3:25
    else if (secs>= hms('2:54')) plankpoints=plankPoint[2]; //3:20
    else if (secs>= hms('2:47')) plankpoints=plankPoint[3]; //3:15
    else if (secs>= hms('2:40')) plankpoints=plankPoint[4]; //3:09
    else if (secs>= hms('2:20')) plankpoints=plankPoint[5]; //3:02
    else if (secs>= hms('2:00')) plankpoints=plankPoint[6]; //2:55
    else if (secs>= hms('1:40')) plankpoints=plankPoint[7]; //2:35
    else if (secs>= hms('1:20')) plankpoints=plankPoint[8]; //2:15
    else if (secs>= hms('1:00')) plankpoints=plankPoint[9]; //1:55
    else if (secs>= hms('0:40')) plankpoints=plankPoint[10]; // 1:35
    else if (secs>= hms(':35')) plankpoints=plankPoint[11]; //1:15
    else if (secs>= hms(':30')) plankpoints=plankPoint[12]; //0:55
    
  } else if (age == 'Female 50-54') {
    plankPoint=[20.0,19.7,19.3,18.8,18.4,17.1,15.8,14.5,13.2,11.9,10.6,10.3,10.0];
    
    if (secs>= hms('3:00')) plankpoints=plankPoint[0];
    else if (secs>= hms('2:55')) plankpoints=plankPoint[1]; //3:25
    else if (secs>= hms('2:49')) plankpoints=plankPoint[2]; //3:20
    else if (secs>= hms('2:42')) plankpoints=plankPoint[3]; //3:15
    else if (secs>= hms('2:35')) plankpoints=plankPoint[4]; //3:09
    else if (secs>= hms('2:15')) plankpoints=plankPoint[5]; //3:02
    else if (secs>= hms('1:55')) plankpoints=plankPoint[6]; //2:55
    else if (secs>= hms('1:35')) plankpoints=plankPoint[7]; //2:35
    else if (secs>= hms('1:15')) plankpoints=plankPoint[8]; //2:15
    else if (secs>= hms('0:55')) plankpoints=plankPoint[9]; //1:55
    else if (secs>= hms('0:35')) plankpoints=plankPoint[10]; // 1:35
    else if (secs>= hms(':30')) plankpoints=plankPoint[11]; //1:15
    else if (secs>= hms(':25')) plankpoints=plankPoint[12]; //0:55
    
  } else if (age == 'Female 55-59') {
    plankPoint=[20.0,19.7,19.3,18.8,18.4,17.1,15.8,14.5,13.2,11.9,10.6,10.3,10.0];
    
    if (secs>= hms('2:55')) plankpoints=plankPoint[0];
    else if (secs>= hms('2:50')) plankpoints=plankPoint[1]; //3:25
    else if (secs>= hms('2:44')) plankpoints=plankPoint[2]; //3:20
    else if (secs>= hms('2:37')) plankpoints=plankPoint[3]; //3:15
    else if (secs>= hms('2:30')) plankpoints=plankPoint[4]; //3:09
    else if (secs>= hms('2:10')) plankpoints=plankPoint[5]; //3:02
    else if (secs>= hms('1:50')) plankpoints=plankPoint[6]; //2:55
    else if (secs>= hms('1:30')) plankpoints=plankPoint[7]; //2:35
    else if (secs>= hms('1:10')) plankpoints=plankPoint[8]; //2:15
    else if (secs>= hms('0:50')) plankpoints=plankPoint[9]; //1:55
    else if (secs>= hms('0:30')) plankpoints=plankPoint[10]; // 1:35
    else if (secs>= hms(':25')) plankpoints=plankPoint[11]; //1:15
    else if (secs>= hms(':20')) plankpoints=plankPoint[12]; //0:55
    
  } else if (age == 'Female >60') {
    plankPoint=[20.0,19.7,19.3,18.8,18.4,17.1,15.8,14.5,13.2,11.9,10.6,10.3,10.0];
    
    if (secs>= hms('2:50')) plankpoints=plankPoint[0];
    else if (secs>= hms('2:45')) plankpoints=plankPoint[1]; //3:25
    else if (secs>= hms('2:39')) plankpoints=plankPoint[2]; //3:20
    else if (secs>= hms('2:32')) plankpoints=plankPoint[3]; //3:15
    else if (secs>= hms('2:25')) plankpoints=plankPoint[4]; //3:09
    else if (secs>= hms('2:05')) plankpoints=plankPoint[5]; //3:02
    else if (secs>= hms('1:45')) plankpoints=plankPoint[6]; //2:55
    else if (secs>= hms('1:25')) plankpoints=plankPoint[7]; //2:35
    else if (secs>= hms('1:05')) plankpoints=plankPoint[8]; //2:15
    else if (secs>= hms('0:30')) plankpoints=plankPoint[9]; //1:55
    else if (secs>= hms('0:25')) plankpoints=plankPoint[10]; // 1:35
    else if (secs>= hms(':20')) plankpoints=plankPoint[11]; //1:15
    else if (secs>= hms(':15')) plankpoints=plankPoint[12]; //0:55 
    
  }
  
     
  
return plankpoints; 
}

function pushScore(pnum)
{
  var pushPoints = [];
  var ppoints = 0;
  var age = ageSel.value();
  
if(age == 'Male 18-24') {
  pushPoints=[20,19.8,19.6, 19.4, 19.2, 19.0, 18.8, 18.6, 18.4, 18.2, 18, 17.8, 17.6, 17.5, 17.4, 17.2, 17, 16.8, 16.6, 16.2, 16, 15.6, 15.4, 15, 14.6, 14.4, 14, 13.6, 13, 12.6, 12, 11.6, 11, 10.6, 10, 7, 4, 1,0];
} else if(age == 'Male 25-29') {
  pushPoints=[20, 19.7, 19.4, 19, 18.8, 18.6, 18.4, 18.2, 18, 17.8, 17.6, 17.5, 17.4, 17.2, 17, 16.8, 16.6, 16.2, 16, 15.6, 15.4, 15, 14.6, 14.4, 14, 13.6, 13, 12.6, 12, 11.6, 11, 10.6, 10, 7, 4,1];
} else if(age == 'Male 30-34') {
  pushPoints=[20, 19.8, 19.6, 19.4, 19.2, 19, 18.8, 18.6, 18.5, 18.4, 18.2, 18, 17.8, 17.6, 17.4, 17.2, 17, 16.6, 16, 15.6, 15.4, 15, 14.6, 14, 13.6, 13.4, 13, 12, 11, 10.6, 10, 7, 4, 1];
} else if(age == 'Male 35-39') {
  pushPoints=[20, 19.5, 19, 18.8, 18.6,18.5, 18.4, 18.2, 18, 17.8, 17.6, 17.4, 17.2, 17, 16.6, 16, 15.6, 15.4, 15, 14.6, 14, 13.6, 13.4, 13, 12, 11, 10.6, 10, 7, 4, 1];
} else if(age == 'Male 40-44') {
  pushPoints=[20, 19.7, 19.4, 19.2, 19, 18.8, 18.4, 18.2, 18, 17.6, 17, 16.8, 16.6, 16.2, 16, 15, 14.6, 14.4, 14, 13, 12, 11.6, 11, 10, 7, 4, 1];
} else if(age == 'Male 45-49') {
  pushPoints=[20, 19.8, 19.6, 19.4, 19.2, 19, 18.8, 18.4, 18.2, 18, 17.6, 17, 16.8, 16.6, 16.2, 16, 15, 14.6, 14.4, 14, 13, 12.6, 12, 11.6, 11, 10.6, 10, 7, 4, 1];
} else if(age == 'Male 50-54') {
  pushPoints=[20, 19.8, 19.6, 19.4, 19.2, 19, 18.9, 18.8, 18.7, 18.6, 18.5, 18.4, 18.3, 18.2, 18, 17.6, 17, 16.6, 16.4, 16, 15, 14.6, 14.4, 14, 13, 12, 11.6, 11, 10.6, 10, 7, 4, 1];
} else if(age == 'Male 55-59') {
  pushPoints=[20, 19.5,  19,  18.6, 18, 17.8, 17.6, 17.4, 17, 16.8,  16.6, 16.2, 16, 15.6, 15, 14.6, 14,  13.6, 13, 12.6, 12, 11.6, 10, 7, 4, 1];
} else if(age == 'Male >60') {
  pushPoints=[20, 19.5,  19,  18.6, 18, 17.6, 17, 16, 15, 14, 13, 12.6, 12, 11.6, 11, 10.6, 10, 7, 4, 1];
} else if(age == 'Female 18-24') {
  pushPoints=[20, 19.8, 19.6, 19.4, 19.2, 19, 18.8, 18.6, 18.4, 18.2, 18, 17.8, 17.6, 17.2, 17, 16.8, 16.6, 16.4, 16.2, 16, 15, 14.6, 14.4, 14, 13, 12.6, 12, 11.6, 11, 10, 7, 4, 1];
} else if(age == 'Female 25-29') {
  pushPoints=[20, 19.8, 19.6, 19.4, 19.2, 19, 18.8, 18.6, 18.4, 18.2, 18, 17.8, 17.6, 17.2, 17, 16.8, 16.6, 16.4, 16.2, 16, 15, 14.6, 14.4, 14, 13, 12.6, 12, 11.6, 11, 10.6, 10, 7, 4, 1];
} else if(age == 'Female 30-34') {
  pushPoints=[20, 19.9, 19.8, 19.6, 19.4, 19.2, 19, 18.8, 18.7, 18.6, 18.4, 18.2, 18.1, 18, 17.9, 17.8, 17.6, 17.4, 17.3, 17.2, 17, 16.6, 16.4, 16, 15.8, 15.6, 15.2, 15, 14, 13.6, 13, 12, 10, 7, 4, 1];
} else if(age == 'Female 35-39') {
  pushPoints=[20, 19.7, 19.4, 19, 18.8, 18.7, 18.6, 18.4, 18.2, 18.1, 18, 17.9, 17.8, 17.6, 17.4, 17.3, 17.2, 17, 16.6, 16.4, 16, 15.8, 15.6, 15.2, 15, 14, 13.6, 13, 12, 10, 7, 4, 1];
} else if(age == 'Female 40-44') {
  pushPoints=[20,19.8,19.6,19.4,19.2,19.0,18.8,18.4,18.2,18.0,17.8,17.6,17.4,17.3,17.2,17.0,16.8,16.6,16.4,16.2,16.0,15.6,15.5,14.0,13.0,12.0,11.0,10.0,7.0,4.0,1.0];
} else if(age == 'Female 45-49') {
  pushPoints=[20,19.8,19.6,19.4,19.2,19.0,18.8,18.6,18.4,18.2,18.0,17.8,17.6,17.4,17.2,17.0,16.8,16.6,16.4,16.2,16.0,15.6,15.0,14.0,13.0,12.0,11.0,10.0,7.0,4.0,1.0];
} else if(age == 'Female 50-54') {
  pushPoints=[20.0,19.8,19.6,19.4,19.2,19.0,18.8,18.6,18.4,18.2,18.0,17.6,17.4,17.3,17.2,17.0,16.8,16.6,16.4,16.2,16.0,15.0,14.0,13.0,12.0,11.0,10.0,7.0,4.0,1.0];
} else if(age == 'Female 55-59') {
  pushPoints=[20.0,19.7,19.4,19.2,19.0,18.6,18.0,17.6,17.2,17.0,16.8,16.6,16.4,16.2,16.0,15.0,14.0,13.0,12.0,11.0,10.0,7.0,4.0,1.0];
} else if(age == 'Female >60') {
  pushPoints=[20.0,19.5,19.0,18.8,18.0,17.6,17.0,16.0,15.0,14.0,13.0,12.0,11.4,10.6,10.0,7.0,4.0,1.0];
}
if((pnum>=pushmin) && (pnum<=pushmax))
{
ppoints=pushPoints[pushmax-pnum];  
}

return ppoints; 
}

function hrpushScore(hrpnum) {
  var hrpushPoints = [];
  var hrppoints = 0;
  var age = ageSel.value();
  
  if (age == 'Male 18-24') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Male 25-29') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Male 30-34') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Male 35-39') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Male 40-44') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Male 45-49') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Male 50-54') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.3, 17.9, 17.5, 17.1, 16.7, 16.3, 15.8, 15.4, 15.0, 14.6, 14.2, 13.8, 13.3, 12.9, 12.5, 12.1, 11.7, 11.3, 10.8, 10.4, 10,];  } else if (age == 'Male 55-59') {
    hrpushPoints = [20.0, 19.6, 19.1, 18.7, 18.3, 17.8, 17.4, 17.0, 16.5, 16.1, 15.7, 15.2, 14.8, 14.3, 13.9, 13.5, 13.0, 12.6, 12.2, 11.7, 11.3, 10.9, 10.4, 10.0];
  } else if (age == 'Male >60') {
    hrpushPoints = [20.0, 19.5, 19.0, 18.5, 18.0, 17.5, 17.0, 16.5, 16.0, 15.5, 15.0, 14.5, 14.0, 13.5, 13.0, 12.5, 12.0, 11.5, 11.0, 10.5, 10.0];
  } else if (age == 'Female 18-24') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Female 25-29') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Female 30-24') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Female 35-39') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.4, 10.0];
  } else if (age == 'Female 40-44') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.0];
  } else if (age == 'Female 45-49') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.0];
  } else if (age == 'Female 50-54') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.0];  
  } else if (age == 'Female 55-59') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.8, 10.0];
  } else if (age == 'Female >60') {
    hrpushPoints = [20.0, 19.6, 19.2, 18.8, 18.4, 18.0, 17.6, 17.2, 16.8, 16.4, 16.0, 15.6, 15.2, 14.8, 14.4, 14.0, 13.6, 13.2, 12.8, 12.4, 12.0, 11.6, 11.2, 10.0];
  }
  
  if((hrpnum>=hrmin) && (hrpnum<=hrmax))
  {
  hrppoints=hrpushPoints[hrmax-hrpnum];  
  }
  return hrppoints;
}

function sitScore(snum)
{
  var sitPoints = [];
  var spoints = 0;
  age = ageSel.value();
if (age == 'Male 18-24') {
    sitPoints=[20, 19.5, 19, 18.8, 18.4, 18, 17.6, 17.4, 17, 16.6, 16, 15, 14, 13, 12.8, 12, 9, 6, 3];
} else if (age == 'Male 25-29') {
  sitPoints=[20, 19.5, 19, 18.8, 18.4, 18, 17.6, 17.4, 17, 16.6, 16, 15, 14, 13, 12.8, 12, 9, 6, 3];
} else if (age == 'Male 30-34') {
  sitPoints=[20, 19.7, 19.4, 19, 18.8, 18.4, 18, 17.6, 17.4, 17, 16.6, 16, 15, 14, 13, 12, 9, 6, 3];
} else if (age == 'Male 35-39') {
  sitPoints=[20, 19.7, 19.4, 19, 18.8, 18.4, 18, 17.6, 17.4, 17, 16.6, 16, 15, 14, 13, 12, 9, 6, 3];
}else if (age == 'Male 40-44') {
  sitPoints=[20, 19.7, 19.4, 19, 18.8, 18.4, 18.2, 18, 17.6, 17.4, 17, 16, 15.6, 15, 14, 13, 12, 9, 6, 3];
}else if (age == 'Male 45-49') {
  sitPoints=[20, 19.7, 19.4, 19.2, 19, 18.8, 18.4, 18, 17.6, 17.4, 17, 16.6, 16, 15.6, 15, 14, 13, 12, 9, 6, 3];
}else if (age == 'Male 50-54') {
  sitPoints=[20, 19.7, 19.4, 19, 18.8, 18.4, 18.2, 18, 17.6, 17.4, 17, 16, 15.6, 15, 14.6, 14, 13, 12.6, 12, 9, 6, 3];
}else if (age == 'Male 55-59') {
  sitPoints=[20, 19.7, 19.4, 19, 18.8, 18.4, 18.2, 18, 17.6, 17.4, 17, 16, 15.6, 15, 14.6, 14, 13.6, 13, 12.6, 12, 9, 6, 3];
}else if (age == 'Male >60') {
  sitPoints=[20, 19.7, 19.4, 19, 18.8, 18.4, 18.2, 18, 17.8, 17.6, 17.2, 17, 16, 15.6, 15, 14.6, 14, 13.6, 13, 12.6, 12, 9, 6, 3];
} else if (age == 'Female 18-24') {
    sitPoints=[20, 19.7, 19.4, 19, 18.8, 18, 17.8, 17.6, 17.2, 17, 16, 15.6, 15, 14, 13.6, 13, 12, 9, 6, 3];
} else if (age == 'Female 25-29') {
  sitPoints=[20, 19.5, 19, 18.8, 18, 17.8, 17.2, 17, 16, 15.6, 15, 14.6, 14, 13.6, 13, 12.6, 12, 9, 6, 3];
} else if (age == 'Female 30-34') {
  sitPoints=[20,  19.7, 19.4, 19, 18.8, 18, 17.6, 17, 16.6, 16.4, 16, 15.6, 15, 14, 13.6, 13, 12, 9, 6, 3];
} else if (age == 'Female 35-39') {
  sitPoints=[20,  19.7, 19.4, 19, 18.8, 18, 17.6, 17, 16.6, 16.4, 16, 15.6, 15, 14, 13.6, 13, 12, 9, 6, 3];
}else if (age == 'Female 40-44') {
  sitPoints=[20, 19.7, 19.4, 19, 18.8, 18.4, 18.2, 18, 17.6, 17, 16.6, 16.4, 16, 15, 14, 13.6, 12.8, 12, 9, 6, 3];
}else if (age == 'Female 45-49') {
  sitPoints=[20, 19.7, 19.4, 19, 18.8, 18.4, 18.2, 18, 17.6, 17, 16.6, 16.4, 16, 12, 9, 6, 3];
}else if (age == 'Female 50-54') {
  sitPoints=[20, 19.5, 19, 18, 17.8, 17.6, 17.2, 17, 16, 15, 14, 13, 12, 9, 6, 3];
}else if (age == 'Female 55-59') {
  sitPoints=[20, 19.7, 19.4, 19.2, 19, 18, 17.8, 17.6, 17.2, 17, 16, 15, 14.6, 14, 13.6, 13, 12.6, 12, 9, 6, 3];
}else if (age == 'Female >60') {
  sitPoints=[20, 19.7, 19.4, 19, 18.8, 18, 17.8, 17.6, 17.4, 17.2, 17, 16.8, 16.6, 16.4, 16, 15.6, 15, 14.6, 14, 13, 12, 9, 6, 3];
}

if((snum>=sitmin) && (snum<=sitmax))
{
spoints=sitPoints[sitmax-snum];  
}
   return spoints; 
}

function rsitScore(rsitnum) {
  var rsitPoints=[];
  var rspoints=0;
  var age = ageSel.value();
  if (age == 'Male 18-24') {
    rsitPoints=[20.0, 19.7, 19.4, 19.1, 18.8, 18.5, 18.2,17.9, 17.6, 17.3, 17.0, 16.7,16.4,16.1,15.8,15.5,15.2,14.8,14.5,14.2,13.9,13.6,13.3,13.0,12.7,12.4,12.1,11.8,11.5,11.2,10.9,10.6,10.3,10.0];
  } else if (age == 'Male 25-29') {
    rsitPoints=[20.0, 19.6,19.3,189,18.6,18.2,17.9,17.5,17.1,16.8,16.4,16.1,15.7,15.4,15.0,14.6,14.3,13.9,13.6,13.2,12.9,12.5,12.1,11.8,11.4,11.1,10.7,10.4,10.0];
  } else if (age == 'Male 30-34') {
    rsitPoints=[20.0, 19.6,19.3,18.9,18.6,18.2,17.9,17.5,17.1,16.8,16.4,16.1,15.7,15.4,15.0,14.6,14.3,13.9,13.6,13.2,12.9,12.5,12.1,11.8,11.4,11.1,10.7,10.4,10.0];
  } else if (age == 'Male 35-39') {
    rsitPoints=[20.0, 19.6,19.3,18.9,18.6,18.2,17.9,17.5,17.1,16.8,16.4,16.1,15.7,15.4,15.0,14.6,14.3,13.9,13.6,13.2,12.9,12.5,12.1,11.8,11.4,11.1,10.7,10.4,10.0];
  } else if (age == 'Male 40-44') {
    rsitPoints=[20.0, 19.6,19.3,18.9,18.6,18.2,17.9,17.5,17.1,16.8,16.4,16.1,15.7,15.4,15.0,14.6,14.3,13.9,13.6,13.2,12.9,12.5,12.1,11.8,11.4,11.1,10.7,10.4,10.0];
  } else if (age == 'Male 45-49') {
    rsitPoints=[20.0, 19.7,19.4,19.1,18.8,18.4,18.1,17.8,17.5,17.2,16.9,16.6,16.3,15.9,15.6,15.3,15.0,14.7,14.4,14.1,13.8,13.4,13.1,12.8,12.5,12.2,11.9,11.6,11.3,10.9,10.6,10.3,10.0];
  } else if (age == 'Male 50-54') {
    rsitPoints=[20.0, 19.7,19.4,19.1,18.8,18.5,18.2,17.9,17.6,17.3,17.0,16.7,16.4,16.1,15.8,15.5,15.2,14.8,14.5,14.2,13.9,13.6,13.3,13.0,12.7,12.4,12.1,11.8,11.5,11.2,10.9,10.6,10.3,10.0];
  } else if (age == 'Male 55-59') {
    rsitPoints=[20.0, 19.7,19.4,19.1,18.8,18.5,18.2,17.9,17.6,17.3,17.0,16.7,16.4,16.1,15.8,15.5,15.2,14.8,14.5,14,2,13.9,13.6,13.3,13.0,12.7,12.4,12.1,11.8,11.5,11.2,10.9,10.6,10.3,10.0];
  } else if (age == 'Male >60') {
    rsitPoints=[20.0, 19.6,19.3,18.9,18.6,18.2,17.9,17.5,17.1,16.8,16.4,16.1,15.7,15.4,15.0,14.6,14.3,13.9,13.6,13.2,12.9,12.5,12.1,11.8,11.4,11.1,10.7,10.4,10];
  } else if (age == 'Female 18-24') {
    rsitPoints=[20.0, 19.7, 19.4, 19.2, 18.9, 18.6, 18.3,18.1, 17.8, 17.5, 17.2, 16.9,16.7,16.4,16.1,15.8,15.6,15.3,15.0,14.7,14.4,14.2,13.9,13.6,13.3,13.1,12.8,12.5,12.2,11.9,11.7,11.4,11.1,10.8,10.6,10.3,10.0];
  } else if (age == 'Female 25-29') {
    rsitPoints=[20.0, 19.7, 19.4, 19.2, 18.9, 18.6, 18.3,18.1, 17.8, 17.5, 17.2, 16.9,16.7,16.4,16.1,15.8,15.6,15.3,15.0,14.7,14.4,14.2,13.9,13.6,13.3,13.1,12.8,12.5,12.2,11.9,11.7,11.4,11.1,10.8,10.6,10.3,10.0];
  } else if (age == 'Female 30-34') {
    rsitPoints=[20.0, 19.7, 19.4, 19.1, 18.9, 18.6, 18.3,18.0, 17.7, 17.4,17.1,16.9,16.6,16.3,16.0,15.7,15.4,15.1,14.9,14.6,14.3,14.0,13.7,13.4,13.1,12.9,12.6,12.3,12.0,11.7,11.4,11.1,10.9,10.6,10.3,10.0];
  } else if (age == 'Female 35-39') {
    rsitPoints=[20.0,19.7,19.4,19.2,18.9,18.6,18.3,18.1,17.8,17.5,17.2,16.9,16.7,16.4,16.1,15.8,15.6,15.3,15.0,14.7,14.4,14.2,13.9,13.6,13.3,13.1,12.8,12.5,12.2,11.9,11.7,11.4,11.1,10.8,10.6,10.3,10.0];
  } else if (age == 'Female 40-44') {
    rsitPoints=[20.0,19.7,19.4,19.2,18.9,18.6,18.3,18.1,17.8,17.5,17.2,16.9,16.7,16.4,16.1,15.8,15.6,15.3,15.0,14.7,14.4,14.2,13.9,13.6,13.3,13.1,12.8,12.5,12.2,11.9,11.7,11.4,11.1,10.8,10.6,10.3,10.0];
  } else if (age == 'Female 45-49') {
    rsitPoints=[20.0,19.7,19.4,19.1,18.8,18.5,18.2,17.9,17.6,17.4,17.1,16.8,16.5,16.2,15.9,15.6,15.3,15.0,14.7,14.4,14.1,13.8,13.5,13.2,12.9,12.6,12.4,12.1,11.8,11.5,11.2,10.9,10.6,10.3,10.0];
  } else if (age == 'Female 50-54') {
    rsitPoints=[20.0,19.7,19.4,19.1,18.8,18.5,18.2,17.9,17.6,17.3,17.0,16.7,16.4,16.1,15.8,15.5,15.2,14.8,14.5,14.2,13.9,13.6,13.3,13.0,12.7,12.4,12.1,11.8,11.5,11.2,10.9,10.6,10.3,10.0];
  } else if (age == 'Female 55-59') {
    rsitPoints=[20.0,19.7,19.4,19.1,18.8,18.4,18.1,17.8,17.5,17.2,16.9,16.6,16.3,15.9,15.6,15.3,15.0,14.7,14.4,14.1,13.8,13.4,13.1,12.8,12.5,12.2,11.9,11.6,11.3,10.9,10.6,10.3,10.0];
  } else if (age == 'Female >60') {
    rsitPoints=[20.0, 19.6,19.3,18.9,18.5,18.1,17.8,17.4,17.0,16.7,16.3,15.9,15.6,15.2,14.8,14.4,14.1,13.7,13.3,13.0,12.6,12.2,11.9,11.5,11.1,10.7,10.4,10.0];
  }
  
  
  
  if((rsitnum>=rsitmin) && (rsitnum<=rsitmax))
{
rspoints=rsitPoints[rsitmax-rsitnum];  
}
   return rspoints; 
}

function hamrScore() {
  var hamrPoints = [];
  var points = 0;
  var age = ageSel.value();
  
  if(age == 'Male 18-24') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46.5, 44, 41, 38, 35, 0];
  
  if (shuttleRun.value() >= 100) points=hamrPoints[0];
  else if (shuttleRun.value() >= 94) points=hamrPoints[1];
  else if (shuttleRun.value() >= 92) points=hamrPoints[2];
  else if (shuttleRun.value() >= 88) points=hamrPoints[3]
  else if (shuttleRun.value() >= 86) points=hamrPoints[4];
  else if (shuttleRun.value() >= 83) points=hamrPoints[5];
  else if (shuttleRun.value() >= 80) points=hamrPoints[6];
  else if (shuttleRun.value() >= 77) points=hamrPoints[7];
  else if (shuttleRun.value() >= 74) points=hamrPoints[8];
  else if (shuttleRun.value() >= 71) points=hamrPoints[9];
  else if (shuttleRun.value() >= 68) points=hamrPoints[10];
  else if (shuttleRun.value() >= 65) points=hamrPoints[11];
  else if (shuttleRun.value() >= 62) points=hamrPoints[12];
  else if (shuttleRun.value() >= 59) points=hamrPoints[13];
  else if (shuttleRun.value() >= 56) points=hamrPoints[14];
  else if (shuttleRun.value() >= 54) points=hamrPoints[15];
  else if (shuttleRun.value() >= 51) points=hamrPoints[16];
  else if (shuttleRun.value() >= 48) points=hamrPoints[17];
  else if (shuttleRun.value() >= 42) points=hamrPoints[18];
  else if (shuttleRun.value() >= 42) points=hamrPoints[19];
  else if (shuttleRun.value() >= 39) points=hamrPoints[20];
  else if (shuttleRun.value() >= 36) points=hamrPoints[21];  //level 5, 1 shuttle
  if (shuttleRun.value() < 36) points=hamrPoints[22];
  
  } else if (age == 'Male 25-29') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46.5, 44, 41, 38, 35, 0];
  
  if (shuttleRun.value() >= 97) points=hamrPoints[0];
  else if (shuttleRun.value() >= 92) points=hamrPoints[1];
  else if (shuttleRun.value() >= 88) points=hamrPoints[2];
  else if (shuttleRun.value() >= 86) points=hamrPoints[3]
  else if (shuttleRun.value() >= 83) points=hamrPoints[4];
  else if (shuttleRun.value() >= 80) points=hamrPoints[5];
  else if (shuttleRun.value() >= 77) points=hamrPoints[6];
  else if (shuttleRun.value() >= 74) points=hamrPoints[7];
  else if (shuttleRun.value() >= 71) points=hamrPoints[8];
  else if (shuttleRun.value() >= 68) points=hamrPoints[9];
  else if (shuttleRun.value() >= 65) points=hamrPoints[10];
  else if (shuttleRun.value() >= 62) points=hamrPoints[11];
  else if (shuttleRun.value() >= 59) points=hamrPoints[12];
  else if (shuttleRun.value() >= 56) points=hamrPoints[13];
  else if (shuttleRun.value() >= 54) points=hamrPoints[14];
  else if (shuttleRun.value() >= 51) points=hamrPoints[15];
  else if (shuttleRun.value() >= 48) points=hamrPoints[16];
  else if (shuttleRun.value() >= 45) points=hamrPoints[17];
  else if (shuttleRun.value() >= 42) points=hamrPoints[18];
  else if (shuttleRun.value() >= 39) points=hamrPoints[19];
  else if (shuttleRun.value() >= 36) points=hamrPoints[20];
  else if (shuttleRun.value() >= 33) points=hamrPoints[21];  //level 5, 1 shuttle
  if (shuttleRun.value() < 33) points=hamrPoints[22];
  
  } else if (age == 'Male 30-34') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 43, 40.5, 38, 35, 0];
  
  if (shuttleRun.value() >= 94) points=hamrPoints[0];
  else if (shuttleRun.value() >= 88) points=hamrPoints[1];
  else if (shuttleRun.value() >= 86) points=hamrPoints[2];
  else if (shuttleRun.value() >= 83) points=hamrPoints[3]
  else if (shuttleRun.value() >= 80) points=hamrPoints[4];
  else if (shuttleRun.value() >= 77) points=hamrPoints[5];
  else if (shuttleRun.value() >= 74) points=hamrPoints[6];
  else if (shuttleRun.value() >= 71) points=hamrPoints[7];
  else if (shuttleRun.value() >= 68) points=hamrPoints[8];
  else if (shuttleRun.value() >= 65) points=hamrPoints[9];
  else if (shuttleRun.value() >= 62) points=hamrPoints[10];
  else if (shuttleRun.value() >= 59) points=hamrPoints[11];
  else if (shuttleRun.value() >= 56) points=hamrPoints[12];
  else if (shuttleRun.value() >= 54) points=hamrPoints[13];
  else if (shuttleRun.value() >= 51) points=hamrPoints[14];
  else if (shuttleRun.value() >= 48) points=hamrPoints[15];
  else if (shuttleRun.value() >= 45) points=hamrPoints[16];
  else if (shuttleRun.value() >= 42) points=hamrPoints[17];
  else if (shuttleRun.value() >= 39) points=hamrPoints[18];
  else if (shuttleRun.value() >= 36) points=hamrPoints[19];
  else if (shuttleRun.value() >= 33) points=hamrPoints[20];
  else if (shuttleRun.value() >= 30) points=hamrPoints[21];  //level 5, 1 shuttle
  if (shuttleRun.value() < 30) points=hamrPoints[22];
  
  } else if (age == 'Male 35-39') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 43, 40.5, 38, 35, 0];
  
  if (shuttleRun.value() >= 92) points=hamrPoints[0];
  else if (shuttleRun.value() >= 87) points=hamrPoints[1];
  else if (shuttleRun.value() >= 83) points=hamrPoints[2];
  else if (shuttleRun.value() >= 80) points=hamrPoints[3]
  else if (shuttleRun.value() >= 77) points=hamrPoints[4];
  else if (shuttleRun.value() >= 74) points=hamrPoints[5];
  else if (shuttleRun.value() >= 71) points=hamrPoints[6];
  else if (shuttleRun.value() >= 68) points=hamrPoints[7];
  else if (shuttleRun.value() >= 65) points=hamrPoints[8];
  else if (shuttleRun.value() >= 62) points=hamrPoints[9];
  else if (shuttleRun.value() >= 59) points=hamrPoints[10];
  else if (shuttleRun.value() >= 56) points=hamrPoints[11];
  else if (shuttleRun.value() >= 54) points=hamrPoints[12];
  else if (shuttleRun.value() >= 51) points=hamrPoints[13];
  else if (shuttleRun.value() >= 48) points=hamrPoints[14];
  else if (shuttleRun.value() >= 45) points=hamrPoints[15];
  else if (shuttleRun.value() >= 42) points=hamrPoints[16];
  else if (shuttleRun.value() >= 39) points=hamrPoints[17];
  else if (shuttleRun.value() >= 36) points=hamrPoints[18];
  else if (shuttleRun.value() >= 33) points=hamrPoints[19];
  else if (shuttleRun.value() >= 30) points=hamrPoints[20];
  else if (shuttleRun.value() >= 27) points=hamrPoints[21];  //level 5, 1 shuttle
  if (shuttleRun.value() < 27) points=hamrPoints[22];
  
  } else if (age == 'Male 40-44') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46.5, 44, 41, 38, 35, 0];
  
  if (shuttleRun.value() >= 88) points=hamrPoints[0];
  else if (shuttleRun.value() >= 83) points=hamrPoints[1];
  else if (shuttleRun.value() >= 80) points=hamrPoints[2];
  else if (shuttleRun.value() >= 77) points=hamrPoints[3]
  else if (shuttleRun.value() >= 74) points=hamrPoints[4];
  else if (shuttleRun.value() >= 71) points=hamrPoints[5];
  else if (shuttleRun.value() >= 68) points=hamrPoints[6];
  else if (shuttleRun.value() >= 65) points=hamrPoints[7];
  else if (shuttleRun.value() >= 62) points=hamrPoints[8];
  else if (shuttleRun.value() >= 59) points=hamrPoints[9];
  else if (shuttleRun.value() >= 56) points=hamrPoints[10];
  else if (shuttleRun.value() >= 54) points=hamrPoints[11];
  else if (shuttleRun.value() >= 51) points=hamrPoints[12];
  else if (shuttleRun.value() >= 48) points=hamrPoints[13];
  else if (shuttleRun.value() >= 45) points=hamrPoints[14];
  else if (shuttleRun.value() >= 42) points=hamrPoints[15];
  else if (shuttleRun.value() >= 39) points=hamrPoints[16];
  else if (shuttleRun.value() >= 36) points=hamrPoints[17];
  else if (shuttleRun.value() >= 33) points=hamrPoints[18];
  else if (shuttleRun.value() >= 30) points=hamrPoints[19];
  else if (shuttleRun.value() >= 27) points=hamrPoints[20];
  else if (shuttleRun.value() >= 24) points=hamrPoints[21];  //level 5, 1 shuttle
  if (shuttleRun.value() < 24) points=hamrPoints[22];
 
  } else if (age == 'Male 45-49') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46.5, 44, 41, 38, 35, 0];
  
  if (shuttleRun.value() >= 86) points=hamrPoints[0];
  else if (shuttleRun.value() >= 80) points=hamrPoints[1];
  else if (shuttleRun.value() >= 77) points=hamrPoints[2];
  else if (shuttleRun.value() >= 74) points=hamrPoints[3]
  else if (shuttleRun.value() >= 71) points=hamrPoints[4];
  else if (shuttleRun.value() >= 68) points=hamrPoints[5];
  else if (shuttleRun.value() >= 65) points=hamrPoints[6];
  else if (shuttleRun.value() >= 62) points=hamrPoints[7];
  else if (shuttleRun.value() >= 59) points=hamrPoints[8];
  else if (shuttleRun.value() >= 56) points=hamrPoints[9];
  else if (shuttleRun.value() >= 54) points=hamrPoints[10];
  else if (shuttleRun.value() >= 51) points=hamrPoints[11];
  else if (shuttleRun.value() >= 48) points=hamrPoints[12];
  else if (shuttleRun.value() >= 45) points=hamrPoints[13];
  else if (shuttleRun.value() >= 42) points=hamrPoints[14];
  else if (shuttleRun.value() >= 39) points=hamrPoints[15];
  else if (shuttleRun.value() >= 36) points=hamrPoints[16];
  else if (shuttleRun.value() >= 33) points=hamrPoints[17];
  else if (shuttleRun.value() >= 30) points=hamrPoints[18];
  else if (shuttleRun.value() >= 27) points=hamrPoints[19];
  else if (shuttleRun.value() >= 24) points=hamrPoints[20];
  else if (shuttleRun.value() >= 22) points=hamrPoints[21];  //level 5, 1 shuttle
  if (shuttleRun.value() < 22) points=hamrPoints[22];
 
  } else if (age == 'Male 50-54') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 43, 40.5, 38, 35, 0];
  
  if (shuttleRun.value() >= 80) points=hamrPoints[0];
  else if (shuttleRun.value() >= 74) points=hamrPoints[1];
  else if (shuttleRun.value() >= 71) points=hamrPoints[2];
  else if (shuttleRun.value() >= 68) points=hamrPoints[3]
  else if (shuttleRun.value() >= 65) points=hamrPoints[4];
  else if (shuttleRun.value() >= 62) points=hamrPoints[5];
  else if (shuttleRun.value() >= 59) points=hamrPoints[6];
  else if (shuttleRun.value() >= 56) points=hamrPoints[7];
  else if (shuttleRun.value() >= 54) points=hamrPoints[8];
  else if (shuttleRun.value() >= 51) points=hamrPoints[9];
  else if (shuttleRun.value() >= 48) points=hamrPoints[10];
  else if (shuttleRun.value() >= 45) points=hamrPoints[11];
  else if (shuttleRun.value() >= 42) points=hamrPoints[12];
  else if (shuttleRun.value() >= 39) points=hamrPoints[13];
  else if (shuttleRun.value() >= 36) points=hamrPoints[14];
  else if (shuttleRun.value() >= 33) points=hamrPoints[15];
  else if (shuttleRun.value() >= 30) points=hamrPoints[16];
  else if (shuttleRun.value() >= 27) points=hamrPoints[17];
  else if (shuttleRun.value() >= 24) points=hamrPoints[18];
  else if (shuttleRun.value() >= 22) points=hamrPoints[19];
  else if (shuttleRun.value() >= 19) points=hamrPoints[20];
  else if (shuttleRun.value() >= 16) points=hamrPoints[21];  //level 5, 1 shuttle
  if (shuttleRun.value() < 16) points=hamrPoints[22];
 
  } else if (age == 'Male 55-59') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 43, 40.5, 38, 35, 0];
  
  if (shuttleRun.value() >= 77) points=hamrPoints[0];
  else if (shuttleRun.value() >= 71) points=hamrPoints[1];
  else if (shuttleRun.value() >= 68) points=hamrPoints[2];
  else if (shuttleRun.value() >= 65) points=hamrPoints[3]
  else if (shuttleRun.value() >= 62) points=hamrPoints[4];
  else if (shuttleRun.value() >= 59) points=hamrPoints[5];
  else if (shuttleRun.value() >= 56) points=hamrPoints[6];
  else if (shuttleRun.value() >= 54) points=hamrPoints[7];
  else if (shuttleRun.value() >= 51) points=hamrPoints[8];
  else if (shuttleRun.value() >= 48) points=hamrPoints[9];
  else if (shuttleRun.value() >= 45) points=hamrPoints[10];
  else if (shuttleRun.value() >= 42) points=hamrPoints[11];
  else if (shuttleRun.value() >= 39) points=hamrPoints[12];
  else if (shuttleRun.value() >= 36) points=hamrPoints[13];
  else if (shuttleRun.value() >= 33) points=hamrPoints[14];
  else if (shuttleRun.value() >= 30) points=hamrPoints[15];
  else if (shuttleRun.value() >= 27) points=hamrPoints[16];
  else if (shuttleRun.value() >= 24) points=hamrPoints[17];
  else if (shuttleRun.value() >= 22) points=hamrPoints[18];
  else if (shuttleRun.value() >= 19) points=hamrPoints[19];
  else if (shuttleRun.value() >= 16) points=hamrPoints[20];
  else if (shuttleRun.value() >= 13) points=hamrPoints[21];  //level 5, 1 shuttle
  if (shuttleRun.value() < 13) points=hamrPoints[22];
 
  } else if (age == 'Male >60') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 52.5, 51, 49.5, 47, 44.5, 41.5, 38.5, 35, 0];
  
  if (shuttleRun.value() >= 71) points=hamrPoints[0];
  else if (shuttleRun.value() >= 65) points=hamrPoints[1];
  else if (shuttleRun.value() >= 62) points=hamrPoints[2];
  else if (shuttleRun.value() >= 59) points=hamrPoints[3]
  else if (shuttleRun.value() >= 56) points=hamrPoints[4];
  else if (shuttleRun.value() >= 54) points=hamrPoints[5];
  else if (shuttleRun.value() >= 51) points=hamrPoints[6];
  else if (shuttleRun.value() >= 48) points=hamrPoints[7];
  else if (shuttleRun.value() >= 45) points=hamrPoints[8];
  else if (shuttleRun.value() >= 42) points=hamrPoints[9];
  else if (shuttleRun.value() >= 39) points=hamrPoints[10];
  else if (shuttleRun.value() >= 36) points=hamrPoints[11];
  else if (shuttleRun.value() >= 33) points=hamrPoints[12];
  else if (shuttleRun.value() >= 30) points=hamrPoints[13];
  else if (shuttleRun.value() >= 27) points=hamrPoints[14];
  else if (shuttleRun.value() >= 24) points=hamrPoints[15];
  else if (shuttleRun.value() >= 22) points=hamrPoints[16];
  else if (shuttleRun.value() >= 19) points=hamrPoints[17];
  else if (shuttleRun.value() >= 16) points=hamrPoints[18];
  else if (shuttleRun.value() >= 13) points=hamrPoints[19];
  else if (shuttleRun.value() >= 10) points=hamrPoints[20];
  if (shuttleRun.value() < 10) points=hamrPoints[21];  
  
 
  } else if(age == 'Female 18-24') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 46, 42.5, 39, 35, 0];
  
  if (shuttleRun.value() >= 83) points=hamrPoints[0];
  else if (shuttleRun.value() >= 77) points=hamrPoints[1];
  else if (shuttleRun.value() >= 74) points=hamrPoints[2]
  else if (shuttleRun.value() >= 71) points=hamrPoints[3];
  else if (shuttleRun.value() >= 68) points=hamrPoints[4];
  else if (shuttleRun.value() >= 65) points=hamrPoints[5];
  else if (shuttleRun.value() >= 62) points=hamrPoints[6];
  else if (shuttleRun.value() >= 59) points=hamrPoints[7];
  else if (shuttleRun.value() >= 56) points=hamrPoints[8];
  else if (shuttleRun.value() >= 54) points=hamrPoints[9];
  else if (shuttleRun.value() >= 51) points=hamrPoints[10];
  else if (shuttleRun.value() >= 48) points=hamrPoints[11];
  else if (shuttleRun.value() >= 45) points=hamrPoints[12];
  else if (shuttleRun.value() >= 42) points=hamrPoints[13];
  else if (shuttleRun.value() >= 39) points=hamrPoints[14];
  else if (shuttleRun.value() >= 36) points=hamrPoints[15];
  else if (shuttleRun.value() >= 33) points=hamrPoints[16];
  else if (shuttleRun.value() >= 30) points=hamrPoints[17];
  else if (shuttleRun.value() >= 27) points=hamrPoints[18];
  else if (shuttleRun.value() >= 24) points=hamrPoints[19];
  else if (shuttleRun.value() >= 22) points=hamrPoints[20];  //level 5, 1 shuttle
  if (shuttleRun.value() < 22) points=hamrPoints[21];
  
  } else if (age == 'Female 25-29') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 49, 45.5, 42, 38.5, 35, 0];
  
  
  if (shuttleRun.value() >= 80) points=hamrPoints[0];
  else if (shuttleRun.value() >= 74) points=hamrPoints[1];
  else if (shuttleRun.value() >= 71) points=hamrPoints[2]
  else if (shuttleRun.value() >= 68) points=hamrPoints[3];
  else if (shuttleRun.value() >= 65) points=hamrPoints[4];
  else if (shuttleRun.value() >= 62) points=hamrPoints[5];
  else if (shuttleRun.value() >= 59) points=hamrPoints[6];
  else if (shuttleRun.value() >= 56) points=hamrPoints[7];
  else if (shuttleRun.value() >= 54) points=hamrPoints[8];
  else if (shuttleRun.value() >= 51) points=hamrPoints[9];
  else if (shuttleRun.value() >= 48) points=hamrPoints[10];
  else if (shuttleRun.value() >= 45) points=hamrPoints[11];
  else if (shuttleRun.value() >= 42) points=hamrPoints[12];
  else if (shuttleRun.value() >= 39) points=hamrPoints[13];
  else if (shuttleRun.value() >= 36) points=hamrPoints[14];
  else if (shuttleRun.value() >= 33) points=hamrPoints[15];
  else if (shuttleRun.value() >= 30) points=hamrPoints[16];
  else if (shuttleRun.value() >= 27) points=hamrPoints[17];
  else if (shuttleRun.value() >= 24) points=hamrPoints[18];
  else if (shuttleRun.value() >= 22) points=hamrPoints[19];
  else if (shuttleRun.value() >= 19) points=hamrPoints[20];  //level 5, 1 shuttle
  if (shuttleRun.value() < 19) points=hamrPoints[21];
  
  } else if (age == 'Female 30-34') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 52.5, 51, 49.5, 47, 44.5, 42, 38.5, 35, 0];
  
  if (shuttleRun.value() >= 77) points=hamrPoints[0];
  else if (shuttleRun.value() >= 71) points=hamrPoints[1];
  else if (shuttleRun.value() >= 68) points=hamrPoints[2]
  else if (shuttleRun.value() >= 65) points=hamrPoints[3];
  else if (shuttleRun.value() >= 62) points=hamrPoints[4];
  else if (shuttleRun.value() >= 59) points=hamrPoints[5];
  else if (shuttleRun.value() >= 56) points=hamrPoints[6];
  else if (shuttleRun.value() >= 54) points=hamrPoints[7];
  else if (shuttleRun.value() >= 51) points=hamrPoints[8];
  else if (shuttleRun.value() >= 48) points=hamrPoints[9];
  else if (shuttleRun.value() >= 45) points=hamrPoints[10];
  else if (shuttleRun.value() >= 42) points=hamrPoints[11];
  else if (shuttleRun.value() >= 39) points=hamrPoints[12];
  else if (shuttleRun.value() >= 36) points=hamrPoints[13];
  else if (shuttleRun.value() >= 33) points=hamrPoints[14];
  else if (shuttleRun.value() >= 30) points=hamrPoints[15];
  else if (shuttleRun.value() >= 27) points=hamrPoints[16];
  else if (shuttleRun.value() >= 24) points=hamrPoints[17];
  else if (shuttleRun.value() >= 22) points=hamrPoints[18];
  else if (shuttleRun.value() >= 19) points=hamrPoints[19];
  else if (shuttleRun.value() >= 16) points=hamrPoints[20];  //level 5, 1 shuttle
  if (shuttleRun.value() < 16) points=hamrPoints[21];
  
  } else if (age == 'Female 35-39') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 52.5, 51, 49.5, 47, 44, 41, 38, 35, 0];
  
  
  if (shuttleRun.value() >= 74) points=hamrPoints[0];
  else if (shuttleRun.value() >= 68) points=hamrPoints[1];
  else if (shuttleRun.value() >= 65) points=hamrPoints[2]
  else if (shuttleRun.value() >= 62) points=hamrPoints[3];
  else if (shuttleRun.value() >= 59) points=hamrPoints[4];
  else if (shuttleRun.value() >= 56) points=hamrPoints[5];
  else if (shuttleRun.value() >= 54) points=hamrPoints[6];
  else if (shuttleRun.value() >= 51) points=hamrPoints[7];
  else if (shuttleRun.value() >= 48) points=hamrPoints[8];
  else if (shuttleRun.value() >= 45) points=hamrPoints[9];
  else if (shuttleRun.value() >= 42) points=hamrPoints[10];
  else if (shuttleRun.value() >= 39) points=hamrPoints[11];
  else if (shuttleRun.value() >= 36) points=hamrPoints[12];
  else if (shuttleRun.value() >= 33) points=hamrPoints[13];
  else if (shuttleRun.value() >= 30) points=hamrPoints[14];
  else if (shuttleRun.value() >= 27) points=hamrPoints[15];
  else if (shuttleRun.value() >= 24) points=hamrPoints[16];
  else if (shuttleRun.value() >= 22) points=hamrPoints[17];
  else if (shuttleRun.value() >= 19) points=hamrPoints[18];
  else if (shuttleRun.value() >= 16) points=hamrPoints[19];
  else if (shuttleRun.value() >= 13) points=hamrPoints[20];  //level 5, 1 shuttle
  if (shuttleRun.value() < 13) points=hamrPoints[21];
  
  } else if (age == 'Female 40-44') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45.5, 42, 38.5, 35, 0];
  
  
  if (shuttleRun.value() >= 71) points=hamrPoints[0];
  else if (shuttleRun.value() >= 65) points=hamrPoints[1];
  else if (shuttleRun.value() >= 62) points=hamrPoints[2]
  else if (shuttleRun.value() >= 59) points=hamrPoints[3];
  else if (shuttleRun.value() >= 56) points=hamrPoints[4];
  else if (shuttleRun.value() >= 54) points=hamrPoints[5];
  else if (shuttleRun.value() >= 51) points=hamrPoints[6];
  else if (shuttleRun.value() >= 48) points=hamrPoints[7];
  else if (shuttleRun.value() >= 45) points=hamrPoints[8];
  else if (shuttleRun.value() >= 42) points=hamrPoints[9];
  else if (shuttleRun.value() >= 39) points=hamrPoints[10];
  else if (shuttleRun.value() >= 36) points=hamrPoints[11];
  else if (shuttleRun.value() >= 33) points=hamrPoints[12];
  else if (shuttleRun.value() >= 30) points=hamrPoints[13];
  else if (shuttleRun.value() >= 27) points=hamrPoints[14];
  else if (shuttleRun.value() >= 24) points=hamrPoints[15];
  else if (shuttleRun.value() >= 22) points=hamrPoints[16];
  else if (shuttleRun.value() >= 19) points=hamrPoints[17];
  else if (shuttleRun.value() >= 16) points=hamrPoints[18];
  else if (shuttleRun.value() >= 13) points=hamrPoints[19];
  else if (shuttleRun.value() >= 10) points=hamrPoints[20];  //level 5, 1 shuttle
  if (shuttleRun.value() < 10) points=hamrPoints[21];
 
  } else if (age == 'Female 45-49') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 54.5, 54, 53.5, 52, 50.5, 48, 45, 42, 38.5, 35, 0];
  
  if (shuttleRun.value() >= 68) points=hamrPoints[0];
  else if (shuttleRun.value() >= 62) points=hamrPoints[1];
  else if (shuttleRun.value() >= 59) points=hamrPoints[2]
  else if (shuttleRun.value() >= 56) points=hamrPoints[3];
  else if (shuttleRun.value() >= 54) points=hamrPoints[4];
  else if (shuttleRun.value() >= 51) points=hamrPoints[5];
  else if (shuttleRun.value() >= 48) points=hamrPoints[6];
  else if (shuttleRun.value() >= 45) points=hamrPoints[7];
  else if (shuttleRun.value() >= 42) points=hamrPoints[8];
  else if (shuttleRun.value() >= 39) points=hamrPoints[9];
  else if (shuttleRun.value() >= 36) points=hamrPoints[10];
  else if (shuttleRun.value() >= 33) points=hamrPoints[11];
  else if (shuttleRun.value() >= 30) points=hamrPoints[12];
  else if (shuttleRun.value() >= 27) points=hamrPoints[13];
  else if (shuttleRun.value() >= 24) points=hamrPoints[14];
  else if (shuttleRun.value() >= 22) points=hamrPoints[15];
  else if (shuttleRun.value() >= 19) points=hamrPoints[16];
  else if (shuttleRun.value() >= 16) points=hamrPoints[17];
  else if (shuttleRun.value() >= 13) points=hamrPoints[18];
  else if (shuttleRun.value() >= 10) points=hamrPoints[19];
  else if (shuttleRun.value() >= 7) points=hamrPoints[20];  //level 5, 1 shuttle
  if (shuttleRun.value() < 7) points=hamrPoints[21];
 
  } else if (age == 'Female 50-54') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 53.5, 52, 49.5, 46, 42.5, 39, 35, 0];
  
  if (shuttleRun.value() >= 56) points=hamrPoints[0];
  else if (shuttleRun.value() >= 51) points=hamrPoints[1];
  else if (shuttleRun.value() >= 48) points=hamrPoints[2];
  else if (shuttleRun.value() >= 45) points=hamrPoints[3];
  else if (shuttleRun.value() >= 42) points=hamrPoints[4];
  else if (shuttleRun.value() >= 39) points=hamrPoints[5];
  else if (shuttleRun.value() >= 36) points=hamrPoints[6];
  else if (shuttleRun.value() >= 33) points=hamrPoints[7];
  else if (shuttleRun.value() >= 30) points=hamrPoints[8];
  else if (shuttleRun.value() >= 27) points=hamrPoints[9];
  else if (shuttleRun.value() >= 24) points=hamrPoints[10];
  else if (shuttleRun.value() >= 22) points=hamrPoints[11];
  else if (shuttleRun.value() >= 19) points=hamrPoints[12];
  else if (shuttleRun.value() >= 16) points=hamrPoints[13];
  else if (shuttleRun.value() >= 13) points=hamrPoints[14];
  else if (shuttleRun.value() >= 10) points=hamrPoints[15];
  else if (shuttleRun.value() >= 7) points=hamrPoints[16];
  else if (shuttleRun.value() >= 5) points=hamrPoints[17];  //level 5, 1 shuttle
  if (shuttleRun.value() < 5) points=hamrPoints[18];
 
  } else if (age == 'Female 55-59') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 55, 53.5, 52, 49, 46, 43, 39, 35, 0];
  
  if (shuttleRun.value() >= 54) points=hamrPoints[0];
  else if (shuttleRun.value() >= 48) points=hamrPoints[1];
  else if (shuttleRun.value() >= 45) points=hamrPoints[2];
  else if (shuttleRun.value() >= 42) points=hamrPoints[3];
  else if (shuttleRun.value() >= 39) points=hamrPoints[4];
  else if (shuttleRun.value() >= 36) points=hamrPoints[5];
  else if (shuttleRun.value() >= 33) points=hamrPoints[6];
  else if (shuttleRun.value() >= 30) points=hamrPoints[7];
  else if (shuttleRun.value() >= 27) points=hamrPoints[8];
  else if (shuttleRun.value() >= 24) points=hamrPoints[9];
  else if (shuttleRun.value() >= 22) points=hamrPoints[10];
  else if (shuttleRun.value() >= 19) points=hamrPoints[11];
  else if (shuttleRun.value() >= 16) points=hamrPoints[12];
  else if (shuttleRun.value() >= 13) points=hamrPoints[13];
  else if (shuttleRun.value() >= 10) points=hamrPoints[14];
  else if (shuttleRun.value() >= 7) points=hamrPoints[15];
  else if (shuttleRun.value() >= 5) points=hamrPoints[16];
  else if (shuttleRun.value() >= 2) points=hamrPoints[17];  //level 5, 1 shuttle
  if (shuttleRun.value() < 2) points=hamrPoints[18];
 
  } else if (age == 'Female >60') {
    hamrPoints = [60, 59.5, 59, 58.5, 58, 57.5, 57, 56.5, 56, 55.5, 54, 52.5, 51, 47, 43, 39, 35, 0];
  
  if (shuttleRun.value() >= 48) points=hamrPoints[0];
  else if (shuttleRun.value() >= 42) points=hamrPoints[1];
  else if (shuttleRun.value() >= 39) points=hamrPoints[2];
  else if (shuttleRun.value() >= 36) points=hamrPoints[3];
  else if (shuttleRun.value() >= 33) points=hamrPoints[4];
  else if (shuttleRun.value() >= 30) points=hamrPoints[5];
  else if (shuttleRun.value() >= 27) points=hamrPoints[6];
  else if (shuttleRun.value() >= 24) points=hamrPoints[7];
  else if (shuttleRun.value() >= 22) points=hamrPoints[8];
  else if (shuttleRun.value() >= 19) points=hamrPoints[9];
  else if (shuttleRun.value() >= 16) points=hamrPoints[10];
  else if (shuttleRun.value() >= 13) points=hamrPoints[11];
  else if (shuttleRun.value() >= 10) points=hamrPoints[12];
  else if (shuttleRun.value() >= 7) points=hamrPoints[13];
  else if (shuttleRun.value() >= 5) points=hamrPoints[14];
  else if (shuttleRun.value() >= 2) points=hamrPoints[15];
  else if (shuttleRun.value() >= 1) points=hamrPoints[16];  //level 5, 1 shuttle
  if (shuttleRun.value() < 1) points=hamrPoints[17];  
  
 
  }
  
  return points
}
  

  


function selectChange() {
  if (pushSel.value() == 'Pushups') {
    pushupsText = 'Pushups: ';
    pushups.show();
    pushtxt.show();
    hrpush.hide();
    hrpushtxt.hide();
  } else if (pushSel.value() == 'Hand-Release') {
    pushupsText = 'Hand-Release Pushups: ';
    pushups.hide();
    pushtxt.hide();
    hrpush.show();
    hrpushtxt.show();
  }
  
  if (sitSel.value() == 'Situps') {
    situpsText = 'Sit Ups: ';
    situps.show();
    sittxt.show();
    rsitups.hide();
    rsittxt.hide();
    planks.hide();
    plankmintxt.hide();
    planksectxt.hide();
    
  } else if (sitSel.value() == 'Plank') {
    situpsText = 'Plank: ';
    planks.show();
    plankmintxt.show();
    planksectxt.show();
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
  }
  
  if (runSel.value() == '1.5 Mile') {
    var runMinimum = runTime(runmin);
    runText = 'Run Time: ';
    runValue = runnum.minutes + ":" + nf(runnum.sec,2);
    runtime.show();
    runmintxt.show();
    runsectxt.value(runMinimum.sec);
    runsectxt.show();
    shuttleRun.hide();
    shuttleAudioBtn.hide();
    isAudioActive = false;
    
  } else if (runSel.value() == 'Shuttle') {
    runtime.hide();
    runmintxt.hide();
    runsectxt.hide();
    shuttletxt.show();
    shuttleRun.show();
    shuttleAudioBtn.show();
    runText = 'Shuttles: ';
    shuttlevalue = shuttleRun.value();
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
runsectxt.value(nf(tm.sec,2)); 
runValue = tm.minutes + ":" + nf(tm.sec,2);  
}

// If submit button is clicked, use the values manually input from textboxes
function calcButton()
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
  if(!isNaN(validPush) && !isNaN(validSit) && !isNaN(validRunMin) && !isNaN(validRunSec) &&       !isNaN(validPlankMin) && !isNaN(validPlankSec) && !isNaN(validShuttles))
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
  
}

function ageChange() {
  minMaxValueAge();
  removeSliders();
  createSliders();
  selectChange();
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
  if (age == 'Male 18-24') {
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
  } else if (age == 'Female 18-24') {
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
