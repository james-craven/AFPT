var redgreencolor,
    appInfoIcon,
    pushImg,
    shuttleAudioBtn,
    shuttleAudio,
    canvasContainer,
    modal,
    modal2,
    closeBtnModal,
    closeBtnModal2,
    passFailWalk,
    runtime,
    runnum,
    runmintxt,
    runsectxt,
    walktime,
    walkmintxt,
    walksectxt,
    ageSel,
    pushSel,
    sitSel,
    runSel,
    sexSel,
    pushups,
    pushnum,
    pushtxt,
    hrpush,
    hrpushnum,
    hrpushtxt,
    situps,
    sitnum,
    sittxt,
    rsitups,
    rsitnum,
    rsittxt,
    planks,
    planksectxt,
    plankmintxt,
    planktime,
    calculateBtn,
    pushmin,
    pushmax,
    hrmax,
    hrmin,
    sitmin,
    sitmax,
    rsitmin,
    rsitmax,
    runmax,
    runmin,
    walkmin,
    walkmax,
    plankmin,
    plankmax,
    shuttleMin,
    shuttleMax,
    shuttlevalue,
    infoIcon = "See Charts",
    isAudioActive = !1,
    strengthAbsLink = "./web formatted jpgs/female_lessthan25_Strength_Abs.webp",
    cardioLink = "./web formatted jpgs/female_lessthan25_cardio.webp",
    shuttleLink = "./web formatted jpgs/shuttleScores.webp",
    walkLink = "./web formatted jpgs/walkChart.webp",
    walkAltitudeAdjustPath = "./web formatted jpgs/walkAltitudeAdjust.webp",
    runAltitudeAdjustPath = "./web formatted jpgs/runAltitudeAdjust.webp",
    isModalActive = !1,
    isModal2Active = !1,
    isModal3Active = !1,
    shuttleLevel = 0,
    shuttleNumber = 0,
    plankValue = 0,
    rscore = 0,
    sscore = 0,
    pscore = 0,
    walkScore = !0,
    deferredPrompt = "not set",
    installButton,
    firstload = true;

