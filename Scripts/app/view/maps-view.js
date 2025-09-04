var map;
let isInitializing = false;
var clientLat;
var clientLng;
var markerList = [];

waitForGoogleMaps()
    .then(() => {
        initMap();
    })
    .catch((err) => {
        console.error("โหลด Google Maps ไม่สำเร็จ:", err);
    });

async function waitForGoogleMaps(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();

        function check() {
            if (typeof google !== "undefined" && google.maps) {
                resolve();
            } else if (Date.now() - start > timeout) {
                reject(new Error("Google Maps API โหลดไม่ทันเวลา"));
            } else {
                setTimeout(check, 100);
            }
        }

        check();
    });
}

async function initMap() {
    map = await new google.maps.Map(document.getElementById("map"), {
        //center: { lat: 13.736717, lng: 100.523186 },
        //zoom: 16,
        mapId: "AIzaSyAdnE3rRU1dEs_x_APSdXiPIM28-3ng2dA",
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
    });

    await getDataToPaintOnMaps(true);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            clientLat = position.coords.latitude;
            clientLng = position.coords.longitude;

            map.panTo(new google.maps.LatLng(clientLat, clientLng));
            map.setZoom(18);

            ////var coords = new google.maps.LatLng(latitude, longitude);
            ////var mapOptions = {
            ////    zoom: 16,
            ////    center: coords,
            ////    mapTypeControl: false,
            ////    scaleControl: true,
            ////    streetViewControl: false,
            ////    rotateControl: false,
            ////    fullscreenControl: false,
            ////};

            //map = new google.maps.Map(document.getElementById("map"), {
            //    zoom: 16,
            //    center: { lat: clientLat, lng: clientLng },
            //    mapTypeControl: false,
            //    scaleControl: true,
            //    streetViewControl: false,
            //    rotateControl: false,
            //    fullscreenControl: false,
            //});
        },
            function error(msg) { console.log('Please enable your GPS position feature. (' + msg + ')'); },
            { timeout: 5000, enableHighAccuracy: true });
    } else {
        alert("Geolocation API is not supported in your browser.");
    }
};

async function getDataToPaintOnMaps(panMap) {
    //$.LoadingOverlay("show");

    fetch(ENDPOINT_URL.DATA_FOR_MAPS, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        }
    }).then(response => {
        //$.LoadingOverlay("hide");
        return response.json();
    }).then(result => {
        let viewModel = JSON.parse(JSON.stringify(result));

        if (viewModel.state == "success") {
            bindingMapsData(viewModel.data, panMap);
        } else {
            throw new Error(result.error);
        }
    }).catch(error => {
        throw new Error(error.message);
    });
};

async function bindingMapsData(data, panMap) {
    if (data != null) {
        let navbar = $("#filterProject");
        navbar.empty();

        $.each(data.projects, function (_, prj) {
            let projectRow = jQuery("<div></div>", {
                class: "border border-secondary mb-2 w-100"
            }).appendTo(navbar);

            let projectButton = jQuery("<a></a>", {
                class: "btn text-left ",
                href: "#" + prj.projectCode
            })
                .attr("data-toggle", "collapse")
                .attr("type", "button")
                .attr("aria-expanded", "false")
                .attr("aria-controls", prj.projectCode)
                .html("<i class='mdi mdi-folder menu-icon mr-2 '></i>" + prj.projectName)
                .appendTo(projectRow);

            let projectContainer = jQuery("<div></div>", {
                class: "collapse ml-3 mr-3",
                id: prj.projectCode
            }).html("<div class='card card-body'")
                .appendTo(projectRow);

            if (prj.controllers.length > 0) {
                $.each(prj.controllers, function (index, ctl) {
                    let controllerRow = jQuery("<div></div>", {
                        class: "row d-flex justify-content-between align-items-center"
                    }).appendTo(projectContainer);

                    if (ctl.latitude.length > 0 && ctl.longitude.length > 0) {
                        let controllerMarker = new google.maps.marker.AdvancedMarkerElement({
                            position: { lat: parseFloat(ctl.latitude), lng: parseFloat(ctl.longitude) },
                            title: ctl.controllerName,
                        });

                        markerList.push(controllerMarker);
                    }

                    let controllerButton = jQuery("<a></a>", {
                        class: "btn text-left",
                        href: "#controller-" + ctl.controllerCode
                    })
                        .attr("data-toggle", "collapse")
                        .attr("type", "button")
                        .attr("aria-expanded", "false")
                        .attr("aria-controls", "controller-" + ctl.controllerCode)
                        .attr("data-valkey", ctl.controllerCode)
                        .attr("data-latitude", ctl.latitude)
                        .attr("data-longitude", ctl.longitude)
                        .html("<i class='mdi mdi-remote menu-icon mr-2'></i><span class='d-inline-block text-truncate' style='max-width:100px;'>" + ctl.controllerName + "</span>")
                        .on("click", panMapToObject)
                        .appendTo(controllerRow);

                    let controllerStatusBadge;
                    switch (ctl.controllerStatus) {
                        case 0:
                            controllerStatusBadge = "badge-danger";
                            break;
                        case 1:
                            controllerStatusBadge = "badge-success";
                            break;
                    }
                    let controllerStatus = jQuery("<span></span>", {
                        class: "badge badge-pill " + controllerStatusBadge
                    })
                        .html(ctl.controllerStatusText)
                        .appendTo(controllerRow);

                    let controllerLampRow = jQuery("<div></div>", {

                    }).appendTo(projectContainer);

                    let controllerContainer = jQuery("<div></div>", {
                        class: "collapse ml-3 mb-3",
                        id: "controller-" + ctl.controllerCode
                    }).html("<div class='card card-body'")
                        .appendTo(controllerLampRow);

                    if (ctl.lamps.length > 0) {
                        $.each(ctl.lamps, function (_, lmp) {
                            let lampRow = jQuery("<div></div>", {
                                class: "row d-flex justify-content-between align-items-center"
                            }).appendTo(controllerContainer);

                            let lampStatusBadge;
                            let lampStatusIcon;
                            switch (lmp.lampStatus) {
                                case 0:
                                    lampStatusBadge = "badge-dark";
                                    lampStatusIcon = "images/map_icon/icon_light_off_48x48.png"
                                    break;
                                case 1:
                                    lampStatusBadge = "badge-warning";
                                    lampStatusIcon = "images/map_icon/icon_light_on_48x48.png"
                                    break;
                                case 2:
                                    lampStatusBadge = "badge-danger";
                                    lampStatusIcon = "images/map_icon/icon_light_error_48x48.png"
                                    break;
                            }

                            if (lmp.latitude.length > 0 && lmp.longitude.length > 0) {
                                const lampIconElement = document.createElement("img");
                                lampIconElement.src = lampStatusIcon;
                                lampIconElement.style.width = "48px";
                                lampIconElement.style.height = "48px";

                                let lampMarker = new google.maps.marker.AdvancedMarkerElement({
                                    position: { lat: parseFloat(lmp.latitude), lng: parseFloat(lmp.longitude) },
                                    title: lmp.lampName,
                                    content: lampIconElement,
                                });

                                markerList.push(lampMarker);

                                let lampNameInfo = new google.maps.InfoWindow({
                                    content: lmp.lampName
                                });

                                lampMarker.content.addEventListener("mouseover", () => {
                                    lampNameInfo.open(map, lampMarker);
                                });

                                lampMarker.content.addEventListener("mouseout", () => {
                                    lampNameInfo.close();
                                });

                                lampMarker.content.addEventListener("click", () => {
                                    //if (lmp.lampStatus == "2") {
                                    //    showDialog("error", "เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อหลอดไฟ \"" + lmp.lampCode + "\"")
                                    //    return;
                                    //}

                                    $("#controlLampSerialNo").val(lmp.lampCode);

                                    // clearControlModalInput();
                                    showControlModal(lmp.lampCode)

                                    // $.LoadingOverlay("show");
                                    // fetch(ENDPOINT_URL.LAMP_STATUS, {
                                    //     method: "POST",
                                    //     headers: {
                                    //         "Content-Type": "application/json; charset=utf-8"
                                    //     },
                                    //     body: JSON.stringify({ "lampCode": $("#controlLampSerialNo").val() })
                                    // }).then(response => {
                                    //     $.LoadingOverlay("hide");
                                    //     return response.json();
                                    // }).then(result => {
                                    //     let viewModel = JSON.parse(JSON.stringify(result));

                                    //     if (viewModel.state == "success") {
                                    //         clearControlModalInput();
                                    //         showControlModal(lmp.lampCode)
                                    //         // bindControlPanelViewModelToModal(viewModel.data);
                                    //         $("#controlInfoModal").modal("show");

                                    //     } else {
                                    //         showDialog(viewModel.state, viewModel.title, viewModel.message);
                                    //     }
                                    // }).catch(error => {
                                    //     console.log(error.message);
                                    //     showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
                                    // });
                                });
                            }

                            let lampButton = jQuery("<a></a>", {
                                class: "btn text-left",
                                href: "#" + lmp.lampCode
                            })
                                .attr("data-toggle", "collapse")
                                .attr("type", "button")
                                .attr("aria-expanded", "false")
                                .attr("aria-controls", lmp.lampCode)
                                .attr("data-valkey", lmp.lampCode)
                                .attr("data-latitude", lmp.latitude)
                                .attr("data-longitude", lmp.longitude)
                                .html("<i class='mdi mdi-lightbulb-on menu-icon mr-2'></i><span class='d-inline-block text-truncate' style='max-width:100px;'>" + lmp.lampName + "</span>")
                                .on("click", panMapToObject)
                                .appendTo(lampRow);

                            let lampStatus = jQuery("<span></span>", {
                                class: "badge badge-pill " + lampStatusBadge
                            })
                                .html(lmp.lampStatusText)
                                .appendTo(lampRow);
                        });
                    } else {
                        let noLampRow = jQuery("<div></div>", {
                            class: "row d-flex justify-content-center"
                        }).appendTo(controllerContainer);

                        let noLampStatus = jQuery("<span></span>", {
                            class: "badge badge-pill badge-dark"
                        })
                            .html("ไม่มีหลอดไฟ")
                            .appendTo(noLampRow);
                    }
                });
            } else {
                let noControllerRow = jQuery("<div></div>", {
                    class: "row d-flex justify-content-center mb-2"
                }).appendTo(projectContainer);

                let noControllerStatus = jQuery("<span></span>", {
                    class: "badge badge-pill badge-dark"
                })
                    .html("ไม่มีกล่องควบคุม")
                    .appendTo(noControllerRow);
            }
        });

        showMarkersOnMap(map, panMap);
    }
};

function panMapToObject() {
    let latitude = $(this).attr("data-latitude");
    let longitude = $(this).attr("data-longitude");

    if (latitude.length > 0 && longitude.length > 0) {
        map.panTo(new google.maps.LatLng(parseFloat(latitude), parseFloat(longitude)));
        map.setZoom(18);
    }
};

function showMarkersOnMap(_map, panMap) {
    if (markerList != null && markerList.length > 0) {
        let hasPan = panMap;

        $.each(markerList, function (_, marker) {
            marker.map = _map;

            if (hasPan) {
                _map.panTo(new google.maps.LatLng(marker.position.lat, marker.position.lng));
                hasPan = false;
            }
        });
    }
}

function modalPermission() {
        
    if ($("#parentRole").attr("data-valkey") == "1") {
    $("#controlActionList").prop("disabled", true);
    $("#controlRelayState").prop("disabled", true);
    $("#controlRangeWarm").prop("disabled", true);
    $("#controlRangeCool").prop("disabled", true);
    $("#control-send-manual").remove();

    for (let i = 0; i < 5; i++) {
        let index = i + 1;
        $(`#schedule_${index}_start`).prop('disabled', true);
        $(`#schedule_${index}_end`).prop('disabled', true);
        $(`#schedule_${index}_controlRangeWarm`).prop('disabled', true);
        $(`#schedule_${index}_controlRangeCool`).prop('disabled', true);
    }
}

};

function showControlModal(mac) {
    firstloadmanual = true;
    firstloadauto = true;
    // const macaddress = 'F412FA4A47E1';
    const macaddress = mac;
    const endpoint = `https://85.204.247.82:3002/api/getmacdatas/${macaddress}`;
    const options = {
        method: "GET",
    };

    if ($(this).attr("data-status") == "2") {
        Swal.fire({
            title: "เกิดข้อผิดพลาด",
            html: `ไม่สามารถเชื่อมต่อหลอดไฟ <strong>"${$(this).attr(
                "data-valkey"
            )}"</strong> ได้`,
            icon: "error",
        });
        return;
    }

    // setTimeout(() => {
    fetch(endpoint, options)
        .then((res) => {

            $("#controlInfoModal").LoadingOverlay("hide");
            //                     Swal.fire({
            //                         position: "center",
            //                         icon: 'success',
            //                         title: "สำเร็จ",
            //                         html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
            //   ✅ ดึงข้อมูลอุปกรณ์ <strong style="color: #1b5e20;">${macaddress}</strong> สำเร็จ
            // </div>`,
            //                         showConfirmButton: false,
            //                         timer: 1500
            //                     })
            return res.json();
        })
        .then((result) => {

            if (!result.data[0]) {
                Swal.fire({
                    icon: "error",
                    title: "❌ ไม่มีข้อมูลอุปกรณ์ !",
                    html: `
<div style="font-size: 16px; color: #b71c1c;">
ไม่สามารถดึงข้อมูลอุปกรณ์ <strong>${mac}</strong>
</div>
`,
                });
                return
            }
            modalPermission();
            // clearControlModalInput();

            setTimeout(() => {
                bindControlPanelViewModelToModal(result);
            }, 20);

            // if (viewModel.state == "success") {
            //     clearControlModalInput();
            //     bindControlPanelViewModelToModal(viewModel.data);
            //     $("#controlInfoModal").modal("show");
            // } else {
            //     showDialog(viewModel.state, viewModel.title, viewModel.message);
            // }
        })
        .catch((error) => {
            console.log(error.message);
            Swal.fire({
                position: "center",
                icon: "error",
                title: "ผิดพลาด!",
                html: `ดึงข้อมูลอุปกรณ์ <b>${macaddress}</b> ไม่สำเร็จ`,
                showConfirmButton: false,
                timer: 1500,
            });
        });
    // }, 1000)
}

function bindControlPanelViewModelToModal(obj) {
    isInitializing = true;
    let relay = obj.data[0]?.relay;
    let workmode = obj.data[0]?.workmode;

    const relayMap = {
        ON: "เปิด",
        OFF: "ปิด",
    };

    const workmodeMap = {
        MANUAL: "กำหนดการทำงานด้วยตนเอง",
        SCHEDULE: "ตั้งเวลาทำงานอัตโนมัติ",
    };

    relay = relayMap[relay] || relay;
    workmode = workmodeMap[workmode] || workmode;

    // $("#controlMode").val(viewModel.mode);
    // $("#controlProjectType").val(viewModel.projectType);
    // $("#controlControllerCode").val(viewModel.controllerCode);
    $("#controlLampSerialNo").val(obj.data[0]?.macAddress);
    $("#controlGroup").val(obj.data[0]?.mid);
    $("#controlLampName").val(obj.data[0]?.tag);
    $("#controlStaRelay").val(relay);
    $("#controlStaMode").val(workmode);
    $("#controlStaCurrent").val(obj.data[0]?.pwm_freq);
    // $("#controlStaAmLight").val(obj.data[0]?.mesh_mode);
    $("#datetimeSta").val(obj.data[0]?.datetime);
    $("#controlStaPWM1_Text").text(obj.data[0]?.pwm1);
    $("#controlStaPWM1_rangeWarm").val(obj.data[0]?.pwm1);
    $("#controlStaPWM2_Text").text(obj.data[0]?.pwm2);
    $("#controlStaPWM2_rangeCool").val(obj.data[0]?.pwm2);
    $("#controlRangeWarm").val(obj.data[0]?.pwm1);
    $("#controlRangeCool").val(obj.data[0]?.pwm2);
    $("#rangeWarm").text(obj.data[0]?.pwm1);
    $("#rangeCool").text(obj.data[0]?.pwm2);

    if (obj.data[0]?.workmode === "MANUAL") {
        console.log("MANUAL");
        $("#controlActionList").val(obj.data[0]?.workmode).trigger("change");
        $("#control-send-manual").removeClass("d-none");
        $("#control-send-schedule").addClass("d-none");
        $("#manual").fadeIn();
        $("#schedule").fadeOut();
        $("#pills-tabContent").fadeIn();
        $("#pills-tabContent").removeClass("d-none");
        $("#schedule").removeClass("active show");
        $("#manual").addClass("active show");
        $("#schedule-tab").removeClass("active");
        $("#schedule-tab").addClass("disabled");
        $("#manual-tab").addClass("active");
        $(".n-pills").removeClass("d-none");
    } else if (obj.data[0]?.workmode === "SCHEDULE") {
        // console.log("SCHEDULE")
        let mode = obj.data[0]?.workmode;
        if (mode === "SCHEDULE") {
            mode = "SET_SCHEDULE";
        }
        scheduleFunction(obj);
        modalPermission()
        $("#control-send-schedule").removeClass("d-none");
        $("#control-send-manual").addClass("d-none");
        $("#controlActionList").val(mode).trigger("change");
        $("#schedule").fadeIn();
        $("#manual").fadeOut();
        $("#pills-tabContent").fadeIn();
        $("#pills-tabContent").removeClass("d-none");
        $("#manual").removeClass("active show");
        $("#schedule").addClass("active show");
        $("#manual-tab").removeClass("active");
        $("#schedule-tab").addClass("active");
        $("#manual-tab").addClass("disabled");
        $(".n-pills").removeClass("d-none");
    }

    toggleStatus(obj.data[0]?.relay);
    toggleStatus2(obj.data[0]?.relay);

    firstloadmanual = false;
    firstloadauto = false;
    isInitializing = false;

    delay(2000);
    $("#controlInfoModal").modal("show");
}