function createSliders() {
    (pushSel = createSelect()).parent("sketch-holder"),
        pushSel.position(10, 245),
        pushSel.option("Pushups"),
        pushSel.option("Hand-Release"),
        pushSel.option("Exempt"),
        pushSel.selected("Pushups"),
        pushSel.changed(selectChange),
        (sitSel = createSelect()).parent("sketch-holder"),
        sitSel.position(10, 345),
        sitSel.option("Situps"),
        sitSel.option("Plank"),
        sitSel.option("Reverse Crunch"),
        sitSel.option("Exempt"),
        sitSel.selected("Situps"),
        sitSel.changed(selectChange),
        (runSel = createSelect()).parent("sketch-holder"),
        runSel.position(10, 445),
        runSel.option("1.5 Mile"),
        runSel.option("Shuttle"),
        runSel.option("Walk"),
        runSel.option("Exempt"),
        runSel.selected("1.5 Mile"),
        runSel.changed(selectChange),
        (runnum = new Time(0, 0)),
        (pushups = createSlider(0, pushmax, 0, 1)).parent("sketch-holder"),
        pushups.position(170, 258),
        pushups.size(175, 15),
        pushups.addClass("pushups"),
        (hrpush = createSlider(0, hrmax, 0, 1)).parent("sketch-holder"),
        hrpush.position(170, 258),
        hrpush.size(175, 15),
        hrpush.hide(),
        hrpush.addClass("pushups"),
        (situps = createSlider(0, sitmax, 0, 1)).parent("sketch-holder"),
        situps.position(170, 355),
        situps.size(175, 15),
        situps.addClass("situps"),
        (rsitups = createSlider(0, rsitmax, 0, 1)).parent("sketch-holder"),
        rsitups.position(170, 355),
        rsitups.size(175, 15),
        rsitups.hide(),
        rsitups.addClass("situps"),
        (planks = createSlider(0, plankmax, 0, 1)).parent("sketch-holder"),
        planks.position(170, 355),
        planks.size(135, 15),
        planks.hide(),
        planks.addClass("situps"),
        (runtime = createSlider(runmin, runmax + 62, runmax + 62, 1)).parent("sketch-holder"),
        runtime.position(10, 505),
        runtime.size(400, 15),
        runtime.addClass("run"),
        (walktime = createSlider(0, walkmax + 62, 0, 1)).parent("sketch-holder"),
        walktime.position(10, 505),
        walktime.size(400, 15),
        walktime.addClass("walk"),
        walktime.hide(),
        (shuttleRun = createSlider(0, shuttleMax, 0, 1)),
        shuttleRun.parent("sketch-holder"),
        shuttleRun.position(10, 505),
        shuttleRun.size(400, 15),
        shuttleRun.addClass("shuttle"),
        shuttleRun.hide(),
        (plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec, 2)),
        (pushtxt = createInput()).parent("sketch-holder"),
        pushtxt.addClass("text-box"),
        pushtxt.position(365, 245),
        pushtxt.size(20, 20),
        pushtxt.value(0),
        pushups.input(pushChange),
        pushtxt.mouseClicked(txtInput),
        pushtxt.input(pushChangeTxt),
        pushtxt.attribute("type", "tel"),
        pushtxt.attribute("pattern", "[0-9]+"),
        (hrpushtxt = createInput()).parent("sketch-holder"),
        hrpushtxt.addClass("text-box"),
        hrpushtxt.position(365, 245),
        hrpushtxt.size(20, 20),
        hrpushtxt.value(0),
        hrpushtxt.hide(),
        hrpush.input(hrpushChange),
        hrpushtxt.input(hrpushChangeTxt),
        hrpushtxt.mouseClicked(txtInput),
        hrpushtxt.attribute("type", "tel"),
        hrpushtxt.attribute("pattern", "[0-9]+"),
        (sittxt = createInput()).parent("sketch-holder"),
        sittxt.addClass("text-box"),
        sittxt.position(365, 345),
        sittxt.size(20, 20),
        sittxt.value(0),
        situps.input(sitChange),
        sittxt.input(sitChangeTxt),
        sittxt.mouseClicked(txtInput),
        sittxt.attribute("type", "tel"),
        sittxt.attribute("pattern", "[0-9]+"),
        (rsittxt = createInput()).parent("sketch-holder"),
        rsittxt.addClass("text-box"),
        rsittxt.position(365, 345),
        rsittxt.size(20, 20),
        rsittxt.value(0),
        rsittxt.hide(),
        rsitups.input(rsitChange),
        rsittxt.input(rsitChangeTxt),
        rsittxt.mouseClicked(txtInput),
        rsittxt.attribute("type", "tel"),
        rsittxt.attribute("pattern", "[0-9]+");
    var t = runTime(runmax + 62);
    (runmintxt = createInput()).parent("sketch-holder"),
        runmintxt.addClass("text-box"),
        runmintxt.position(310, 445),
        runmintxt.size(20, 20),
        runmintxt.value(t.minutes),
        runmintxt.hide(),
        runmintxt.mouseClicked(txtInput),
        runmintxt.attribute("type", "tel"),
        runmintxt.attribute("pattern", "[0-9]+"),
        runmintxt.input(runChangeTxt),
        (runsectxt = createInput()).parent("sketch-holder"),
        runsectxt.addClass("text-box"),
        runsectxt.position(365, 445),
        runsectxt.size(20, 20),
        runsectxt.value(t.sec),
        runsectxt.hide(),
        runsectxt.mouseClicked(txtInput),
        runtime.input(runChange),
        runsectxt.input(runChangeTxt),
        runsectxt.attribute("type", "tel"),
        runsectxt.attribute("pattern", "[0-9]+"),
        runTime(walkmax),
        (walkmintxt = createInput()).parent("sketch-holder"),
        walkmintxt.addClass("text-box"),
        walkmintxt.position(310, 445),
        walkmintxt.size(20, 20),
        walkmintxt.value(t.minutes),
        walkmintxt.hide(),
        walkmintxt.mouseClicked(txtInput),
        walkmintxt.attribute("type", "tel"),
        walkmintxt.attribute("pattern", "[0-9]+"),
        walkmintxt.input(walkChangeTxt),
        (walksectxt = createInput()).parent("sketch-holder"),
        walksectxt.addClass("text-box"),
        walksectxt.position(365, 445),
        walksectxt.size(20, 20),
        walksectxt.value(t.sec),
        walksectxt.hide(),
        walksectxt.mouseClicked(txtInput),
        walktime.input(walkChange),
        walksectxt.input(walkChangeTxt),
        walksectxt.attribute("type", "tel"),
        walksectxt.attribute("pattern", "[0-9]+"),
        (plankmintxt = createInput()).parent("sketch-holder"),
        plankmintxt.addClass("text-box"),
        plankmintxt.position(310, 345),
        plankmintxt.size(20, 20),
        plankmintxt.value(0),
        plankmintxt.hide(),
        plankmintxt.mouseClicked(txtInput),
        plankmintxt.input(plankChangeTxt),
        plankmintxt.attribute("type", "tel"),
        plankmintxt.attribute("pattern", "[0-9]+"),
        (planksectxt = createInput()).parent("sketch-holder"),
        planksectxt.addClass("text-box"),
        planksectxt.position(365, 345),
        planksectxt.size(20, 20),
        planksectxt.value(0),
        planksectxt.hide(),
        planksectxt.mouseClicked(txtInput),
        planks.input(plankChange),
        planksectxt.input(plankChangeTxt),
        planksectxt.attribute("type", "tel"),
        planksectxt.attribute("pattern", "[0-9]+"),
        (shuttletxt = createInput()),
        shuttletxt.parent("sketch-holder"),
        shuttletxt.addClass("text-box"),
        shuttletxt.position(365, 445),
        shuttletxt.size(22, 20),
        shuttletxt.value(0),
        shuttletxt.hide(),
        shuttletxt.mouseClicked(txtInput),
        shuttleRun.input(shuttleChange),
        shuttletxt.input(shuttleChangeTxt),
        shuttletxt.attribute("type", "tel"),
        shuttletxt.attribute("pattern", "[0-9]+"),
        (pushImg = createImg(strengthAbsLink, "")).parent(modal),
        pushImg.position(-40, 0),
        (cardioImg = createImg(cardioLink, "")),
        cardioImg.parent(modal),
        cardioImg.position(-40, 0),
        (shuttleImg = createImg(shuttleLink, "")),
        shuttleImg.parent(modal),
        shuttleImg.position(-40, 0),
        (walkImg = createImg(walkLink, "")),
        walkImg.parent(modal),
        walkImg.position(-40, 0),
        (runAltitudeImg = createImg(runAltitudeAdjustPath, "")),
        runAltitudeImg.parent(modal),
        runAltitudeImg.position(-40, 0),
        (walkAltitudeImg = createImg(walkAltitudeAdjustPath, "")),
        walkAltitudeImg.parent(modal),
        walkAltitudeImg.position(-40, 0);
}
function setup() {
    pixelDensity(1);

    //Service Worker Was Here


    let t = createCanvas(500, 750);
    t.parent("sketch-holder"),
        (t.drawingContext.miterLimit = 2),
        (ageSel = createSelect()).position(310, 135),
        ageSel.option("< 25"),
        ageSel.option("25-29"),
        ageSel.option("30-34"),
        ageSel.option("35-39"),
        ageSel.option("40-44"),
        ageSel.option("45-49"),
        ageSel.option("50-54"),
        ageSel.option("55-59"),
        ageSel.option(">60"),
        ageSel.selected("< 25"),
        ageSel.changed(ageChange),
        ageSel.id("ageSel"),
        ageSel.parent("sketch-holder"),
        (sexSel = createSelect()).position(90, 135),
        sexSel.option("Female"),
        sexSel.option("Male"),
        sexSel.changed(ageChange),
        sexSel.id("sexSel"),
        sexSel.parent("sketch-holder"),
        minMaxValueAge(),
        (calculateBtn = createButton("CALCULATE SCORE")).parent("sketch-holder"),
        calculateBtn.addClass("text-box"),
        calculateBtn.id("calculateScoreBtn"),
        calculateBtn.position(245, 605),
        calculateBtn.mousePressed(calcBtnClick),
        (shuttleAudioBtn = createButton("Shuttle Audio")).parent("sketch-holder"),
        shuttleAudioBtn.position(180, 445),
        shuttleAudioBtn.addClass("text-box"),
        (shuttleAudio = select("#shuttle-audio")).parent("sketch-holder"),
        shuttleAudioBtn.mousePressed(toggleMusicPlayer),
        (altitudeSel = createSelect()),
        altitudeSel.parent("sketch-holder"),
        altitudeSel.addClass("text-box"),
        altitudeSel.addClass("altitude-select"),
        altitudeSel.position(200, 660),
        altitudeSel.option("Altitude Adjust"),
        altitudeSel.option("Group 1 (5250-5499ft)"),
        altitudeSel.option("Group 2 (5500-5999ft)"),
        altitudeSel.option("Group 3 (6000-6599ft)"),
        altitudeSel.option("Group 4 (>6600ft)"),
        (pushInfoBtn = createA("javascript:void(0);", "See <br>Chart")),
        pushInfoBtn.parent("sketch-holder"),
        pushInfoBtn.position(365, 206),
        pushInfoBtn.id("pushBtn"),
        pushInfoBtn.mousePressed(pushInfoClick),
        (sitInfoBtn = createA("javascript:void(0);", "See <br>Chart")),
        sitInfoBtn.parent("sketch-holder"),
        sitInfoBtn.position(365, 306),
        sitInfoBtn.id("pushBtn"),
        sitInfoBtn.mousePressed(pushInfoClick),
        (cardioInfoBtn = createA("javascript:void(0);", "See <br>Chart")),
        cardioInfoBtn.parent("sketch-holder"),
        cardioInfoBtn.position(365, 406),
        cardioInfoBtn.id("pushBtn"),
        cardioInfoBtn.mousePressed(cardioInfoClick),
        (appInfoIcon = createButton("Info")).parent("sketch-holder"),
        appInfoIcon.addClass("text-box"),
        appInfoIcon.position(10, 10),
        appInfoIcon.id("appInfoBtn"),
        appInfoIcon.mousePressed(appInfoClick),
        (resourceIcon = createButton("Resources")),
        resourceIcon.parent("sketch-holder"),
        resourceIcon.addClass("text-box"),
        resourceIcon.position(210, 10),
        resourceIcon.id("resourceBtn"),
        resourceIcon.mousePressed(toggleModal3),
        (modal = select("#modal")),
        (closeBtnModal = select(".close-btn")),
        (canvasContainer = select("#sketch-holder")),
        closeBtnModal.mousePressed(toggleModal),
        (modal3 = select("#modal3")),
        modal3.parent("sketch-holder"),
        (closeBtnModal3 = select(".close-btn3")),
        closeBtnModal3.mousePressed(toggleModal3),
        (runAltitudeLink = select("#runAltitudeChart")),
        (walkAltitudeLink = select("#walkAltitudeChart")),
        runAltitudeLink.mousePressed(runAltitudeLinkClicked),
        walkAltitudeLink.mousePressed(walkAltitudeLinkClicked),
        (modal2 = select("#modal2")).parent("sketch-holder"),
        (closeBtnModal2 = select(".close-btn2")).mousePressed(appInfoClick),
        (shuttleChartsBtn = createButton("Shuttle Score Card")),
        shuttleChartsBtn.parent("sketch-holder"),
        shuttleChartsBtn.addClass("text-box"),
        shuttleChartsBtn.position(190, 445),
        shuttleChartsBtn.mousePressed(showShuttleCharts),
        shuttleChartsBtn.hide(),
        createSliders(),
        setScoreArrays();
    
          // Detects if device is on iOS 
const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test( userAgent );
}
// Detects if device is in standalone mode
function isPwa() {
  return ["fullscreen", "standalone", "minimal-ui"].some(
      (displayMode) => window.matchMedia('(display-mode: ' + displayMode + ')').matches
  );
}