function scheduleFunction(obj) {

    if (!schedultab) return


    const currentCount = $('#scheduleList li').length;
    const period = currentCount + 1;

    $('#scheduleList li').fadeOut(300, function () {
        $(this).remove();
        $('#period').text('1')
    });

    if (obj) {
        const resp = obj.data[0]
        const filteredSchedules = [];

        for (let i = 1; i <= 5; i++) {
            if (resp[`schActive${i}`] === "true") {
                filteredSchedules.push({
                    startTime: resp[`schStartTime${i}`],
                    endTime: resp[`schEndTime${i}`],
                    pwm1: resp[`schPwm1${i}`],
                    pwm2: resp[`schPwm2${i}`],
                    active: resp[`schActive${i}`]
                });
            }
        }

        for (let i = 0; i < filteredSchedules.length; i++) {
            createScheduleLi(i + 1, filteredSchedules[i]);
        }
        schedultab = false
        return
    }


    const $li = $(`
<li class="col-md-12 mb-3" style="display: none;">
  <div class="config-box">
  <div class="col-md-12 d-flex justify-content-center align-items-center">
  <div class="col-md-4">
    <div class="col-md-12">
    <div class="mb-3">
<h2 class="text-center">🕒 ช่วงเวลาที่ ${period} </h2>
<input type="hidden" id="no" value="${period}">
</div>
<hr>
    <div class="form-group">
      <label for="schedule_${period}_start">ตั้งแต่เวลา</label>
      <input type="text" class="form-control datetimepicker-input" id="schedule_${period}_start" data-toggle="datetimepicker" autocomplete="off" data-target="#schedule_${period}_start"/>
    </div>

    <div class="form-group">
    <label for="schedule_${period}_end">ถึงเวลา</label>
      <input type="text" class="form-control datetimepicker-input" id="schedule_${period}_end" data-toggle="datetimepicker" autocomplete="off" data-target="#schedule_${period}_end" />
    </div>
    </div>
    </div>

    <div class="col-md-8">
    <div class="sliders-wrapper">
      <div class="slider-box">
        <label>แสงอุ่น</label>
        <input type="range" min="0" max="100" value="0" class="brightness-slider-warm py-2" id="schedule_${period}_controlRangeWarm" onInput="$('#schedule_${period}_rangeWarm').html($(this).val())">
        <div class="slider-marks">
          <div class="slider-mark"><div>|</div><div>0</div></div>
          <div class="slider-mark"><div>|</div><div>20</div></div>
          <div class="slider-mark"><div>|</div><div>40</div></div>
          <div class="slider-mark"><div>|</div><div>60</div></div>
          <div class="slider-mark"><div>|</div><div>80</div></div>
          <div class="slider-mark"><div>|</div><div>100</div></div>
        </div>
        <div class="light-info-box-warm">
          <p class="label">กำหนดค่าแสงอุ่น</p>
          <hr>
          <p class="value" id="schedule_${period}_rangeWarm">0</p>
        </div>
      </div>

      <div class="slider-box">
        <label>แสงเย็น</label>
        <input type="range" min="0" max="100" value="0" class="brightness-slider-cool py-2" id="schedule_${period}_controlRangeCool" onInput="$('#schedule_${period}_rangeCool').html($(this).val())">
        <div class="slider-marks">
          <div class="slider-mark"><div>|</div><div>0</div></div>
          <div class="slider-mark"><div>|</div><div>20</div></div>
          <div class="slider-mark"><div>|</div><div>40</div></div>
          <div class="slider-mark"><div>|</div><div>60</div></div>
          <div class="slider-mark"><div>|</div><div>80</div></div>
          <div class="slider-mark"><div>|</div><div>100</div></div>
        </div>
        <div class="light-info-box-cool">
          <p class="label">กำหนดค่าแสงเย็น</p>
          <hr>
          <p class="value" id="schedule_${period}_rangeCool">0</p>
        </div>
      </div>
      </div>
    </div>
    <div class="d-flex justify-content-end mt-4">
      <button type="button" class="btn btn-danger btn-sm remove-btn" title="ลบ" disabled>
        <i class="fa fa-trash"></i>
      </button>
    </div>
    </div>
    </div>
  </div>
</li>
`);

    $('#scheduleList').append($li);
    $li.fadeIn(function () {
        const $start = $(`#schedule_${period}_start`);
        const $end = $(`#schedule_${period}_end`);

        $start.on('keydown paste', function (e) {
            e.preventDefault();
        });

        $end.on('keydown paste', function (e) {
            e.preventDefault();
        });

        const prevPeriod = period - 1;
        const nextPeriod = period + 1;
        let previousStart = null;
        let previousDuration = null;

        [$start, $end].forEach($el => {
            $el.datetimepicker({
                format: "HH:mm",
                icons: {
                    time: 'fa fa-clock',
                    date: 'fa fa-calendar',
                    up: 'fa fa-chevron-up',
                    down: 'fa fa-chevron-down',
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-calendar-check',
                    clear: 'fa fa-trash',
                    close: 'fa fa-times'
                }
            });
        });

        if (period > 1) {
            const prevEndVal = $(`#schedule_${prevPeriod}_end`).val();
            if (prevEndVal) {
                const startMoment = moment(prevEndVal, 'HH:mm');
                $start.datetimepicker('date', startMoment);
                $end.datetimepicker('date', startMoment.clone().add(1, 'hours'));
            } else {
                $start.datetimepicker('date', moment('00:00', 'HH:mm'));
                $end.datetimepicker('date', moment('01:00', 'HH:mm'));
            }
        } else {
            $start.datetimepicker('date', moment('00:00', 'HH:mm'));
            $end.datetimepicker('date', moment('01:00', 'HH:mm'));
        }

        $(`#schedule_${period}_rangeWarm`).text("0");
        $(`#schedule_${period}_controlRangeWarm`).val("0");
        $(`#schedule_${period}_rangeCool`).text("0");
        $(`#schedule_${period}_controlRangeCool`).val("0");

        $start.on("show.datetimepicker", function () {
            const start = moment($start.val(), 'HH:mm');
            const end = moment($end.val(), 'HH:mm');
            if (start.isValid() && end.isValid() && end.isAfter(start)) {
                previousStart = start.format('HH:mm');
                previousDuration = moment.duration(end.diff(start));
            }
        });

        $start.on("change.datetimepicker", function (e) {
            const start = moment(e.date, 'HH:mm');

            const firstStartVal = $('#schedule_1_start').val();
            const firstStart = moment(firstStartVal, 'HH:mm');

            if (!start.isValid() || start.isSameOrAfter(moment('23:00', 'HH:mm')) || start.hour() >= 23 || firstStart.isBefore(moment('00:00', 'HH:mm'))) {
                Swal.fire({
                    title: 'แจ้งเตือน',
                    html: '<h4 style="color:#333;font-weight:normal;">เป็นเวลาของวันที่แล้ว ไม่สามารถเลือกได้</h4>',
                    icon: 'warning',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                    customClass: {
                        popup: 'swal2-modern-popup',
                        title: 'swal2-modern-title',
                        content: 'swal2-modern-content'
                    }
                }).then(() => {
                    $start.datetimepicker('date', moment('00:00', 'HH:mm'));
                });
                return;
            }

            // for (let i = 1; i < period; i++) {
            //     const prevEndVal = $(`#schedule_${i}_end`).val();
            //     if (prevEndVal && start.isBefore(moment(prevEndVal, 'HH:mm'))) {
            //         Swal.fire({
            //             title: 'แจ้งเตือน',
            //             html: `<h4 style="color:#333;font-weight:normal;">ช่วงเวลาที่ ${period} ต้องไม่เริ่มก่อนช่วงเวลาที่ ${i}</h4>`,
            //             icon: 'warning',
            //             confirmButtonText: 'ตกลง',
            //             confirmButtonColor: '#d33',
            //             background: '#fff',
            //             customClass: {
            //                 popup: 'swal2-modern-popup',
            //                 title: 'swal2-modern-title',
            //                 content: 'swal2-modern-content'
            //             }
            //         });
            //         if (previousStart) {
            //             $start.datetimepicker('date', moment(previousStart, 'HH:mm'));
            //         }
            //         return;
            //     }
            // }

            const newEnd = previousDuration
                ? moment(start).add(previousDuration)
                : moment(start).add(1, 'hours');
            $end.datetimepicker('date', newEnd);

            const $nextStart = $(`#schedule_${nextPeriod}_start`);
            const $nextEnd = $(`#schedule_${nextPeriod}_end`);
            if ($nextStart.length && $nextEnd.length) {
                const nextStartVal = $nextStart.val();
                const nextEndVal = $nextEnd.val();
                let nextDuration = moment.duration(1, 'hours'); // default

                if (nextStartVal && nextEndVal) {
                    const nextStart = moment(nextStartVal, 'HH:mm');
                    const nextEnd = moment(nextEndVal, 'HH:mm');
                    if (nextEnd.isAfter(nextStart)) {
                        nextDuration = moment.duration(nextEnd.diff(nextStart));
                    }
                }

                $nextStart.datetimepicker('date', newEnd);
                $nextEnd.datetimepicker('date', moment(newEnd).add(nextDuration));
            }

        });

        let previousEnd = null;

        $(`#schedule_${period}_end`).on("show.datetimepicker", function () {
            previousEnd = $(`#schedule_${period}_end`).val();
        });

        $(`#schedule_${period}_end`).on("change.datetimepicker", function (e) {
            const end = moment(e.date, 'HH:mm');
            const startVal = $(`#schedule_${period}_start`).val();
            const limitMoment = moment('23:59', 'HH:mm');

            if (startVal) {
                const start = moment(startVal, 'HH:mm');

                if (period === 1 && end.isSameOrAfter(limitMoment)) {
                    Swal.fire({
                        title: 'แจ้งเตือน',
                        html: `<h4 style="color:#333;font-weight:normal;">เวลาสิ้นสุดต้องไม่เกินเที่ยงคืนหรือเท่ากับ 23:59 </h4>`,
                        icon: 'warning',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#d33',
                        background: '#fff',
                        customClass: {
                            popup: 'swal2-modern-popup',
                            title: 'swal2-modern-title',
                            content: 'swal2-modern-content'
                        }
                    });

                    const startVal = $(`#schedule_${period}_start`).val();
                    if (startVal) {
                        const newEnd = moment(startVal, 'HH:mm').add(1, 'hours');
                        $(`#schedule_${period}_end`).datetimepicker('date', newEnd);
                    }
                    return;
                }

                if (period === 1 && end.isBefore(start)) {
                    Swal.fire({
                        title: 'แจ้งเตือน',
                        html: `<h4 style="color:#333;font-weight:normal;">เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น</h4>`,
                        icon: 'warning',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#d33',
                        background: '#fff',
                        customClass: {
                            popup: 'swal2-modern-popup',
                            title: 'swal2-modern-title',
                            content: 'swal2-modern-content'
                        }
                    });

                    const startVal = $(`#schedule_${period}_start`).val();
                    if (startVal) {
                        const newEnd = moment(startVal, 'HH:mm').add(1, 'hours');
                        $(`#schedule_${period}_end`).datetimepicker('date', newEnd);
                    }
                    return;
                }
            }

            for (let i = 1; i < period; i++) {
                const prevEndVal = $(`#schedule_${i}_end`).val();
                if (prevEndVal) {
                    const prevEnd = moment(prevEndVal, 'HH:mm');
                    if (end.isBefore(prevEnd)) {
                        Swal.fire({
                            title: 'แจ้งเตือน',
                            html: `<h4 style="color:#333;font-weight:normal;">ช่วงเวลาที่ ${period} ต้องสิ้นสุดหลังจากช่วงเวลาที่ ${i}</h4>`,
                            icon: 'warning',
                            confirmButtonText: 'ตกลง',
                            confirmButtonColor: '#d33',
                            background: '#fff',
                            customClass: {
                                popup: 'swal2-modern-popup',
                                title: 'swal2-modern-title',
                                content: 'swal2-modern-content'
                            }
                        });

                        $(`#schedule_${period}_end`).datetimepicker('date', prevEnd); // <<< ใช้ prevEnd
                        return;
                    }
                }
            }

            const nextPeriod = period + 1;
            const $nextStart = $(`#schedule_${nextPeriod}_start`);
            if ($nextStart.length) {
                const nextStartVal = $nextStart.val();
                if (!nextStartVal || moment(nextStartVal, 'HH:mm').isBefore(end)) {
                    $nextStart.datetimepicker('date', end);
                }
            }

        });
    });

    $li.find('.remove-btn').on('click', function () {

        if (periodall <= 1) return

        $li.fadeOut(function () {
            $li.remove();
            updatePeriodNumbersAll();
        });
    });

    schedultab = false
    modalPermission()
}

let schedultab = true;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createScheduleLi(period, scheduleData) {
    $('#period').text(period);

    const $li = $(`
    <li class="col-md-12 mb-3" style="display: none;">
      <div class="config-box">
      <div class="col-md-12 d-flex justify-content-center align-items-center">
      <div class="col-md-4">
        <div class="col-md-12">
        <div class="mb-3">
  <h2 class="text-center">🕒 ช่วงเวลาที่ ${period} </h2>
  <input type="hidden" id="no" value="${period}">
</div>
<hr>
        <div class="form-group">
          <label for="schedule_${period}_start">ตั้งแต่เวลา</label>
          <input type="text" class="form-control datetimepicker-input" id="schedule_${period}_start" data-toggle="datetimepicker" autocomplete="off" data-target="#schedule_${period}_start"/>
        </div>

        <div class="form-group">
        <label for="schedule_${period}_end">ถึงเวลา</label>
          <input type="text" class="form-control datetimepicker-input" id="schedule_${period}_end" data-toggle="datetimepicker" autocomplete="off" data-target="#schedule_${period}_end" />
        </div>
        </div>
        </div>

        <div class="col-md-8">
        <div class="sliders-wrapper">
          <div class="slider-box">
            <label>แสงอุ่น</label>
            <input type="range" min="0" max="100" value="0" class="brightness-slider-warm py-2" id="schedule_${period}_controlRangeWarm" onInput="$('#schedule_${period}_rangeWarm').html($(this).val())">
            <div class="slider-marks">
              <div class="slider-mark"><div>|</div><div>0</div></div>
              <div class="slider-mark"><div>|</div><div>20</div></div>
              <div class="slider-mark"><div>|</div><div>40</div></div>
              <div class="slider-mark"><div>|</div><div>60</div></div>
              <div class="slider-mark"><div>|</div><div>80</div></div>
              <div class="slider-mark"><div>|</div><div>100</div></div>
            </div>
            <div class="light-info-box-warm">
              <p class="label">กำหนดค่าแสงอุ่น</p>
              <hr>
              <p class="value" id="schedule_${period}_rangeWarm">0</p>
            </div>
          </div>

          <div class="slider-box">
            <label>แสงเย็น</label>
            <input type="range" min="0" max="100" value="0" class="brightness-slider-cool py-2" id="schedule_${period}_controlRangeCool" onInput="$('#schedule_${period}_rangeCool').html($(this).val())">
            <div class="slider-marks">
              <div class="slider-mark"><div>|</div><div>0</div></div>
              <div class="slider-mark"><div>|</div><div>20</div></div>
              <div class="slider-mark"><div>|</div><div>40</div></div>
              <div class="slider-mark"><div>|</div><div>60</div></div>
              <div class="slider-mark"><div>|</div><div>80</div></div>
              <div class="slider-mark"><div>|</div><div>100</div></div>
            </div>
            <div class="light-info-box-cool">
              <p class="label">กำหนดค่าแสงเย็น</p>
              <hr>
              <p class="value" id="schedule_${period}_rangeCool">0</p>
            </div>
          </div>
          </div>
        </div>
        <div class="d-flex justify-content-end mt-4">
          <button type="button" class="btn btn-danger btn-sm remove-btn" title="ลบ">
            <i class="fa fa-trash"></i>
          </button>
        </div>
        </div>
        </div>
      </div>
    </li>
  `);

    $('#scheduleList').append($li);
    $li.fadeIn(function () {
        const $start = $(`#schedule_${period}_start`);
        const $end = $(`#schedule_${period}_end`);

        $start.on('keydown paste', function (e) {
            e.preventDefault();
        });

        $end.on('keydown paste', function (e) {
            e.preventDefault();
        });

        const prevPeriod = period - 1;
        const nextPeriod = period + 1;
        let previousStart = null;
        let previousDuration = null;

        [$start, $end].forEach($el => {
            $el.datetimepicker({
                format: "HH:mm",
                icons: {
                    time: 'fa fa-clock',
                    date: 'fa fa-calendar',
                    up: 'fa fa-chevron-up',
                    down: 'fa fa-chevron-down',
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-calendar-check',
                    clear: 'fa fa-trash',
                    close: 'fa fa-times'
                }
            });
        });

        if (period > 1) {
            const prevEndVal = $(`#schedule_${prevPeriod}_end`).val();
            if (prevEndVal) {
                const startMoment = moment(prevEndVal, 'HH:mm');
                $start.datetimepicker('date', startMoment);
                $end.datetimepicker('date', startMoment.clone().add(1, 'hours'));
            } else {
                $start.datetimepicker('date', moment('00:00', 'HH:mm'));
                $end.datetimepicker('date', moment('01:00', 'HH:mm'));
            }
        } else {
            $start.datetimepicker('date', moment('00:00', 'HH:mm'));
            $end.datetimepicker('date', moment('01:00', 'HH:mm'));
        }

        $(`#schedule_${period}_rangeWarm`).text("0");
        $(`#schedule_${period}_controlRangeWarm`).val("0");
        $(`#schedule_${period}_rangeCool`).text("0");
        $(`#schedule_${period}_controlRangeCool`).val("0");

        $start.on("show.datetimepicker", function () {
            const start = moment($start.val(), 'HH:mm');
            const end = moment($end.val(), 'HH:mm');
            if (start.isValid() && end.isValid() && end.isAfter(start)) {
                previousStart = start.format('HH:mm');
                previousDuration = moment.duration(end.diff(start));
            }
        });

        $start.on("change.datetimepicker", function (e) {
            const start = moment(e.date, 'HH:mm');

            const firstStartVal = $('#schedule_1_start').val();
            const firstStart = moment(firstStartVal, 'HH:mm');

            if (!start.isValid() || start.isSameOrAfter(moment('23:00', 'HH:mm')) || start.hour() >= 23 || firstStart.isBefore(moment('00:00', 'HH:mm'))) {
                Swal.fire({
                    title: 'แจ้งเตือน',
                    html: '<h4 style="color:#333;font-weight:normal;">เป็นเวลาของวันที่แล้ว ไม่สามารถเลือกได้</h4>',
                    icon: 'warning',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                    customClass: {
                        popup: 'swal2-modern-popup',
                        title: 'swal2-modern-title',
                        content: 'swal2-modern-content'
                    }
                }).then(() => {
                    $start.datetimepicker('date', moment('00:00', 'HH:mm'));
                });
                return;
            }

            const newEnd = previousDuration
                ? moment(start).add(previousDuration)
                : moment(start).add(1, 'hours');
            $end.datetimepicker('date', newEnd);

            const $nextStart = $(`#schedule_${nextPeriod}_start`);
            const $nextEnd = $(`#schedule_${nextPeriod}_end`);
            if ($nextStart.length && $nextEnd.length) {
                const nextStartVal = $nextStart.val();
                const nextEndVal = $nextEnd.val();
                let nextDuration = moment.duration(1, 'hours'); // default

                if (nextStartVal && nextEndVal) {
                    const nextStart = moment(nextStartVal, 'HH:mm');
                    const nextEnd = moment(nextEndVal, 'HH:mm');
                    if (nextEnd.isAfter(nextStart)) {
                        nextDuration = moment.duration(nextEnd.diff(nextStart));
                    }
                }

                $nextStart.datetimepicker('date', newEnd);
                $nextEnd.datetimepicker('date', moment(newEnd).add(nextDuration));
            }

        });

        let previousEnd = null;

        $(`#schedule_${period}_end`).on("show.datetimepicker", function () {
            previousEnd = $(`#schedule_${period}_end`).val();
        });

        $(`#schedule_${period}_end`).on("change.datetimepicker", function (e) {
            const end = moment(e.date, 'HH:mm');
            const startVal = $(`#schedule_${period}_start`).val();
            const limitMoment = moment('23:59', 'HH:mm');

            if (startVal) {
                const start = moment(startVal, 'HH:mm');

                if (period === 1 && end.isSameOrAfter(limitMoment)) {
                    Swal.fire({
                        title: 'แจ้งเตือน',
                        html: `<h4 style="color:#333;font-weight:normal;">เวลาสิ้นสุดต้องไม่เกินเที่ยงคืนหรือเท่ากับ 23:59 </h4>`,
                        icon: 'warning',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#d33',
                        background: '#fff',
                        customClass: {
                            popup: 'swal2-modern-popup',
                            title: 'swal2-modern-title',
                            content: 'swal2-modern-content'
                        }
                    });

                    const startVal = $(`#schedule_${period}_start`).val();
                    if (startVal) {
                        const newEnd = moment(startVal, 'HH:mm').add(1, 'hours');
                        $(`#schedule_${period}_end`).datetimepicker('date', newEnd);
                    }
                    return;
                }

                if (period === 1 && end.isBefore(start)) {
                    Swal.fire({
                        title: 'แจ้งเตือน',
                        html: `<h4 style="color:#333;font-weight:normal;">เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น</h4>`,
                        icon: 'warning',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#d33',
                        background: '#fff',
                        customClass: {
                            popup: 'swal2-modern-popup',
                            title: 'swal2-modern-title',
                            content: 'swal2-modern-content'
                        }
                    });

                    const startVal = $(`#schedule_${period}_start`).val();
                    if (startVal) {
                        const newEnd = moment(startVal, 'HH:mm').add(1, 'hours');
                        $(`#schedule_${period}_end`).datetimepicker('date', newEnd);
                    }
                    return;
                }
            }

            for (let i = 1; i < period; i++) {
                const prevEndVal = $(`#schedule_${i}_end`).val();
                if (prevEndVal) {
                    const prevEnd = moment(prevEndVal, 'HH:mm');
                    if (end.isBefore(prevEnd)) {
                        Swal.fire({
                            title: 'แจ้งเตือน',
                            html: `<h4 style="color:#333;font-weight:normal;">ช่วงเวลาที่ ${period} ต้องสิ้นสุดหลังจากช่วงเวลาที่ ${i}</h4>`,
                            icon: 'warning',
                            confirmButtonText: 'ตกลง',
                            confirmButtonColor: '#d33',
                            background: '#fff',
                            customClass: {
                                popup: 'swal2-modern-popup',
                                title: 'swal2-modern-title',
                                content: 'swal2-modern-content'
                            }
                        });

                        $(`#schedule_${period}_end`).datetimepicker('date', prevEnd); // <<< ใช้ prevEnd
                        return;
                    }
                }
            }

            const nextPeriod = period + 1;
            const $nextStart = $(`#schedule_${nextPeriod}_start`);
            if ($nextStart.length) {
                const nextStartVal = $nextStart.val();
                if (!nextStartVal || moment(nextStartVal, 'HH:mm').isBefore(end)) {
                    $nextStart.datetimepicker('date', end);
                }
            }
        });
    });

    $li.fadeIn(function () {
        $(`#schedule_${period}_start`).val(scheduleData.startTime);
        $(`#schedule_${period}_end`).val(scheduleData.endTime);
        $(`#schedule_${period}_controlRangeWarm`).val(scheduleData.pwm1).trigger('input');
        $(`#schedule_${period}_controlRangeCool`).val(scheduleData.pwm2).trigger('input');
    });

    $li.find('.remove-btn').on('click', function () {

        if (period <= 1) return

        $li.fadeOut(function () {
            $li.remove();
            updatePeriodNumbers();
        });
    });

    // schedultab = false
}

const toggleStatus = (relay) => {
    const controlRelay = $("#controlRelayState");
    const transbox = $("#transbox");
    const subtransbox = $("#subtransbox");

    controlRelay.val(relay);
    if (relay === "OFF") {
        const btn = $("#control-send-manual");
        controlRelay.bootstrapToggle("off");
        $("#controlActionManual").fadeOut();
    } else if (relay === "ON") {
        const btn = $("#control-send-manual");

        btn.removeClass("btn-secondary");
        btn.addClass("btn-success");
        btn.removeAttr("disabled");
        controlRelay.bootstrapToggle("on");
    }
};

const toggleStatus2 = (relay) => {
    const controlRelay = $("#controlRelayState2");
    controlRelay.val(relay);
    if (relay === "OFF") {
        controlRelay.bootstrapToggle("off");
    } else if (relay === "ON") {
        controlRelay.bootstrapToggle("on");
    }
};