// Checks if should display install popup notification:
if (isIos() && !isPwa()) {
  select(".banner").style("display", "block");
  select(".blocker").style("display", "block");
} else {
  select(".banner").style("display", "none");
  select(".blocker").style("display", "none");
}

var closebtn4 = select(".close-btn4");
var closebtn5 = select(".close-btn5");
var backdrop = select(".blocker");

closebtn4.mousePressed(() => {
  select(".banner").style("display", "none");
  select(".blocker").style("display", "none");
});

closebtn5.mousePressed(() => {
  select(".banner2").style("display", "none");
  select(".blocker").style("display", "none");
});

backdrop.mousePressed(() => {
  select(".banner").style("display", "none");
  select(".banner2").style("display", "none")
  select(".blocker").style("display", "none");
});

// Allows to show the install prompt
installButton = select("#addToHomSscreen");
window.addEventListener("beforeinstallprompt", e => {
  console.log("beforeinstallprompt fired");
  // Prevent Chrome 76 and earlier from automatically showing a prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Show the install button
  installButton.removeAttribute('hidden');
  installButton.mouseReleased(installApp);
  if(firstload) {
    setTimeout(() => {
      select(".banner2").style("display", "block");
      select(".blocker").style("display", "block");
    }, 2000);
  }

});
}
function draw() {
    clear();
    var t = 0;
    let e = ageSel.value();
    if (((e = sexSel.value() + " " + e), "Male < 25" == e || "Male 25-29" == e))
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 2;
                break;
            case "Group 2 (5500-5999ft)":
                t = 6;
                break;
            case "Group 3 (6000-6599ft)":
                t = 9;
                break;
            case "Group 4 (>6600ft)":
                t = 15;
                break;
            default:
                t = 0;
        }
    else if ("Male 30-34" == e || "Male 35-39" == e)
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 2;
                break;
            case "Group 2 (5500-5999ft)":
                t = 6;
                break;
            case "Group 3 (6000-6599ft)":
                t = 9;
                break;
            case "Group 4 (>6600ft)":
                t = 15;
                break;
            default:
                t = 0;
        }
    else if ("Male 40-44" == e || "Male 45-49" == e)
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 2;
                break;
            case "Group 2 (5500-5999ft)":
                t = 5;
                break;
            case "Group 3 (6000-6599ft)":
                t = 8;
                break;
            case "Group 4 (>6600ft)":
                t = 14;
                break;
            default:
                t = 0;
        }
    else if ("Male 50-54" == e || "Male 55-59" == e)
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 2;
                break;
            case "Group 2 (5500-5999ft)":
                t = 5;
                break;
            case "Group 3 (6000-6599ft)":
                t = 8;
                break;
            case "Group 4 (>6600ft)":
                t = 13;
                break;
            default:
                t = 0;
        }
    else if ("Male >60" == e)
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 1;
                break;
            case "Group 2 (5500-5999ft)":
                t = 4;
                break;
            case "Group 3 (6000-6599ft)":
                t = 7;
                break;
            case "Group 4 (>6600ft)":
                t = 12;
                break;
            default:
                t = 0;
        }
    else if ("Female < 25" == e || "Female 25-29" == e)
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 3;
                break;
            case "Group 2 (5500-5999ft)":
                t = 8;
                break;
            case "Group 3 (6000-6599ft)":
                t = 12;
                break;
            case "Group 4 (>6600ft)":
                t = 20;
                break;
            default:
                t = 0;
        }
    else if ("Female 30-34" == e || "Female 35-39" == e)
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 2;
                break;
            case "Group 2 (5500-5999ft)":
                t = 7;
                break;
            case "Group 3 (6000-6599ft)":
                t = 12;
                break;
            case "Group 4 (>6600ft)":
                t = 19;
                break;
            default:
                t = 0;
        }
    else if ("Female 40-44" == e || "Female 45-49" == e)
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 3;
                break;
            case "Group 2 (5500-5999ft)":
                t = 7;
                break;
            case "Group 3 (6000-6599ft)":
                t = 11;
                break;
            case "Group 4 (>6600ft)":
                t = 18;
                break;
            default:
                t = 0;
        }
    else if ("Female 50-54" == e || "Female 55-59" == e)
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 2;
                break;
            case "Group 2 (5500-5999ft)":
                t = 6;
                break;
            case "Group 3 (6000-6599ft)":
                t = 10;
                break;
            case "Group 4 (>6600ft)":
                t = 17;
                break;
            default:
                t = 0;
        }
    else if ("Female >60" == e)
        switch (altitudeSel.value()) {
            case "Group 1 (5250-5499ft)":
                t = 1;
                break;
            case "Group 2 (5500-5999ft)":
                t = 5;
                break;
            case "Group 3 (6000-6599ft)":
                t = 9;
                break;
            case "Group 4 (>6600ft)":
                t = 15;
                break;
            default:
                t = 0;
        }
    else t = 0;
    var s,
        a =
            ((s = runtime.value()),
            "Group 1 (5250-5499ft)" == altitudeSel.value()
                ? s <= hms("11:22")
                    ? 2
                    : s <= hms("15:20")
                    ? 3
                    : s <= hms("16:22")
                    ? 4
                    : s <= hms("20:33")
                    ? 5
                    : s <= hms("24:46")
                    ? 6
                    : s <= hms("26:06")
                    ? 7
                    : s >= hms("26:07")
                    ? 8
                    : 0
                : "Group 2 (5500-5999ft)" == altitudeSel.value()
                ? s <= hms("9:34")
                    ? 6
                    : s <= hms("10:37")
                    ? 7
                    : s <= hms("11:38")
                    ? 8
                    : s <= hms("13:14")
                    ? 9
                    : s <= hms("14:25")
                    ? 10
                    : s <= hms("15:50")
                    ? 11
                    : s >= hms("16:22")
                    ? 12
                    : s <= hms("17:34")
                    ? 13
                    : s <= hms("18:56")
                    ? 14
                    : s <= hms("20:33")
                    ? 15
                    : s <= hms("21:28")
                    ? 17
                    : s <= hms("23:34")
                    ? 18
                    : s >= hms("24:46")
                    ? 19
                    : s <= hms("26:06")
                    ? 20
                    : s >= hms("16:22")
                    ? 22
                    : 0
                : "Group 3 (6000-6599ft)" == altitudeSel.value()
                ? s <= hms("9:34")
                    ? 11
                    : s <= hms("10:37")
                    ? 12
                    : s <= hms("11:22")
                    ? 13
                    : s <= hms("11:38")
                    ? 14
                    : s <= hms("12:33")
                    ? 15
                    : s <= hms("13:36")
                    ? 16
                    : s >= hms("14:25")
                    ? 17
                    : s <= hms("15:20")
                    ? 18
                    : s <= hms("15:50")
                    ? 19
                    : s <= hms("16:22")
                    ? 20
                    : s <= hms("16:57")
                    ? 21
                    : s <= hms("17:34")
                    ? 22
                    : s >= hms("18:14")
                    ? 23
                    : s <= hms("18:56")
                    ? 24
                    : s >= hms("19:43")
                    ? 25
                    : s <= hms("20:33")
                    ? 26
                    : s <= hms("21:28")
                    ? 28
                    : s <= hms("22:28")
                    ? 29
                    : s >= hms("23:24")
                    ? 31
                    : s <= hms("24:46")
                    ? 32
                    : s >= hms("26:06")
                    ? 34
                    : s >= hms("26:07")
                    ? 37
                    : 0
                : "Group 4 (>6600ft)" == altitudeSel.value()
                ? s <= hms("9:22")
                    ? 18
                    : s <= hms("9:34")
                    ? 19
                    : s <= hms("9:45")
                    ? 20
                    : s <= hms("10:37")
                    ? 21
                    : s <= hms("11:22")
                    ? 22
                    : s <= hms("11:38")
                    ? 23
                    : s >= hms("11:56")
                    ? 24
                    : s <= hms("12:14")
                    ? 25
                    : s <= hms("12:53")
                    ? 26
                    : s <= hms("13:14")
                    ? 27
                    : s <= hms("14:00")
                    ? 28
                    : s <= hms("14:25")
                    ? 29
                    : s >= hms("15:20")
                    ? 31
                    : s <= hms("15:50")
                    ? 32
                    : s >= hms("16:22")
                    ? 34
                    : s <= hms("16:57")
                    ? 36
                    : s <= hms("17:34")
                    ? 37
                    : s <= hms("18:14")
                    ? 38
                    : s >= hms("18:56")
                    ? 40
                    : s <= hms("19:43")
                    ? 42
                    : s >= hms("20:33")
                    ? 43
                    : s >= hms("21:28")
                    ? 46
                    : s <= hms("22:28")
                    ? 49
                    : s >= hms("23:34")
                    ? 51
                    : s <= hms("24:46")
                    ? 54
                    : s >= hms("26:06")
                    ? 57
                    : s >= hms("26:07")
                    ? 62
                    : 0
                : 0);
    runtime.value() >= runmin && runtime.value() <= runmax + a ? runtime.addClass("greenbackground") : runtime.removeClass("greenbackground"),
        walktime.value() <= walkmax + t ? walktime.addClass("greenbackground") : walktime.removeClass("greenbackground"),
        shuttleRun.value() >= shuttleMin ? shuttleRun.addClass("greenbackground") : shuttleRun.removeClass("greenbackground"),
        pushups.value() >= pushmin ? pushups.addClass("greenbackground") : pushups.removeClass("greenbackground"),
        hrpush.value() >= hrmin ? hrpush.addClass("greenbackground") : hrpush.removeClass("greenbackground"),
        situps.value() >= sitmin ? situps.addClass("greenbackground") : situps.removeClass("greenbackground"),
        rsitups.value() >= rsitmin ? rsitups.addClass("greenbackground") : rsitups.removeClass("greenbackground"),
        planks.value() >= plankmin ? planks.addClass("greenbackground") : planks.removeClass("greenbackground"),
        isAudioActive ? shuttleAudio.show() : shuttleAudio.hide(),
        isModalActive ? (canvasContainer.hide(), modal.show()) : (canvasContainer.show(), modal.hide()),
        isModal2Active ? modal2.show() : modal2.hide(),
        isModal3Active ? modal3.show() : modal3.hide(),
        stroke("white"),
        fill("white"),
        text("SEX:", 25, 165),
        text("AGE:", 235, 165),
        textSize(16),
        stroke("white"),
        strokeWeight(0.5),
        fill("white"),
        "Pushups" == pushSel.value()
            ? (text("Strength Score: " + pscore + "  |  Min: " + pushmin + "  |  Max: " + pushmax, 15, 225),
              pushups.removeAttribute("disabled"),
              hrpush.removeAttribute("disabled"),
              pushtxt.removeAttribute("disabled"),
              hrpushtxt.removeAttribute("disabled"))
            : "Hand-Release" == pushSel.value()
            ? (text("Strength Score: " + pscore + "  |  Min: " + hrmin + "  |  Max: " + hrmax, 15, 225),
              pushups.removeAttribute("disabled"),
              hrpush.removeAttribute("disabled"),
              pushtxt.removeAttribute("disabled"),
              hrpushtxt.removeAttribute("disabled"))
            : "Exempt" == pushSel.value() &&
              (text("Strength Score: Exempt", 15, 225),
              pushups.value(0),
              pushups.attribute("disabled", ""),
              hrpush.value(0),
              hrpush.attribute("disabled", ""),
              pushtxt.value(0),
              pushtxt.attribute("disabled", ""),
              hrpushtxt.value(0),
              hrpushtxt.attribute("disabled", "")),
        "Situps" == sitSel.value()
            ? (text("Abs Score: " + sscore + "  |  Min: " + sitmin + "  |  Max: " + sitmax, 15, 325),
              situps.removeAttribute("disabled"),
              rsitups.removeAttribute("disabled"),
              planks.removeAttribute("disabled"),
              sittxt.removeAttribute("disabled"),
              rsittxt.removeAttribute("disabled"),
              plankmintxt.removeAttribute("disabled"),
              planksectxt.removeAttribute("disabled"))
            : "Plank" == sitSel.value()
            ? (text("Abs Score: " + sscore + "  |  Min: " + plankString(plankmin) + "  |  Max: " + plankString(plankmax), 15, 325),
              situps.removeAttribute("disabled"),
              rsitups.removeAttribute("disabled"),
              planks.removeAttribute("disabled"),
              sittxt.removeAttribute("disabled"),
              rsittxt.removeAttribute("disabled"),
              plankmintxt.removeAttribute("disabled"),
              planksectxt.removeAttribute("disabled"))
            : "Reverse Crunch" == sitSel.value()
            ? (text("Abs Score: " + sscore + "  |  Min: " + rsitmin + "  |  Max: " + rsitmax, 15, 325),
              situps.removeAttribute("disabled"),
              rsitups.removeAttribute("disabled"),
              planks.removeAttribute("disabled"),
              sittxt.removeAttribute("disabled"),
              rsittxt.removeAttribute("disabled"),
              plankmintxt.removeAttribute("disabled"),
              planksectxt.removeAttribute("disabled"))
            : "Exempt" == sitSel.value() &&
              (text("Abs Score: Exempt", 15, 325),
              situps.value(0),
              situps.attribute("disabled", ""),
              rsitups.value(0),
              rsitups.attribute("disabled", ""),
              planks.value(0),
              planks.attribute("disabled", ""),
              sittxt.value(0),
              sittxt.attribute("disabled", ""),
              rsittxt.value(0),
              rsittxt.attribute("disabled", ""),
              plankmintxt.value(0),
              plankmintxt.attribute("disabled", ""),
              planksectxt.value(0),
              planksectxt.attribute("disabled", ""));
    var l = runTime(runmax);
    if (
        ("1.5 Mile" == runSel.value()
            ? (text("Cardio Score: " + rscore + "  |  Min: " + plankString(runmax + a) + "  |  Max: " + plankString(runmin), 15, 425),
              runtime.removeAttribute("disabled"),
              runmintxt.removeAttribute("disabled"),
              "0" === runmintxt.value() && runmintxt.value(l.minutes),
              runsectxt.removeAttribute("disabled"),
              shuttleRun.removeAttribute("disabled"),
              shuttletxt.removeAttribute("disabled"),
              walktime.removeAttribute("disabled"),
              walkmintxt.removeAttribute("disabled"),
              walksectxt.removeAttribute("disabled"))
            : "Shuttle" == runSel.value()
            ? (text("Cardio Score: " + rscore + "  |  Min: " + shuttleMin + "  |  Max: " + shuttleMax, 15, 425),
              runtime.removeAttribute("disabled"),
              runmintxt.removeAttribute("disabled"),
              runsectxt.removeAttribute("disabled"),
              shuttleRun.removeAttribute("disabled"),
              shuttletxt.removeAttribute("disabled"),
              walktime.removeAttribute("disabled"),
              walkmintxt.removeAttribute("disabled"),
              walksectxt.removeAttribute("disabled"))
            : "Exempt" == runSel.value()
            ? (text("Cardio Score: Exempt", 85, 425),
              runtime.value(runmax + 62),
              runtime.attribute("disabled", ""),
              runmintxt.value(0),
              runmintxt.attribute("disabled", ""),
              runsectxt.value(0),
              runsectxt.attribute("disabled", ""),
              shuttleRun.value(0),
              shuttleRun.attribute("disabled", ""),
              shuttletxt.value(0),
              shuttletxt.attribute("disabled", ""),
              walktime.value(runmax + 62),
              walktime.attribute("disabled", ""),
              walkmintxt.value(0),
              walkmintxt.attribute("disabled", ""),
              walksectxt.value(0),
              walksectxt.attribute("disabled", ""))
            : "Walk" == runSel.value() &&
              (text("Walk Is Pass/Fail. Max Time To Pass: " + plankString(walkmax + t), 15, 425), walktime.removeAttribute("disabled"), walkmintxt.removeAttribute("disabled"), walksectxt.removeAttribute("disabled")),
        fill(0),
        stroke("white"),
        strokeWeight(2),
        line(10, 200, 410, 200),
        stroke(0),
        strokeWeight(1),
        stroke("white"),
        strokeWeight(2),
        line(10, 400, 410, 400),
        stroke(0),
        strokeWeight(1),
        stroke("white"),
        strokeWeight(2),
        line(10, 300, 410, 300),
        stroke(0),
        strokeWeight(0.5),
        textSize(20),
        fill("white"),
        stroke("white"),
        "1.5 Mile" == runSel.value())
    ) {
        text(":", 356, 473),
            runmintxt.show(),
            runsectxt.show(),
            shuttletxt.hide(),
            walkmintxt.hide(),
            walksectxt.hide(),
            (lapTime = runTime(floor(runtime.value() / 6))),
            text("Req'd 6 Lap Time: ~" + lapTime.minutes + ":" + nf(lapTime.sec, 2), 10, 555),
            text("(Rounded down to nearest sec)", 10, 575);
        for (var i = 0; i < 6; i++) {
            var u = runTime(floor(runtime.value() / 6) * (i + 1));
            text("Lap " + int(i + 1) + ": ≤ " + u.minutes + ":" + nf(u.sec, 2), 10, 600 + 20 * i);
        }
    } else
        "Shuttle" == runSel.value() &&
            (text("Shuttle Level: " + k(), 10, 555),
            text(
                "Current Level Shuttles: " +
                    (function () {
                        var t = 1,
                            e = [7, 15, 23, 32, 41, 50, 60, 70, 81, 92, 104];
                        return (
                            1 == k() && (t = shuttleRun.value() - e[0] + 7),
                            2 == k() && (t = shuttleRun.value() - e[1] + 8),
                            3 == k() && (t = shuttleRun.value() - e[2] + 8),
                            4 == k() && (t = shuttleRun.value() - e[3] + 9),
                            5 == k() && (t = shuttleRun.value() - e[4] + 9),
                            6 == k() && (t = shuttleRun.value() - e[5] + 9),
                            7 == k() && (t = shuttleRun.value() - e[6] + 10),
                            8 == k() && (t = shuttleRun.value() - e[7] + 10),
                            9 == k() && (t = shuttleRun.value() - e[8] + 11),
                            10 == k() && (t = shuttleRun.value() - e[9] + 11),
                            11 == k() && (t = shuttleRun.value() - e[10] + 12),
                            t
                        );
                    })(),
                10,
                585
            ));
    (pushnum = pushups.value()),
        (sitnum = situps.value()),
        (hrpushnum = hrpush.value()),
        (rsitnum = rsitups.value()),
        (runnum = runTime(runtime.value())),
        (plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec, 2)),
        (shuttlevalue = shuttleRun.value());
    var n,
        r = altitudeSel.value();
    n = "Group 1 (5250-5499ft)" == r ? 1 : "Group 2 (5500-5999ft)" == r ? 2 : "Group 3 (6000-6599ft)" == r ? 3 : "Group 4 (>6600ft)" == r ? 4 : 0;
    var h = shuttleRun.value() + n;
    "1.5 Mile" == runSel.value()
        ? (rscore = runScore(runtime.value() - a))
        : "Shuttle" == runSel.value()
        ? (console.log(shuttleRun.value() + n), console.log(hamrScore(h)), (rscore = hamrScore(shuttleRun.value() + n)))
        : "Walk" == runSel.value() && ((rscore = 0), (walkScore = didWalkPass(walktime.value() - t, scoreArrays))),
        "Pushups" == pushSel.value() ? (pscore = pushScore(pushnum)) : "Hand-Release" == pushSel.value() && (pscore = hrpushScore(hrpushnum)),
        "Situps" == sitSel.value() ? (sscore = sitScore(sitnum)) : "Reverse Crunch" == sitSel.value() ? (sscore = rsitScore(rsitnum)) : "Plank" == sitSel.value() && ((sscore = plankScore(planks.value())), text(":", 356, 373));
    var o = sscore + pscore + rscore,
        m = pushSel.value(),
        p = sitSel.value(),
        d = runSel.value(),
        c = "Exempt";
    m == c && p != c && d != c
        ? (o = ((sscore + rscore) / 80) * 100)
        : p == c && d != c && m != c
        ? (o = ((pscore + rscore) / 80) * 100)
        : (d != c && "Walk" != d) || p == c || m == c
        ? m == c && p == c && d != c
            ? (o = (rscore / 60) * 100)
            : m != c || (d != c && "Walk" != d) || p == c
            ? p != c || (d != c && "Walk" != d) || m == c || (o = (pscore / 20) * 100)
            : (o = (sscore / 20) * 100)
        : (o = ((pscore + sscore) / 40) * 100);
    var x = "FAIL! Minimum Not Met!";
    function k() {
        var t = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            e = 5;
        return (
            shuttleRun.value() >= 93
                ? (e = t[0])
                : shuttleRun.value() >= 82 && shuttleRun.value() < 93
                ? (e = t[1])
                : shuttleRun.value() >= 71 && shuttleRun.value() < 82
                ? (e = t[2])
                : shuttleRun.value() >= 61 && shuttleRun.value() < 71
                ? (e = t[3])
                : shuttleRun.value() >= 51 && shuttleRun.value() < 61
                ? (e = t[4])
                : shuttleRun.value() >= 42 && shuttleRun.value() < 51
                ? (e = t[5])
                : shuttleRun.value() >= 33 && shuttleRun.value() < 42
                ? (e = t[6])
                : shuttleRun.value() >= 24 && shuttleRun.value() < 33
                ? (e = t[7])
                : shuttleRun.value() >= 16 && shuttleRun.value() < 24
                ? (e = t[8])
                : shuttleRun.value() >= 8 && shuttleRun.value() < 16 && (e = t[9]),
            shuttleRun.value() >= 0 && shuttleRun.value() < 8 && (e = t[10]),
            e
        );
    }
    (0 == sscore && p != c) || (0 == rscore && d != c && "Walk" != d) || (0 == pscore && m != c) || ("Walk" == d && !walkScore)
        ? (x = "FAIL! Minimum Not Met!")
        : o < 75
        ? (x = "Unsatisfactory!")
        : o < 90
        ? (x = "Satisfactory!")
        : o >= 90 && (x = "Excellent!"),
        textSize(23),
        fill("white"),
        stroke("white"),
        "FAIL! Minimum Not Met!" == x
            ? ((redgreencolor = color(220, 35, 0)), fill(redgreencolor), stroke("black"), strokeWeight(6), text("FAIL! Minimum Not Met!", 85, 115))
            : "Unsatisfactory!" == x
            ? ((redgreencolor = color(220, 35, 0)), fill(redgreencolor), stroke("black"), strokeWeight(6), text(x, 135, 115))
            : "Satisfactory!" == x
            ? ((redgreencolor = "lightgreen"), fill(redgreencolor), stroke("black"), strokeWeight(5), text(x, 155, 115))
            : "Excellent!" == x && ((redgreencolor = "lightgreen"), fill(redgreencolor), stroke("black"), strokeWeight(5), text(x, 165, 115)),
        fill("white"),
        stroke("white"),
        strokeWeight(0),
        text("Total Score:", 125, 85),
        fill(redgreencolor),
        stroke("black"),
        strokeWeight(6),
        text(o.toFixed(1), 255, 85),
        fill("white"),
        stroke("white"),
        strokeWeight(1),
        stroke(0),
        fill(0);
}
function plankTime(t) {
    var e;
    return (e = floor(t / 60)), new Time(e, t - 60 * e);
}
function runTime(t) {
    var e;
    return (e = floor(t / 60)), new Time(e, t - 60 * e);
}
function runScore(t) {
    return calculateRunScore(t, scoreArrays.cardio);
}
function plankScore(t) {
    return calculatePlankScore(t, scoreArrays);
}
function pushScore(t) {
    return calculateStrengthScore(t, scoreArrays);
}
function hrpushScore(t) {
    return calculateStrengthScore(t, scoreArrays);
}
function sitScore(t) {
    return calculateSitupsScore(t, scoreArrays);
}
function rsitScore(t) {
    return calculateSitupsScore(t, scoreArrays);
}
function hamrScore(t) {
    return calculateShuttleScore(t, scoreArrays);
}
function selectChange() {
    if (
        (setScoreArrays(),
        "Pushups" == pushSel.value()
            ? ((pushupsText = "Pushups: "), pushups.show(), pushtxt.show(), hrpush.hide(), hrpushtxt.hide(), pushtxt.value("0"))
            : "Hand-Release" == pushSel.value() && ((pushupsText = "Hand-Release Pushups: "), pushups.hide(), pushtxt.hide(), hrpush.show(), hrpushtxt.show(), hrpushtxt.value("0")),
        "Situps" == sitSel.value()
            ? ((situpsText = "Sit Ups: "), situps.show(), sittxt.show(), sittxt.value("0"), rsitups.hide(), rsittxt.hide(), planks.hide(), plankmintxt.hide(), planksectxt.hide())
            : "Plank" == sitSel.value()
            ? ((situpsText = "Plank: "), planks.show(), plankmintxt.show(), plankmintxt.value("0"), planksectxt.show(), planksectxt.value("0"), situps.hide(), sittxt.hide(), rsitups.hide(), rsittxt.hide())
            : "Reverse Crunch" == sitSel.value() && ((situpsText = "Reverse Crunch: "), situps.hide(), sittxt.hide(), planks.hide(), plankmintxt.hide(), planksectxt.hide(), rsitups.show(), rsittxt.show(), rsittxt.value("0")),
        "1.5 Mile" == runSel.value())
    ) {
        var t = runTime(runmax + 62);
        (runText = "Run Time: "),
            runtime.show(),
            runmintxt.show(),
            runmintxt.value(t.minutes),
            runsectxt.value(t.sec),
            runsectxt.show(),
            shuttleRun.hide(),
            shuttleChartsBtn.hide(),
            walkmintxt.hide(),
            walksectxt.hide(),
            walktime.hide(),
            (isAudioActive = !1),
            shuttleAudioBtn.position(180, 445);
    } else
        "Shuttle" == runSel.value()
            ? (runtime.hide(),
              runmintxt.hide(),
              runsectxt.hide(),
              shuttletxt.show(),
              shuttletxt.value("0"),
              shuttleRun.show(),
              shuttleChartsBtn.show(),
              walkmintxt.hide(),
              walksectxt.hide(),
              walktime.hide(),
              (runText = "Shuttles: "),
              (shuttlevalue = shuttleRun.value()),
              shuttleAudioBtn.position(290, 545))
            : "Walk" == runSel.value() &&
              ((runText = "Walk : "),
              runtime.hide(),
              runmintxt.hide(),
              runsectxt.hide(),
              shuttletxt.hide(),
              shuttleRun.hide(),
              shuttleChartsBtn.hide(),
              shuttleAudioBtn.position(180, 445),
              walktime.show(),
              walkmintxt.show(),
              walksectxt.show(),
              walkmintxt.value(0),
              walksectxt.value(0),
              walktime.value(0));
}
function shuttleChange() {
    shuttletxt.value(shuttleRun.value()), (shuttlevalue = shuttleRun.value());
}
function shuttleChangeTxt() {
    shuttleRun.value(shuttletxt.value()), (shuttlevalue = shuttleRun.value());
}
function pushChange() {
    pushtxt.value(pushups.value());
}
function pushChangeTxt() {
    pushups.value(pushtxt.value());
}
function keyPressed() {
    keyCode == ENTER && (calcBtnClick(), document.activeElement.blur(), console.log(keyCode));
}
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
function plankString(t) {
    var e = plankTime(t);
    return e.minutes + ":" + nf(e.sec, 2);
}
function plankChange() {
    var t = plankTime(planks.value());
    plankmintxt.value(t.minutes), planksectxt.value(nf(t.sec, 2)), (plankValue = t.minutes + ":" + nf(t.sec, 2));
}
function plankChangeTxt() {
    var t = plankmintxt.value() + ":" + planksectxt.value(),
        e = hmsToSecs(t);
    planks.value(e);
}
function hrpushChange() {
    hrpushtxt.value(hrpush.value());
}
function hrpushChangeTxt() {
    hrpush.value(hrpushtxt.value());
}
function runChange() {
    var t = runTime(runtime.value());
    runmintxt.value(t.minutes), runsectxt.value(t.sec);
}
function runChangeTxt() {
    var t = runmintxt.value() + ":" + runsectxt.value(),
        e = hmsToSecs(t);
    runtime.value(e);
}
function walkChange() {
    var t = runTime(walktime.value());
    walkmintxt.value(t.minutes), walksectxt.value(t.sec);
}
function walkChangeTxt() {
    var t = walkmintxt.value() + ":" + walksectxt.value(),
        e = hmsToSecs(t);
    walktime.value(e);
}
function calcBtnClick() {
    var t, e, s, a, l, i, u;
    if (
        ((plankValue = plankTime(planks.value()).minutes + ":" + nf(plankTime(planks.value()).sec, 2)),
        (shuttlevalue = shuttleRun.value()),
        "Pushups" == pushSel.value() ? (u = int(pushtxt.value())) : "Hand-Release" == pushSel.value() ? (u = int(hrpushtxt.value())) : "Exempt" == pushSel.value() && (u = 0),
        "Situps" == sitSel.value()
            ? ((t = int(sittxt.value())), (a = 0), (l = 0))
            : "Plank" == sitSel.value()
            ? ((t = 0), (a = int(plankmintxt.value())), (l = int(planksectxt.value())))
            : "Reverse Crunch" == sitSel.value()
            ? ((t = int(rsittxt.value())), (a = 0), (l = 0))
            : "Exempt" == sitSel.value() && ((a = 0), (l = 0), (t = 0)),
        "1.5 Mile" == runSel.value()
            ? ((e = int(runmintxt.value())), (s = int(runsectxt.value())), (i = 0))
            : "Shuttle" == runSel.value()
            ? ((e = 0), (s = 0), (i = int(shuttletxt.value())))
            : "Exempt" == runSel.value()
            ? ((e = 0), (s = 0), (i = 0))
            : "Walk" == runSel.value() && ((validWalkMin = int(walkmintxt.value())), (validWalkSecs = int(walksectxt.value())), (e = 0), (s = 0), (i = 0)),
        isNaN(u) || isNaN(t) || isNaN(e) || isNaN(s) || isNaN(a) || isNaN(l) || isNaN(i) || isNaN(validWalkMin) || isNaN(validWalkSecs))
    )
        alert("Please verify that only numbers are input for times!");
    else {
        "Pushups" == pushSel.value() ? u > pushmax && (u = pushmax) : "Hand-Release" == pushSel.value() && u > hrmax && (u = hrmax),
            "Situps" == sitSel.value() ? t > sitmax && (t = sitmax) : "Reverse Crunch" == sitSel.value() && t > rsitmax && (t = rsitmax);
        var n = 60 * e + s;
        n > runmax ? (n = runmax) : n < runmin && (n = runmin);
        var r = validWalkMin,
            h = (validwalkSecs, 60 * r + h);
        h > walkmax && (h = walkmax);
        var o = 60 * a + l;
        o > plankmax && (o = plankmax),
            i > shuttleMax && (i = shuttleMax),
            "Pushups" == pushSel.value() ? pushups.value(u) : "Hand-Release" == pushSel.value() && hrpush.value(u),
            "Situps" == sitSel.value() ? situps.value(t) : "Reverse Crunch" == sitSel.value() && rsitups.value(t),
            runtime.value(n),
            planks.value(o),
            shuttleRun.value(i),
            walktime.value(validwalksecs);
    }
}
function removeSliders() {
    pushSel.remove(),
        sitSel.remove(),
        runSel.remove(),
        pushups.remove(),
        situps.remove(),
        hrpush.remove(),
        rsitups.remove(),
        shuttleRun.remove(),
        planks.remove(),
        runtime.remove(),
        pushtxt.remove(),
        hrpushtxt.remove(),
        sittxt.remove(),
        rsittxt.remove(),
        runmintxt.remove(),
        runsectxt.remove(),
        plankmintxt.remove(),
        planksectxt.remove(),
        shuttletxt.remove(),
        pushImg.remove(),
        cardioImg.remove(),
        shuttleImg.remove(),
        walktime.remove(),
        walkmintxt.remove(),
        walksectxt.remove();
}
function ageChange() {
    minMaxValueAge(), selectChange(), removeSliders(), createSliders(), setScoreArrays();
}
function minMaxValueAge() {
    function t(t) {
        for (var e = t.split(":"), s = 0, a = 1; e.length > 0; ) "" == e[0] && (e[0] = 0), (s += a * parseInt(e.pop(), 10)), (a *= 60);
        return s;
    }
    var e = ageSel.value();
    "Male < 25" == (e = sexSel.value() + " " + e)
        ? ((pushmin = 30),
          (pushmax = 67),
          (sitmin = 39),
          (sitmax = 58),
          (hrmin = 15),
          (hrmax = 40),
          (rsitmin = 21),
          (rsitmax = 49),
          (plankmin = 65),
          (plankmax = 215),
          (runmin = 552),
          (runmax = 950),
          (shuttleMin = 36),
          (shuttleMax = 100),
          (walkmax = t("16:16")),
          (strengthAbsLink = "./web formatted jpgs/male_lessthan25_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/male_lessthan25_Run_Shuttle.webp"))
        : "Male 25-29" == e
        ? ((pushmin = 27),
          (pushmax = 62),
          (sitmin = 38),
          (sitmax = 56),
          (hrmin = 15),
          (hrmax = 40),
          (rsitmin = 20),
          (rsitmax = 48),
          (plankmin = 60),
          (plankmax = 210),
          (runmin = 562),
          (runmax = 982),
          (shuttleMin = 33),
          (shuttleMax = 97),
          (walkmax = t("16:16")),
          (strengthAbsLink = "./web formatted jpgs/male_25-29_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/male_25-29_cardio.webp"))
        : "Male 30-34" == e
        ? ((pushmin = 24),
          (pushmax = 57),
          (sitmin = 36),
          (sitmax = 54),
          (hrmin = 15),
          (hrmax = 40),
          (rsitmin = 19),
          (rsitmax = 47),
          (plankmin = 55),
          (plankmax = 205),
          (runmin = 574),
          (runmax = 1017),
          (shuttleMin = 30),
          (shuttleMax = 94),
          (walkmax = t("16:18")),
          (strengthAbsLink = "./web formatted jpgs/male_30-34_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/male_30-34_cardio.webp"))
        : "Male 35-39" == e
        ? ((pushmin = 21),
          (pushmax = 51),
          (sitmin = 34),
          (sitmax = 52),
          (hrmin = 15),
          (hrmax = 40),
          (rsitmin = 18),
          (rsitmax = 46),
          (plankmin = 50),
          (plankmax = 200),
          (runmin = 585),
          (runmax = 1054),
          (shuttleMin = 36),
          (shuttleMax = 100),
          (walkmax = t("16:18")),
          (strengthAbsLink = "./web formatted jpgs/male_35-39_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/male_35-39_cardio.webp"))
        : "Male 40-44" == e
        ? ((pushmin = 18),
          (pushmax = 44),
          (sitmin = 31),
          (sitmax = 50),
          (hrmin = 13),
          (hrmax = 38),
          (rsitmin = 16),
          (rsitmax = 44),
          (plankmin = 45),
          (plankmax = 195),
          (runmin = 598),
          (runmax = 1094),
          (shuttleMin = 24),
          (shuttleMax = 88),
          (walkmax = t("16:23")),
          (strengthAbsLink = "./web formatted jpgs/male_40-44_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/male_40-44_Run_Shuttle.webp"))
        : "Male 45-49" == e
        ? ((pushmin = 15),
          (pushmax = 44),
          (sitmin = 28),
          (sitmax = 48),
          (hrmin = 13),
          (hrmax = 38),
          (rsitmin = 11),
          (rsitmax = 43),
          (plankmin = 40),
          (plankmax = 190),
          (runmin = 610),
          (runmax = 1136),
          (shuttleMin = 22),
          (shuttleMax = 86),
          (walkmax = t("16:23")),
          (strengthAbsLink = "./web formatted jpgs/male_45-49_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/male_45-49_cardio.webp"))
        : "Male 50-54" == e
        ? ((pushmin = 12),
          (pushmax = 36),
          (sitmin = 25),
          (sitmax = 46),
          (hrmin = 11),
          (hrmax = 35),
          (rsitmin = 9),
          (rsitmax = 42),
          (plankmin = 35),
          (plankmax = 185),
          (runmin = 637),
          (runmax = 1233),
          (shuttleMin = 16),
          (shuttleMax = 80),
          (walkmax = t("16:40")),
          (strengthAbsLink = "./web formatted jpgs/male_50-54_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/male_50-54_cardio.webp"))
        : "Male 55-59" == e
        ? ((pushmin = 12),
          (pushmax = 33),
          (sitmin = 22),
          (sitmax = 44),
          (hrmin = 10),
          (hrmax = 33),
          (rsitmin = 8),
          (rsitmax = 41),
          (plankmin = 30),
          (plankmax = 180),
          (runmin = 651),
          (runmax = 1288),
          (shuttleMin = 13),
          (shuttleMax = 77),
          (walkmax = t("16:40")),
          (strengthAbsLink = "./web formatted jpgs/male_55-59_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/male_55-59_cardio.webp"))
        : "Male >60" == e
        ? ((pushmin = 11),
          (pushmax = 30),
          (sitmin = 19),
          (sitmax = 42),
          (hrmin = 10),
          (hrmax = 30),
          (rsitmin = 7),
          (rsitmax = 35),
          (plankmin = 25),
          (plankmax = 175),
          (runmin = 682),
          (runmax = 1348),
          (shuttleMin = 10),
          (shuttleMax = 71),
          (walkmax = t("16:58")),
          (strengthAbsLink = "./web formatted jpgs/male_over60_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/male_over60_cardio.webp"))
        : "Female < 25" == e
        ? ((pushmin = 15),
          (pushmax = 47),
          (sitmin = 35),
          (sitmax = 54),
          (hrmin = 6),
          (hrmax = 31),
          (rsitmin = 11),
          (rsitmax = 47),
          (plankmin = 55),
          (plankmax = 210),
          (runmin = t("10:23")),
          (runmax = t("18:56")),
          (shuttleMin = 22),
          (shuttleMax = 83),
          (walkmax = t("17:22")),
          (strengthAbsLink = "./web formatted jpgs/female_lessthan25_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/female_lessthan25_cardio.webp"))
        : "Female 25-29" == e
        ? ((pushmin = 14),
          (pushmax = 47),
          (sitmin = 31),
          (sitmax = 50),
          (hrmin = 6),
          (hrmax = 31),
          (rsitmin = 9),
          (rsitmax = 45),
          (plankmin = 50),
          (plankmax = 205),
          (runmin = t("10:37")),
          (runmax = t("19:43")),
          (shuttleMin = 19),
          (shuttleMax = 80),
          (walkmax = t("17:22")),
          (strengthAbsLink = "./web formatted jpgs/female_25-29_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/female_25-29_cardio.webp"))
        : "Female 30-34" == e
        ? ((pushmin = 11),
          (pushmax = 46),
          (sitmin = 26),
          (sitmax = 45),
          (hrmin = 6),
          (hrmax = 31),
          (rsitmin = 9),
          (rsitmax = 44),
          (plankmin = 45),
          (plankmax = 200),
          (runmin = t("10:51")),
          (runmax = t("20:33")),
          (shuttleMin = 16),
          (shuttleMax = 77),
          (walkmax = t("17:28")),
          (strengthAbsLink = "./web formatted jpgs/female_30-34_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/female_30-34_cardio.webp"))
        : "Female 35-39" == e
        ? ((pushmin = 10),
          (pushmax = 42),
          (sitmin = 24),
          (sitmax = 43),
          (hrmin = 6),
          (hrmax = 31),
          (rsitmin = 7),
          (rsitmax = 43),
          (plankmin = 45),
          (plankmax = 195),
          (runmin = t("11:06")),
          (runmax = t("21:28")),
          (shuttleMin = 13),
          (shuttleMax = 74),
          (walkmax = t("17:28")),
          (strengthAbsLink = "./web formatted jpgs/female_35-39_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/female_35-39_cardio.webp"))
        : "Female 40-44" == e
        ? ((pushmin = 8),
          (pushmax = 38),
          (sitmin = 21),
          (sitmax = 41),
          (hrmin = 4),
          (hrmax = 28),
          (rsitmin = 6),
          (rsitmax = 42),
          (plankmin = 35),
          (plankmax = 190),
          (runmin = t("11:22")),
          (runmax = t("22:28")),
          (shuttleMin = 10),
          (shuttleMax = 71),
          (walkmax = t("17:49")),
          (strengthAbsLink = "./web formatted jpgs/female_40-44_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/female_40-44_cardio.webp"))
        : "Female 45-49" == e
        ? ((pushmin = 7),
          (pushmax = 37),
          (sitmin = 19),
          (sitmax = 35),
          (hrmin = 4),
          (hrmax = 28),
          (rsitmin = 6),
          (rsitmax = 40),
          (plankmin = 30),
          (plankmax = 185),
          (runmin = t("11:38")),
          (runmax = t("23:34")),
          (shuttleMin = 7),
          (shuttleMax = 68),
          (walkmax = t("17:49")),
          (strengthAbsLink = "./web formatted jpgs/female_45-49_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/female_45-49_cardio.webp"))
        : "Female 50-54" == e
        ? ((pushmin = 6),
          (pushmax = 35),
          (sitmin = 17),
          (sitmax = 32),
          (hrmin = 1),
          (hrmax = 25),
          (rsitmin = 6),
          (rsitmax = 39),
          (plankmin = 25),
          (plankmax = 180),
          (runmin = t("12:53")),
          (runmax = t("24:46")),
          (shuttleMin = 5),
          (shuttleMax = 56),
          (walkmax = t("18:11")),
          (strengthAbsLink = "./web formatted jpgs/female_50-54_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/female_50-54_cardio.webp"))
        : "Female 55-59" == e
        ? ((pushmin = 5),
          (pushmax = 28),
          (sitmin = 12),
          (sitmax = 32),
          (hrmin = 1),
          (hrmax = 25),
          (rsitmin = 6),
          (rsitmax = 38),
          (plankmin = 20),
          (plankmax = 175),
          (runmin = t("13:14")),
          (runmax = t("26:06")),
          (shuttleMin = 2),
          (shuttleMax = 54),
          (walkmax = t("18:11")),
          (strengthAbsLink = "./web formatted jpgs/female_55-59_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/female_55-59_cardio.webp"))
        : "Female >60" == e &&
          ((pushmin = 4),
          (pushmax = 21),
          (sitmin = 8),
          (sitmax = 31),
          (hrmin = 1),
          (hrmax = 24),
          (rsitmin = 5),
          (rsitmax = 32),
          (plankmin = 15),
          (plankmax = 170),
          (runmin = t("14:00")),
          (runmax = t("27:27")),
          (shuttleMin = 1),
          (shuttleMax = 48),
          (walkmax = t("18:53")),
          (strengthAbsLink = "./web formatted jpgs/female_over60_Strength_Abs.webp"),
          (cardioLink = "./web formatted jpgs/female_over60_cardio.webp"));
}
function toggleMusicPlayer() {
    isAudioActive = !isAudioActive;
}
function pushInfoClick() {
    return (isModalActive = !isModalActive), cardioImg.hide(), shuttleImg.hide(), runAltitudeImg.hide(), walkAltitudeImg.hide(), walkImg.hide(), pushImg.show(), !1;
}
function cardioInfoClick() {
    return (isModalActive = !isModalActive), 
    pushImg.hide(), shuttleImg.hide(), 
    runAltitudeImg.hide(), 
    walkAltitudeImg.hide(), "Walk" == runSel.value() ? (walkImg.show(), cardioImg.hide()) : (cardioImg.show(), walkImg.hide()), !1;
}
function appInfoClick() {
    isModal2Active = !isModal2Active;
}
function toggleModal() {
    isModalActive = !isModalActive;
}
function toggleModal3() {
    isModal3Active = !isModal3Active;
}
function showShuttleCharts() {
    (isModalActive = !isModalActive), pushImg.hide(), shuttleImg.show(), cardioImg.hide(), runAltitudeImg.hide(), walkAltitudeImg.hide(), walkImg.hide();
}
function runAltitudeLinkClicked() {
    (isModalActive = !isModalActive), pushImg.hide(), shuttleImg.hide(), cardioImg.hide(), walkAltitudeImg.hide(), runAltitudeImg.show();
}
function walkAltitudeLinkClicked() {
    (isModalActive = !isModalActive), pushImg.hide(), shuttleImg.hide(), cardioImg.hide(), runAltitudeImg.hide(), walkAltitudeImg.show();
}
function txtInput() {
    this.value("");
}

function installApp() {
  firstload = false;
  // Show the prompt
  deferredPrompt.prompt();
  installButton.attribute("disabled", "");

  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then(choiceResult => {
    if (choiceResult.outcome === "accepted") {
      console.log("PWA setup accepted");
      installButton.attribute("hidden", "");
    } else {
      console.log("PWA setup rejected");
    }
    installButton.attribute("disabled", "");
    deferredPrompt = null;
  });
}