document.querySelector('#addschedule').addEventListener('click', async function (e) {
    e.preventDefault();

    await new Promise(resolve => setTimeout(resolve, 300));

    const currentCount = $('#scheduleList li').length;
    const period = currentCount + 1;

    $('#period').text(period)

    if (period > 5) return

    if (period >= 5) {
        Swal.fire({
            title: "จำกัดจำนวนการตั้งเวลา",
            text: "คุณสามารถตั้งได้สูงสุด 5 ช่วงเวลาเท่านั้น",
            icon: "warning",
            confirmButtonText: "เข้าใจแล้ว",
            confirmButtonColor: "#3085d6",
            backdrop: true,
            customClass: {
                popup: 'swal2-rounded',
            }
        });
        const addBtn = $('#addschedule')
        addBtn.prop("disabled", true);
        addBtn.removeClass("btn-success");
        addBtn.addClass("btn-secondary")
    }

    const $li = $(`
    <li class="col-md-12 mb-3" style="display: none;">
      <div class="config-box">
      <div class="col-md-12 d-flex justify-content-center align-items-center">
      <div class="col-md-4">
        <div class="col-md-12">
        <div class="mb-3">
  <h2 class="text-center">🕒 ช่วงเวลาที่ ${period} </h2>
  <input type="hidden" id="no" value="${period}">
</div>
<hr>
        <div class="form-group">
          <label for="schedule_${period}_start">ตั้งแต่เวลา</label>
          <input type="text" class="form-control datetimepicker-input" id="schedule_${period}_start" data-toggle="datetimepicker" autocomplete="off" data-target="#schedule_${period}_start"/>
        </div>

        <div class="form-group">
        <label for="schedule_${period}_end">ถึงเวลา</label>
          <input type="text" class="form-control datetimepicker-input py-2" id="schedule_${period}_end" data-toggle="datetimepicker" autocomplete="off" data-target="#schedule_${period}_end" />
        </div>
        </div>
        </div>

        <div class="col-md-8">
        <div class="sliders-wrapper">
          <div class="slider-box">
            <label>แสงอุ่น</label>
            <input type="range" min="0" max="100" value="0" class="brightness-slider-warm" id="schedule_${period}_controlRangeWarm" onInput="$('#schedule_${period}_rangeWarm').html($(this).val())">
            <div class="slider-marks">
              <div class="slider-mark"><div>|</div><div>0</div></div>
              <div class="slider-mark"><div>|</div><div>20</div></div>
              <div class="slider-mark"><div>|</div><div>40</div></div>
              <div class="slider-mark"><div>|</div><div>60</div></div>
              <div class="slider-mark"><div>|</div><div>80</div></div>
              <div class="slider-mark"><div>|</div><div>100</div></div>
            </div>
            <div class="light-info-box-warm">
              <p class="label">กำหนดค่าแสงอุ่น</p>
              <hr>
              <p class="value" id="schedule_${period}_rangeWarm">0</p>
            </div>
          </div>

          <div class="slider-box">
            <label>แสงเย็น</label>
            <input type="range" min="0" max="100" value="0" class="brightness-slider-cool py-2" id="schedule_${period}_controlRangeCool" onInput="$('#schedule_${period}_rangeCool').html($(this).val())">
            <div class="slider-marks">
              <div class="slider-mark"><div>|</div><div>0</div></div>
              <div class="slider-mark"><div>|</div><div>20</div></div>
              <div class="slider-mark"><div>|</div><div>40</div></div>
              <div class="slider-mark"><div>|</div><div>60</div></div>
              <div class="slider-mark"><div>|</div><div>80</div></div>
              <div class="slider-mark"><div>|</div><div>100</div></div>
            </div>
            <div class="light-info-box-cool">
              <p class="label">กำหนดค่าแสงเย็น</p>
              <hr>
              <p class="value" id="schedule_${period}_rangeCool">0</p>
            </div>
          </div>
          </div>
        </div>
        <div class="d-flex justify-content-end mt-4">
          <button type="button" class="btn btn-danger btn-sm remove-btn" title="ลบ">
            <i class="fa fa-trash"></i>
          </button>
        </div>
        </div>
        </div>
      </div>
    </li>
  `);

    if (period > 1) {
        const $start = $(`#schedule_${period}_start`);
        const $end = $(`#schedule_${period}_end`);

        $start.on('keydown paste', function (e) {
            e.preventDefault();
        });

        $end.on('keydown paste', function (e) {
            e.preventDefault();
        });

        [$start, $end].forEach($el => {
            $el.datetimepicker({
                format: "HH:mm",
                icons: {
                    time: 'fa fa-clock',
                    date: 'fa fa-calendar',
                    up: 'fa fa-chevron-up',
                    down: 'fa fa-chevron-down',
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-calendar-check',
                    clear: 'fa fa-trash',
                    close: 'fa fa-times'
                }
            })
        })

        const endInputValue = $(`#schedule_${period}_end`).val();

        if (!endInputValue || !moment(endInputValue, 'HH:mm', true).isValid()) {
            // console.warn('ยังไม่ได้กรอกเวลาสิ้นสุด หรือรูปแบบเวลาไม่ถูกต้อง');

            const prevEndValue = $(`#schedule_${period - 1}_end`).val();

            if (prevEndValue && moment(prevEndValue, 'HH:mm', true).isValid()) {
                const limitMoment = moment('23:59', 'HH:mm');
                const startMoment = moment(prevEndValue, 'HH:mm').add(1, 'hours');

                if (startMoment.isAfter(limitMoment)) {
                    startMoment.set({ hour: 23, minute: 59 });
                }

                $(`#schedule_${period}_start`).datetimepicker('date', startMoment);

                if (startMoment.isSameOrAfter(limitMoment)) {
                    Swal.fire({
                        title: 'แจ้งเตือน',
                        html: `<h4>เวลาเริ่มต้นของช่วงเวลาถัดไปต้องไม่เกิน 23:59</h4>`,
                        icon: 'warning',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#d33',
                        background: '#fff',
                        customClass: {
                            popup: 'swal2-modern-popup',
                            title: 'swal2-modern-title',
                            content: 'swal2-modern-content'
                        }
                    });
                    return;
                }

            }
        }

        if (period < 5) {
            const addBtn = $('#addscheduleall');
            addBtn.prop("disabled", false);
            addBtn.addClass("btn-success");
            addBtn.removeClass("btn-secondary");
        }
    }

    $('#scheduleList').append($li)
    $li.fadeIn(function () {
        const $start = $(`#schedule_${period}_start`);
        const $end = $(`#schedule_${period}_end`);

        $start.on('keydown paste', function (e) {
            e.preventDefault();
        });

        $end.on('keydown paste', function (e) {
            e.preventDefault();
        });

        const prevPeriod = period - 1;
        const nextPeriod = period + 1;
        let previousStart = null;
        let previousDuration = null;

        $(`#schedule_${period}_rangeWarm`).text("0");
        $(`#schedule_${period}_controlRangeWarm`).val("0");
        $(`#schedule_${period}_rangeCool`).text("0");
        $(`#schedule_${period}_controlRangeCool`).val("0");

        [$start, $end].forEach($el => {
            $el.datetimepicker({
                format: "HH:mm",
                icons: {
                    time: 'fa fa-clock',
                    date: 'fa fa-calendar',
                    up: 'fa fa-chevron-up',
                    down: 'fa fa-chevron-down',
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-calendar-check',
                    clear: 'fa fa-trash',
                    close: 'fa fa-times'
                }
            });
        });


        if (period > 1) {
            const prevEndVal = $(`#schedule_${prevPeriod}_end`).val();
            if (prevEndVal) {
                const startMoment = moment(prevEndVal, 'HH:mm');
                $start.datetimepicker('date', startMoment);
                $end.datetimepicker('date', startMoment.clone().add(1, 'hours'));
            } else {
                $start.datetimepicker('date', moment('00:00', 'HH:mm'));
                $end.datetimepicker('date', moment('01:00', 'HH:mm'));
            }
        } else {
            $start.datetimepicker('date', moment('00:00', 'HH:mm'));
            $end.datetimepicker('date', moment('01:00', 'HH:mm'));
        }



        $start.on("show.datetimepicker", function () {
            const start = moment($start.val(), 'HH:mm');
            const end = moment($end.val(), 'HH:mm');
            if (start.isValid() && end.isValid() && end.isAfter(start)) {
                previousStart = start.format('HH:mm');
                previousDuration = moment.duration(end.diff(start));
            }
        });

        $start.on("change.datetimepicker", function (e) {
            const start = moment(e.date, 'HH:mm');

            for (let i = 1; i < period; i++) {
                const prevEndVal = $(`#schedule_${i}_end`).val();
                if (prevEndVal && start.isBefore(moment(prevEndVal, 'HH:mm'))) {
                    Swal.fire({
                        title: 'แจ้งเตือน',
                        html: `<h4 style="color:#333;font-weight:normal;">ช่วงเวลาที่ ${period} เวลาเริ่มต้นต้องไม่เริ่มก่อนเวลาสิ้นสุดของช่วงเวลาที่ ${i}</h4>`,
                        icon: 'warning',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#d33',
                        background: '#fff',
                        customClass: {
                            popup: 'swal2-modern-popup',
                            title: 'swal2-modern-title',
                            content: 'swal2-modern-content'
                        }
                    });
                    if (previousStart) {
                        $start.datetimepicker('date', moment(previousStart, 'HH:mm'));
                    }
                    return;
                }
            }

            if (start.format('HH:mm') >= '00:00' && start.format('HH:mm') < '01:00') {
                Swal.fire({
                    title: 'แจ้งเตือน',
                    html: `<h4>เวลาเริ่มต้นต้องไม่อยู่ในช่วงหลังเที่ยงคืน</h4>`,
                    icon: 'warning',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                    customClass: {
                        popup: 'swal2-modern-popup',
                        title: 'swal2-modern-title',
                        content: 'swal2-modern-content'
                    }
                });

                if (previousStart) {
                    $start.datetimepicker('date', moment(previousStart, 'HH:mm'));
                } else {
                    $start.datetimepicker('date', moment('01:00', 'HH:mm'));
                }
                return;
            }

            const newEnd = previousDuration
                ? moment(start).add(previousDuration)
                : moment(start).add(1, 'hours');
            $end.datetimepicker('date', newEnd);

            const $nextStart = $(`#schedule_${nextPeriod}_start`);
            const $nextEnd = $(`#schedule_${nextPeriod}_end`);
            if ($nextStart.length && $nextEnd.length) {
                const nextStartVal = $nextStart.val();
                const nextEndVal = $nextEnd.val();
                let nextDuration = moment.duration(1, 'hours'); // default

                if (nextStartVal && nextEndVal) {
                    const nextStart = moment(nextStartVal, 'HH:mm');
                    const nextEnd = moment(nextEndVal, 'HH:mm');
                    if (nextEnd.isAfter(nextStart)) {
                        nextDuration = moment.duration(nextEnd.diff(nextStart));
                    }
                }

                $nextStart.datetimepicker('date', newEnd);
                $nextEnd.datetimepicker('date', moment(newEnd).add(nextDuration));
            }

        });

        let previousEnd = null;

        $(`#schedule_${period}_end`).on("show.datetimepicker", function () {
            previousEnd = $(`#schedule_${period}_end`).val();
        });

        $(`#schedule_${period}_end`).on("change.datetimepicker", function (e) {
            const end = moment(moment(e.date).format('HH:mm'), 'HH:mm');
            const startVal = $(`#schedule_${period}_start`).val();

            if (startVal) {
                const start = moment(startVal, 'HH:mm');

                if (end.isBefore(start)) {
                    Swal.fire({
                        title: 'แจ้งเตือน',
                        html: `<h4 style="color:#333;font-weight:normal;">
            เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น
        </h4>`,
                        icon: 'warning',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#d33',
                    }).then(() => {
                        $(`#schedule_${period}_end`).datetimepicker('date', moment(previousEnd, 'HH:mm'));
                        return;
                    });

                    if (end.isSameOrAfter(moment('00:00', 'HH:mm')) && end.isBefore(moment('01:00', 'HH:mm'))) {
                        Swal.fire({
                            title: 'แจ้งเตือน',
                            html: `<h4>เวลาสิ้นสุดของช่วงเวลาสุดท้าย ต้องไม่อยู่หลังเที่ยงคืน</h4>`,
                            icon: 'warning',
                            confirmButtonText: 'ตกลง',
                            confirmButtonColor: '#d33',
                        }).then(() => {
                            $(`#schedule_${period}_start`).datetimepicker('date', moment('23:00', 'HH:mm'));
                            $(`#schedule_${period}_end`).datetimepicker('date', moment('23:59', 'HH:mm'));
                        });
                        return;
                    }
                }
            }

            const periods = $('[id^=schedule_]')
                .map(function () {
                    const match = this.id.match(/schedule_(\d+)_start/);
                    return match ? parseInt(match[1], 10) : null;
                }).get();

            const maxPeriod = Math.max(...periods.filter(Boolean));

            if (period === maxPeriod && end.format('HH:mm') === '00:00') {
                Swal.fire({
                    title: 'แจ้งเตือน',
                    html: `<h4 style="color:#333;font-weight:normal;">ช่วงเวลาสุดท้ายต้องไม่สิ้นสุดหรือมากกว่าเวลา 00:00</h4>`,
                    icon: 'warning',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                    customClass: {
                        popup: 'swal2-modern-popup',
                        title: 'swal2-modern-title',
                        content: 'swal2-modern-content'
                    }
                }).then(() => {
                    $(`#schedule_${period}_end`).datetimepicker('date', moment('23:59', 'HH:mm'));
                });
                return;
            }

            const firstStartVal = $(`#schedule_1_start`).val();
            const lastEndVal = $(`#schedule_${maxPeriod}_end`).val();

            if (firstStartVal && lastEndVal) {
                const firstStart = moment(firstStartVal, 'HH:mm');
                const firstStartNextDay = firstStart.clone().add(1, 'day');
                const lastEnd = moment(lastEndVal, 'HH:mm');

                let lastEndMoment = moment().set({
                    hour: lastEnd.get('hour'),
                    minute: lastEnd.get('minute'),
                    second: 0,
                    millisecond: 0
                });

                if (lastEndMoment.isSameOrBefore(firstStart)) {
                    lastEndMoment.add(1, 'day');
                }

                if (lastEndMoment.isSameOrAfter(firstStartNextDay)) {
                    Swal.fire({
                        title: 'แจ้งเตือน',
                        html: `<h4 style="color:#333;font-weight:normal;">เวลาสิ้นสุดของช่วงเวลาสุดท้ายต้องไม่เกินเวลาเริ่มต้นของช่วงที่ 1 ในวันถัดไป</h4>`,
                        icon: 'warning',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#d33',
                        background: '#fff',
                        customClass: {
                            popup: 'swal2-modern-popup',
                            title: 'swal2-modern-title',
                            content: 'swal2-modern-content'
                        }
                    }).then(() => {
                        for (let i = 1; i <= maxPeriod; i++) {
                            const $start = $(`#schedule_${i}_start`);
                            const $end = $(`#schedule_${i}_end`);

                            const startVal = $start.val();
                            const endVal = $end.val();

                            if (startVal) {
                                const newStart = moment(startVal, 'HH:mm').subtract(1, 'hour');
                                $start.datetimepicker('date', newStart);
                            }

                            if (endVal) {
                                const newEnd = moment(endVal, 'HH:mm').subtract(1, 'hour');
                                $end.datetimepicker('date', newEnd);
                            }
                        }
                    });
                    return;
                }
            }

            const nextPeriod = period + 1;
            const $nextStart = $(`#schedule_${nextPeriod}_start`);
            if ($nextStart.length) {
                const nextStartVal = $nextStart.val();
                if (!nextStartVal || moment(nextStartVal, 'HH:mm').isBefore(end)) {
                    $nextStart.datetimepicker('date', end);
                }
            }

        });

    });

    $li.find('.remove-btn').on('click', function () {

        if (period <= 1) return

        $li.fadeOut(function () {
            $li.remove();
            updatePeriodNumbers();
        });
    });
});

function updatePeriodNumbers() {
    $('#scheduleList li').each(function (index) {
        const $li = $(this);
        const newPeriod = index + 1;

        if (newPeriod < 5) {
            const addBtn = $('#addschedule')
            addBtn.prop("disabled", false);
            addBtn.addClass("btn-success");
            addBtn.removeClass("btn-secondary")
        }

        $('#period').text(newPeriod)

        $li.find('h2.text-center').html(`🕒 ช่วงเวลาที่ ${newPeriod}`);
        $li.find('input#no').val(newPeriod);

        const $startInput = $li.find('input[id^="schedule_"][id$="_start"]');
        $startInput.attr('id', `schedule_${newPeriod}_start`);
        $startInput.attr('data-target', `#schedule_${newPeriod}_start`);
        $li.find(`label[for^="schedule_"][for$="_start"]`).attr('for', `schedule_${newPeriod}_start`);

        const $endInput = $li.find('input[id^="schedule_"][id$="_end"]');
        $endInput.attr('id', `schedule_${newPeriod}_end`);
        $endInput.attr('data-target', `#schedule_${newPeriod}_end`);
        $li.find(`label[for^="schedule_"][for$="_end"]`).attr('for', `schedule_${newPeriod}_end`);

        $li.find('input.brightness-slider-warm')
            .attr('id', `schedule_${newPeriod}_controlRangeWarm`)
            .attr('oninput', `$('#schedule_${newPeriod}_rangeWarm').html($(this).val())`);
        $li.find('#' + $li.find('.light-info-box-warm .value').attr('id'))
            .attr('id', `schedule_${newPeriod}_rangeWarm`)
        // .text('0');

        $li.find('input.brightness-slider-cool')
            .attr('id', `schedule_${newPeriod}_controlRangeCool`)
            .attr('oninput', `$('#schedule_${newPeriod}_rangeCool').html($(this).val())`);
        $li.find('#' + $li.find('.light-info-box-cool .value').attr('id'))
            .attr('id', `schedule_${newPeriod}_rangeCool`)
        // .text('0');
    });
}

$('#clearSchedules').on('click', function () {
    // $('#scheduleList li').slice(1).fadeOut(300, function () {
    //     $(this).remove();
    //     $('#period').text('1')
    // });
    updatePeriodNumbers();
    // const $firstLi = $('#scheduleList li').first();

    // $firstLi.find('input[id^="schedule_"][id$="_start"]').datetimepicker('date', moment('00:00', 'HH:mm'));
    // $firstLi.find('input[id^="schedule_"][id$="_end"]').datetimepicker('date', moment('01:00', 'HH:mm'));

    // $firstLi.find('input[id^="schedule_"][id$="_controlRangeWarm"]').val(0).trigger('input');
    // $firstLi.find('p[id^="schedule_"][id$="_rangeWarm"]').text('0');

    // $firstLi.find('input[id^="schedule_"][id$="_controlRangeCool"]').val(0).trigger('input');
    // $firstLi.find('p[id^="schedule_"][id$="_rangeCool"]').text('0');
});

$("#control-send-manual").click(function () {
    const macAddress = $("#controlLampSerialNo").val();
    const switchbtn = $("#controlRelayState");
    const group = $('#controlGroup').val();
    const endpoint = "https://85.204.247.82:3002/api/turnonlightval";
    const warmVal = $("#controlRangeWarm").val();
    const coolVal = $("#controlRangeCool").val();
    let relay;

    if (switchbtn.prop("checked")) {
        relay = "ON";
    } else {
        relay = "OFF";
    }

    const datas = {
        group,
        macAddress,
        relay,
        warmVal,
        coolVal,
    };

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(datas),
    };

    Swal.fire({
        title: "🔄 กำลังส่งคำสั่ง...",
        html: `
                    <div style="font-size: 16px; color: #555;">
                        กำลังส่งคำสั่งให้อุปกรณ์ <strong>${macAddress}</strong><br>
                        กรุณารอสักครู่...
                    </div>
                `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
        },
    });

    setTimeout(() => {
        fetch(endpoint, options)
            .then((resp) => resp.json())
            .then((obj) => {
                // getLampData(
                //     $("#controllerCode option:selected").val(),
                //     $("#bottomPagination").twbsPagination("getCurrentPage"),
                //     $("#lampTextSearch").val(),
                //     $("#groupDevices").val()
                // );
                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "สำเร็จ",
                    html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
              ✅ ส่งคำสั่งอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
            </div>`,
                    showConfirmButton: false,
                    timer: 1500,
                });
                // setTimeout(() => {
                //     $('#controlInfoModal').modal('hide')
                // }, 1500);
                $(this).prop("disabled", true);
                setTimeout(() => {
                    $(this).prop("disabled", false);
                }, 7000);
            })
            .catch((err) => {
                console.error("เกิดข้อผิดพลาด:", err);
                Swal.fire({
                    position: "center",
                    icon: "error",
                    title: "❌ ผิดพลาด!",
                    html: `
                    <div style="font-size: 16px; color: #b71c1c;">
                        🚫 <strong>ส่งคำสั่งไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
                    </div>
                `,
                    showConfirmButton: false,
                    timer: 1500,
                });
                $("#controlInfoModal").modal("hide");
            });
    }, 500);
});

//sendsingle
$("#control-send-schedule").click(async function () {
    const macAddress = $("#controlLampSerialNo").val();
    const group = $('#controlGroup').val();
    const endpoint = "https://85.204.247.82:3002/api/setschedule";
    const mac = macAddress;
    let schedulDatas = [];
    let filledCount = 0;

    const totalActiveSlots = $("#scheduleList li").length;

    for (let i = 1; i <= 5; i++) {
        let starttime = ($(`#schedule_${i}_start`).val() ?? "").trim();
        let endtime = ($(`#schedule_${i}_end`).val() ?? "").trim();
        let warmval = ($(`#schedule_${i}_controlRangeWarm`).val() ?? "").trim();
        let coolval = ($(`#schedule_${i}_controlRangeCool`).val() ?? "").trim();

        let hasData = starttime || endtime || warmval || coolval;

        let active = false;

        if (hasData && filledCount < totalActiveSlots) {
            active = true;
            filledCount++;
        }

        schedulDatas.push({
            no: i,
            active,
            starttime: starttime || "00:00",
            endtime: endtime || "00:00",
            warmval: warmval || "0",
            coolval: coolval || "0",
        });
    }

    let payload = { group: group, macAddress: mac, schedule: schedulDatas }
    console.log('payload:', payload)

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(payload)
    };

    Swal.fire({
        title: '🔄 กำลังส่งคำสั่ง...',
        html: `
                <div style="font-size: 16px; color: #555;">
                    กำลังส่งคำสั่งให้อุปกรณ์ <strong>${macAddress}</strong><br>
                    กรุณารอสักครู่...
                </div>
            `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading()
        }
    });

    try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const resp = await fetch(endpoint, options);
        const obj = await resp.json();

        Swal.fire({
            position: "center",
            icon: "success",
            title: "สำเร็จ",
            html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
          ✅ ส่งคำสั่งสำเร็จ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
        </div>`,
            showConfirmButton: false,
            timer: 1500,
        });
        $(this).prop("disabled", true);
        setTimeout(() => {
            $(this).prop("disabled", false);
        }, 7000);
    } catch (err) {
        console.error("เกิดข้อผิดพลาด:", err);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "❌ ผิดพลาด!",
            html: `
                <div style="font-size: 16px; color: #b71c1c;">
                    🚫 <strong>ส่งคำสั่งไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
                </div>
            `,
            showConfirmButton: false,
            timer: 1500,
        });
    }
})

$(document).ready(async function () {
    bindButtonByPermission();
    bindingChangeModeListDropDown();

    $("#schedule_1_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_2_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_3_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_4_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_5_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    //$("#schedule_1_duration").datetimepicker({ format: "HH:mm"});
    //$("#schedule_2_duration").datetimepicker({ format: "HH:mm"});
    //$("#schedule_3_duration").datetimepicker({ format: "HH:mm"});
    //$("#schedule_4_duration").datetimepicker({ format: "HH:mm"});
    //$("#schedule_5_duration").datetimepicker({ format: "HH:mm"});

    setInterval(function () {
        if ($("#isAutoRefresh").is(":checked")) {
            removeMarkers();
            getDataToPaintOnMaps(false);
        }
    }, 20000);


    function bindButtonByPermission() {
        switch ($("#parentRole").attr("data-valkey")) {
            case "1": //viewer
                $("#control-send-button").addClass("d-none");
                modalPermission();

                break;

            case "2": //admin
                break;

            case "3": //engineer
                $("#control-send-button").addClass("d-none");
                $("#controlActionPanel").addClass("d-none");
                break;
        }
    }

    function bindingChangeModeListDropDown() {
        $("#controlChangeModeList").append("<option value='1'>กำหนดการทำงานด้วยตนเอง (MANUAL)</option>");
        $("#controlChangeModeList").append("<option value='2'>ตั้งเวลาทำงานอัตโนมัติ (SCHEDULER)</option>");

        if ($("#parentRole").attr("data-valkey") != "1") {
            $("#controlChangeModeList").append("<option value='-1'>DEBUG</option>");
            $("#controlChangeModeList").append("<option value='0'>CONFIG</option>");
            $("#controlChangeModeList").append("<option value='3'>AMBIENT_LIGHT</option>");
            $("#controlChangeModeList").append("<option value='4'>SCHEDULER_WITH_AMBIENT_LIGHT</option>");
        }
    };

    function removeMarkers() {
        showMarkersOnMap(null);
        markerList = [];
    }

    // function bindControlPanelViewModelToModal(viewModel) {
    //     $("#controlMode").val(viewModel.mode);
    //     $("#controlProjectType").val(viewModel.projectType);
    //     $("#controlControllerCode").val(viewModel.controllerCode);
    //     $("#controlLampSerialNo").val(viewModel.lampSerialNo);
    //     $("#controlLampName").val(viewModel.lampName);
    //     $("#controlStaRelay").val(viewModel.relayName);
    //     $("#controlStaMode").val(viewModel.modeDescription);
    //     $("#controlStaCurrent").val(viewModel.current);
    //     $("#controlStaAmLight").val(viewModel.ambientLight);
    //     $("#controlStaPWM1_Text").text(viewModel.pwm1);
    //     $("#controlStaPWM1_rangeWarm").val(viewModel.pwm1);
    //     $("#controlStaPWM2_Text").text(viewModel.pwm2);
    //     $("#controlStaPWM2_rangeCool").val(viewModel.pwm2);

    //     if (viewModel.mode > 0) {
    //         $("#controlActionList").val(viewModel.modeName).change();
    //     }

    //     $("#controlRelayState").val(viewModel.relay).change();
    //     $("#rangeWarm").text(viewModel.pwm1);
    //     $("#controlRangeWarm").val(viewModel.pwm1);
    //     $("#rangeCool").text(viewModel.pwm2);
    //     $("#controlRangeCool").val(viewModel.pwm2);
    //     $("#controlUpdatedAt").text("ข้อมูลเมื่อ: " + moment(viewModel.updatedAt).format("yyyy/MM/DD HH:mm:ss"));
    // };

    function hideControlActionList() {
        if (!$("#controlActionModeChange").hasClass("d-none")) {
            $("#controlActionModeChange").addClass("d-none");
        }

        if (!$("#controlActionManual").hasClass("d-none")) {
            $("#controlActionManual").addClass("d-none");
        }

        if (!$("#controlActionSchedule").hasClass("d-none")) {
            $("#controlActionSchedule").addClass("d-none");
        }
    };

    // $("#controlActionList").change(function (e) {
    //     $("#controlInfoModal").LoadingOverlay("show");
    //     hideControlActionList();

    //     fetch(ENDPOINT_URL.MQTTCLIENT_ENDPOINT, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json; charset=utf-8"
    //         },
    //         body: JSON.stringify({ "method": $(this).val() })
    //     }).then(response => {
    //         $("#controlInfoModal").LoadingOverlay("hide");
    //         return response.json();
    //     }).then(result => {
    //         let viewModel = JSON.parse(JSON.stringify(result));

    //         if (viewModel.state == "success") {
    //             $("#controlEndpoint").attr("data-mqtt-url", viewModel.data);

    //             switch ($("#controlActionList").val()) {
    //                 case MQTT_PUBLISHER_ACTION.MODE_CHANGE:
    //                     $("#controlActionModeChange").toggleClass("d-none");
    //                     $("#controlUpdatedAt").toggleClass("d-none");
    //                     break;
    //                 case MQTT_PUBLISHER_ACTION.MANUAL:
    //                     $("#controlActionManual").toggleClass("d-none");
    //                     $("#controlUpdatedAt").toggleClass("d-none");
    //                     break;
    //                 case MQTT_PUBLISHER_ACTION.SET_SCHEDULE:
    //                     $("#controlActionSchedule").toggleClass("d-none");
    //                     $("#controlUpdatedAt").toggleClass("d-none");
    //                     break;
    //             }
    //         } else {
    //             showDialog(viewModel.state, viewModel.title, viewModel.message);
    //         }
    //     }).catch(error => {
    //         console.log(error.message);
    //         showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
    //     });
    // });

    $("#controlActionList").change(function () {
        if (isInitializing) return;

        const macAddress = $("#controlLampSerialNo").val();
        const endpoint_updatemode = "https://85.204.247.82:3002/api/updateMode";
        const endpoint_off = "https://85.204.247.82:3002/api/turnofflight";
        const group = $('#controlGroup').val();
        const transbox = $("#transbox");
        const subtransbox = $("#subtransbox");
        const btnswitchmanual = $("#controlRelayState");
        const btnswitchauto = $("#controlRelayState2");
        let mode = $(this).val();
        // $('.mn').fadeOut()
        // $('.mn2').fadeOut()

        if (mode === "SET_SCHEDULE") {
            mode = "SCHEDULE";
        }

        const dataoff = {
            macAddress,
        };

        const dataupdate = {
            group,
            macAddress,
            mode,
        };

        if ($(this).val() === "MANUAL") {
            Swal.fire({
                title: "เปลี่ยน Mode?",
                html: `ต้องการเปลี่ยน <strong>${macAddress}</strong> เป็น <strong>Mode Manual</strong> ใช่หรือไม่?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก",
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: "🔄 กำลังเปลี่ยน Mode",
                        html: `
        <div style="font-size: 16px; color: #555;">
            กำลังส่งคำสั่งเปลี่ยน Mode สำหรับ <strong>${macAddress}</strong><br>
            กรุณารอสักครู่...
        </div>
    `,
                        timerProgressBar: true,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });

                    setTimeout(() => {
                        fetch(endpoint_off, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8",
                            },
                            body: JSON.stringify(dataoff),
                        })
                            .then((response) => {
                                firstloadmanual = true;
                                btnswitchmanual.bootstrapToggle("off");
                                return response.json();
                            })
                            .then((result) => {
                                console.log("result", result);
                            })
                            .catch((err) => {
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: "error",
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000,
                                });
                            });
                    }, 500);

                    setTimeout(() => {
                        fetch(endpoint_updatemode, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8",
                            },
                            body: JSON.stringify(dataupdate),
                        })
                            .then((response) => response.json())
                            .then((result) => {
                                let res = JSON.parse(JSON.stringify(result));
                                if (res.msg === "OK") {
                                    Swal.fire({
                                        icon: "success",
                                        title: "🎉 สำเร็จ!",
                                        html: `
        <div style="font-size: 16px; color: #2e7d32;">
            เปลี่ยน <strong>${macAddress}</strong> เป็น <strong>Mode Manual</strong> สำเร็จ
        </div>
    `,
                                        showConfirmButton: false,
                                        timer: 2000,
                                    });
                                } else if (res.msg === "Error") {
                                    Swal.fire({
                                        icon: "error",
                                        title: "❌ ไม่สำเร็จ!",
                                        html: `
        <div style="font-size: 16px; color: #b71c1c;">
            ไม่สามารถเปลี่ยน <strong>${macAddress}</strong> เป็น <strong>Mode Manual</strong> ได้
        </div>
    `,
                                    });
                                }
                                $("#control-send-manual").removeClass("d-none");
                                $("#control-send-schedule").addClass("d-none");
                                $("#manual").fadeIn();
                                $("#schedule").fadeOut();
                                $("#pills-tabContent").fadeIn();
                                $("#pills-tabContent").removeClass("d-none");
                                $("#schedule").removeClass("active show");
                                $("#manual").addClass("active show");
                                $("#schedule-tab").removeClass("active");
                                $("#schedule-tab").addClass("disabled");
                                $("#manual-tab").addClass("active");
                                $(".n-pills").removeClass("d-none");
                            })
                            .catch((error) => {
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: "error",
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000,
                                });
                            });
                    }, 500);
                } else {
                    $("#controlActionList").val("0");
                }
            });
        } else if ($(this).val() === "SET_SCHEDULE") {
            Swal.fire({
                title: "เปลี่ยน Mode?",
                html: `ต้องการเปลี่ยน <strong>${macAddress}</strong> เป็น <strong>Mode Schedule</strong> ใช่หรือไม่?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก",
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: "🔄 กำลังเปลี่ยน Mode",
                        html: `
        <div style="font-size: 16px; color: #555;">
            กำลังส่งคำสั่งเปลี่ยน Mode สำหรับ <strong>${macAddress}</strong><br>
            กรุณารอสักครู่...
        </div>
    `,
                        timerProgressBar: true,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });

                    setTimeout(() => {
                        fetch(endpoint_off, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8",
                            },
                            body: JSON.stringify(dataoff),
                        })
                            .then((response) => {
                                firstloadauto = true;
                                btnswitchauto.bootstrapToggle("off");
                                // if (!btnswitchauto.prop('checked')) {
                                //     $('.mn2').fadeOut()
                                // }
                                return response.json();
                            })
                            .then((result) => {
                                console.log("result", result);
                            })
                            .catch((err) => {
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: "error",
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000,
                                });
                            });
                    }, 1000);

                    setTimeout(() => {
                        fetch(endpoint_updatemode, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8",
                            },
                            body: JSON.stringify(dataupdate),
                        })
                            .then((response) => {
                                return response.json();
                            })
                            .then((result) => {
                                let res = JSON.parse(JSON.stringify(result));

                                if (res.msg === "OK") {
                                    Swal.fire({
                                        icon: "success",
                                        title: "🎉 สำเร็จ!",
                                        html: `
        <div style="font-size: 16px; color: #2e7d32;">
            เปลี่ยน <strong>${macAddress}</strong> เป็น <strong>Mode Schedule</strong> สำเร็จ
        </div>
    `,
                                        showConfirmButton: false,
                                        timer: 1800,
                                    });
                                    // btnswitchauto.bootstrapToggle('on')
                                } else if (res.msg === "Error") {
                                    Swal.fire({
                                        icon: "error",
                                        title: "❌ ไม่สำเร็จ!",
                                        html: `
        <div style="font-size: 16px; color: #b71c1c;">
            ไม่สามารถเปลี่ยน <strong>${macAddress}</strong> เป็น <strong>Mode Schedule</strong> ได้
        </div>
    `,
                                    });
                                }
                                $("#control-send-schedule").removeClass("d-none");
                                $("#control-send-manual").addClass("d-none");
                                $("#schedule").fadeIn();
                                $("#manual").fadeOut();
                                $("#pills-tabContent").fadeIn();
                                $("#pills-tabContent").removeClass("d-none");
                                $("#manual").removeClass("active show");
                                $("#schedule").addClass("active show");
                                $("#manual-tab").removeClass("active");
                                $("#schedule-tab").addClass("active");
                                $("#manual-tab").addClass("disabled");
                                $(".n-pills").removeClass("d-none");
                                scheduleFunction();
                            })
                            .catch((error) => {
                                console.log(error.message);
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: "error",
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000,
                                });
                            });
                    }, 500);
                } else {
                    $("#controlActionList").val("0");
                }
            });
        } else if ($(this).val() === "0") {
            Swal.fire({
                title: "⚠️ คุณไม่ได้เลือก Mode",
                text: "กรุณาเลือก Mode การทำงาน",
                icon: "warning",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "ตกลง",
            }).then((result) => {
                if (result.isConfirmed) {
                    $("#pills-tabContent").fadeOut();
                    $("#manual-tab").addClass("disabled");
                    $("#schedule-tab").addClass("disabled");
                    $(".n-pills").fadeOut();
                    $(".n-pills").addClass("d-none");
                } else {
                    $("#controlActionList").val("0");
                }
            });
        }
    });

    function clearControlModalInput() {
        $("#rangeWarm").text("0");
        $("#controlRangeWarm").val("0");
        $("#rangeCool").text("0");
        $("#controlRangeCool").val("0");

        $("#schedule_1_start").val("00:00");
        $("#schedule_1_duration_h").val("0");
        $("#schedule_1_duration_m").val("0");
        $("#schedule_1_rangeWarm").text("0");
        $("#schedule_1_controlRangeWarm").val("0");
        $("#schedule_1_rangeCool").text("0");
        $("#schedule_1_controlRangeCool").val("0");

        $("#schedule_2_start").val("00:00");
        $("#schedule_2_duration_h").val("0");
        $("#schedule_2_duration_m").val("0");
        $("#schedule_2_rangeWarm").text("0");
        $("#schedule_2_controlRangeWarm").val("0");
        $("#schedule_2_rangeCool").text("0");
        $("#schedule_2_controlRangeCool").val("0");

        $("#schedule_3_start").val("00:00");
        $("#schedule_3_duration_h").val("0");
        $("#schedule_3_duration_m").val("0");
        $("#schedule_3_rangeWarm").text("0");
        $("#schedule_3_controlRangeWarm").val("0");
        $("#schedule_3_rangeCool").text("0");
        $("#schedule_3_controlRangeCool").val("0");

        $("#schedule_4_start").val("00:00");
        $("#schedule_4_duration_h").val("0");
        $("#schedule_4_duration_m").val("0");
        $("#schedule_4_rangeWarm").text("0");
        $("#schedule_4_controlRangeWarm").val("0");
        $("#schedule_4_rangeCool").text("0");
        $("#schedule_4_controlRangeCool").val("0");

        $("#schedule_5_start").val("00:00");
        $("#schedule_5_duration_h").val("0");
        $("#schedule_5_duration_m").val("0");
        $("#schedule_5_rangeWarm").text("0");
        $("#schedule_5_controlRangeWarm").val("0");
        $("#schedule_5_rangeCool").text("0");
        $("#schedule_5_controlRangeCool").val("0");
    };

    // $("#controlInfoModal").on("hidden.bs.modal", function (e) {
    //     $("#controlEndpoint").attr("data-mqtt-url", "");

    //     switch ($("#controlActionList option:selected").val()) {
    //         case MQTT_PUBLISHER_ACTION.MODE_CHANGE:
    //             $("#controlActionModeChange").toggleClass("d-none");
    //             break;
    //         case MQTT_PUBLISHER_ACTION.MANUAL:
    //             $("#controlActionManual").toggleClass("d-none");
    //             break;
    //         case MQTT_PUBLISHER_ACTION.SET_SCHEDULE:
    //             $("#controlActionSchedule").toggleClass("d-none");
    //             break;
    //     }

    //     $("#controlUpdatedAt").toggleClass("d-none");
    //     $("#controlActionList").val("");
    //     clearControlModalInput();
    // });

    $("#controlRelayState").change(function (e) {
        switch ($(this).val()) {
            case "0":
                $("#controlRangeWarm").prop("disabled", true);
                $("#controlRangeCool").prop("disabled", true);
                $("#controlRangeWarm").val("0");
                $("#controlRangeCool").val("0");
                $("#rangeWarm").text("0");
                $("#rangeCool").text("0");
                break;
            case "1":
                $("#controlRangeWarm").prop("disabled", false);
                $("#controlRangeCool").prop("disabled", false);
                break;
        }
    });

    // $("#control-send-button").on("click", function (e) {
    //     $.LoadingOverlay("show");

    //     let endpoint = $("#controlEndpoint").attr("data-mqtt-url");
    //     let mqttReqData = {
    //         clientHost: MQTT_CONNECT.clientHost,
    //         clientPort: MQTT_CONNECT.clientPort,
    //         clientCredUser: MQTT_CONNECT.clientCredUser,
    //         clientCredPassword: MQTT_CONNECT.clientCredPassword,
    //         topicLevel: MQTT_CONNECT.topicLevel,
    //         topicProduct: MQTT_CONNECT.topicProduct,
    //         topicModel: MQTT_CONNECT.topicModel,
    //         topicGroup: MQTT_CONNECT.topicGroup,
    //         topicSerialNo: $("#controlLampSerialNo").val(),
    //         _currentMode: $("#controlMode").val()
    //     }

    //     switch ($("#controlActionList option:selected").val()) {
    //         case MQTT_PUBLISHER_ACTION.MODE_CHANGE:
    //             mqttReqData.payload = {
    //                 tsID: moment().format("YYMMDD-HHmmss-SSS"),
    //                 CMD: MQTT_CMD.CHANGE_MODE,
    //                 MODE: $("#controlChangeModeList option:selected").val()
    //             };

    //             if ($("#controlProjectType").val() == "1") {
    //                 mqttReqData.payload.SSID = $("#controlControllerCode").val();
    //             }
    //             break;

    //         case MQTT_PUBLISHER_ACTION.MANUAL:
    //             mqttReqData.payload = {
    //                 tsID: moment().format("YYMMDD-HHmmss-SSS"),
    //                 CMD: MQTT_CMD.MANUAL,
    //                 Relay: $("#controlRelayState option:selected").val(),
    //                 PWM1: $("#controlRangeWarm").val(),
    //                 PWM2: $("#controlRangeCool").val()
    //             };

    //             if ($("#controlProjectType").val() == "1") {
    //                 mqttReqData.payload.SSID = $("#controlControllerCode").val();
    //             }
    //             break;

    //         case MQTT_PUBLISHER_ACTION.SET_SCHEDULE:
    //             mqttReqData.payload = [
    //                 {
    //                     tsID: moment().format("YYMMDD-HHmmss-SSS"),
    //                     CMD: MQTT_CMD.SET_SCHEDULE,
    //                     ScheduleNo: $("#schedule_1_no").val(),
    //                     Start: $("#schedule_1_start").val(),
    //                     //Duration: $("#schedule_1_duration").val(),
    //                     Duration: $("#schedule_1_duration_h").val() + ":" + $("#schedule_1_duration_m").val(),
    //                     PWM1: $("#schedule_1_controlRangeWarm").val(),
    //                     PWM2: $("#schedule_1_controlRangeCool").val()
    //                 }
    //                 , {
    //                     tsID: moment().format("YYMMDD-HHmmss-SSS"),
    //                     CMD: MQTT_CMD.SET_SCHEDULE,
    //                     ScheduleNo: $("#schedule_2_no").val(),
    //                     Start: $("#schedule_2_start").val(),
    //                     //Duration: $("#schedule_2_duration").val(),
    //                     Duration: $("#schedule_2_duration_h").val() + ":" + $("#schedule_2_duration_m").val(),
    //                     PWM1: $("#schedule_2_controlRangeWarm").val(),
    //                     PWM2: $("#schedule_2_controlRangeCool").val()
    //                 }
    //                 , {
    //                     tsID: moment().format("YYMMDD-HHmmss-SSS"),
    //                     CMD: MQTT_CMD.SET_SCHEDULE,
    //                     ScheduleNo: $("#schedule_3_no").val(),
    //                     Start: $("#schedule_3_start").val(),
    //                     //Duration: $("#schedule_3_duration").val(),
    //                     Duration: $("#schedule_3_duration_h").val() + ":" + $("#schedule_3_duration_m").val(),
    //                     PWM1: $("#schedule_3_controlRangeWarm").val(),
    //                     PWM2: $("#schedule_3_controlRangeCool").val()
    //                 }
    //                 , {
    //                     tsID: moment().format("YYMMDD-HHmmss-SSS"),
    //                     CMD: MQTT_CMD.SET_SCHEDULE,
    //                     ScheduleNo: $("#schedule_4_no").val(),
    //                     Start: $("#schedule_4_start").val(),
    //                     //Duration: $("#schedule_4_duration").val(),
    //                     Duration: $("#schedule_4_duration_h").val() + ":" + $("#schedule_4_duration_m").val(),
    //                     PWM1: $("#schedule_4_controlRangeWarm").val(),
    //                     PWM2: $("#schedule_4_controlRangeCool").val()
    //                 }
    //                 , {
    //                     tsID: moment().format("YYMMDD-HHmmss-SSS"),
    //                     CMD: MQTT_CMD.SET_SCHEDULE,
    //                     ScheduleNo: $("#schedule_5_no").val(),
    //                     Start: $("#schedule_5_start").val(),
    //                     //Duration: $("#schedule_5_duration").val(),
    //                     Duration: $("#schedule_5_duration_h").val() + ":" + $("#schedule_5_duration_m").val(),
    //                     PWM1: $("#schedule_5_controlRangeWarm").val(),
    //                     PWM2: $("#schedule_5_controlRangeCool").val()
    //                 }
    //             ];

    //             if ($("#controlProjectType").val() == "1") {
    //                 mqttReqData.payload[0].SSID = $("#controlControllerCode").val();
    //                 mqttReqData.payload[1].SSID = $("#controlControllerCode").val();
    //                 mqttReqData.payload[2].SSID = $("#controlControllerCode").val();
    //                 mqttReqData.payload[3].SSID = $("#controlControllerCode").val();
    //                 mqttReqData.payload[4].SSID = $("#controlControllerCode").val();
    //             }
    //             break;

    //         default:
    //             mqttReqData = "";
    //             break;
    //     }

    //     if (!$.isEmptyObject(mqttReqData)) {
    //         fetch(endpoint, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json; charset=utf-8"
    //             },
    //             body: JSON.stringify(mqttReqData)
    //         }).then(response => {
    //             $.LoadingOverlay("hide");
    //             return response.json();
    //         }).then(result => {
    //             let viewModel = JSON.parse(JSON.stringify(result));

    //             if (viewModel.status == "OK") {
    //                 Swal.fire({
    //                     title: "ดำเนินการสำเร็จ",
    //                     text: "ส่งคำสั่งไปหลอดไฟ \"" + $("#controlLampSerialNo").val() + "\" แล้ว",
    //                     icon: "success",
    //                     confirmButtonColor: "#3085d6"
    //                 });
    //                 $("#controlInfoModal").modal("hide");
    //             } else {
    //                 Swal.fire({
    //                     title: "เกิดข้อผิดพลาด",
    //                     text: "ส่งคำสั่งไม่สำเร็จ",
    //                     icon: "error",
    //                     confirmButtonColor: "#3085d6"
    //                 });
    //             }
    //         }).catch(error => {
    //             console.log(error.message);
    //             showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
    //         });
    // }
    // }
    // );

    $("#refreshButton").on("click", function (e) {
        removeMarkers();
        getDataToPaintOnMaps(false);
    });

    $('.numberInputValidate').keypress(function (e) {
        return numberInputValidate(e);
    });

    $('.numberInputValidate').blur(function (e) {
        if (e.currentTarget.value == "") {
            e.currentTarget.value = "0";
        }
    });

});