var map;
var clientLat;
var clientLng;
var markerList = [];

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        //center: { lat: 13.736717, lng: 100.523186 },
        //zoom: 16,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
    });

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

$(document).ready(function () {
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

    getDataToPaintOnMaps(true);
    
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

    function getDataToPaintOnMaps(panMap) {
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

    function bindingMapsData(data, panMap) {
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
                            let controllerMarker = new google.maps.Marker({
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
                                    let lampMarker = new google.maps.Marker({
                                        position: { lat: parseFloat(lmp.latitude), lng: parseFloat(lmp.longitude) },
                                        title: lmp.lampName,
                                        icon: lampStatusIcon,
                                    });

                                    markerList.push(lampMarker);
                                    
                                    let lampNameInfo = new google.maps.InfoWindow({
                                        content: lmp.lampName
                                    });

                                    lampMarker.addListener("mouseover", () => {
                                        lampNameInfo.open(map, lampMarker);
                                    });

                                    lampMarker.addListener("mouseout", () => {
                                        lampNameInfo.close();
                                    });

                                    lampMarker.addListener("click", () => {
                                        //if (lmp.lampStatus == "2") {
                                        //    showDialog("error", "เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อหลอดไฟ \"" + lmp.lampCode + "\"")
                                        //    return;
                                        //}

                                        $("#controlLampSerialNo").val(lmp.lampCode);

                                        $.LoadingOverlay("show");
                                        fetch(ENDPOINT_URL.LAMP_STATUS, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json; charset=utf-8"
                                            },
                                            body: JSON.stringify({ "lampCode": $("#controlLampSerialNo").val() })
                                        }).then(response => {
                                            $.LoadingOverlay("hide");
                                            return response.json();
                                        }).then(result => {
                                            let viewModel = JSON.parse(JSON.stringify(result));

                                            if (viewModel.state == "success") {
                                                clearControlModalInput();
                                                bindControlPanelViewModelToModal(viewModel.data);
                                                $("#controlInfoModal").modal("show");
                                            } else {
                                                showDialog(viewModel.state, viewModel.title, viewModel.message);
                                            }
                                        }).catch(error => {
                                            console.log(error.message);
                                            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
                                        });
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

    function showMarkersOnMap(_map, panMap) {
        if (markerList != null && markerList.length > 0) {
            let hasPan = panMap;

            $.each(markerList, function (_, marker) {
                marker.setMap(_map);

                if (hasPan) {
                    _map.panTo(new google.maps.LatLng(marker.getPosition().lat(), marker.getPosition().lng()));
                    hasPan = false;
                }
            });
        }
    }

    function removeMarkers() {
        showMarkersOnMap(null);
        markerList = [];
    }

    function panMapToObject() {
        let latitude = $(this).attr("data-latitude");
        let longitude = $(this).attr("data-longitude");

        if (latitude.length > 0 && longitude.length > 0) {
            map.panTo(new google.maps.LatLng(parseFloat(latitude), parseFloat(longitude)));
            map.setZoom(18);
        }
    };

    function bindControlPanelViewModelToModal(viewModel) {
        $("#controlMode").val(viewModel.mode);
        $("#controlProjectType").val(viewModel.projectType);
        $("#controlControllerCode").val(viewModel.controllerCode);
        $("#controlLampSerialNo").val(viewModel.lampSerialNo);
        $("#controlLampName").val(viewModel.lampName);
        $("#controlStaRelay").val(viewModel.relayName);
        $("#controlStaMode").val(viewModel.modeDescription);
        $("#controlStaCurrent").val(viewModel.current);
        $("#controlStaAmLight").val(viewModel.ambientLight);
        $("#controlStaPWM1_Text").text(viewModel.pwm1);
        $("#controlStaPWM1_rangeWarm").val(viewModel.pwm1);
        $("#controlStaPWM2_Text").text(viewModel.pwm2);
        $("#controlStaPWM2_rangeCool").val(viewModel.pwm2);

        if (viewModel.mode > 0) {
            $("#controlActionList").val(viewModel.modeName).change();
        }

        $("#controlRelayState").val(viewModel.relay).change();
        $("#rangeWarm").text(viewModel.pwm1);
        $("#controlRangeWarm").val(viewModel.pwm1);
        $("#rangeCool").text(viewModel.pwm2);
        $("#controlRangeCool").val(viewModel.pwm2);
        $("#controlUpdatedAt").text("ข้อมูลเมื่อ: " + moment(viewModel.updatedAt).format("yyyy/MM/DD HH:mm:ss"));
    };

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

    $("#controlActionList").change(function (e) {
        $("#controlInfoModal").LoadingOverlay("show");
        hideControlActionList();

        fetch(ENDPOINT_URL.MQTTCLIENT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ "method": $(this).val() })
        }).then(response => {
            $("#controlInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                $("#controlEndpoint").attr("data-mqtt-url", viewModel.data);

                switch ($("#controlActionList").val()) {
                    case MQTT_PUBLISHER_ACTION.MODE_CHANGE:
                        $("#controlActionModeChange").toggleClass("d-none");
                        $("#controlUpdatedAt").toggleClass("d-none");
                        break;
                    case MQTT_PUBLISHER_ACTION.MANUAL:
                        $("#controlActionManual").toggleClass("d-none");
                        $("#controlUpdatedAt").toggleClass("d-none");
                        break;
                    case MQTT_PUBLISHER_ACTION.SET_SCHEDULE:
                        $("#controlActionSchedule").toggleClass("d-none");
                        $("#controlUpdatedAt").toggleClass("d-none");
                        break;
                }
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
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

    $("#controlInfoModal").on("hidden.bs.modal", function (e) {
        $("#controlEndpoint").attr("data-mqtt-url", "");

        switch ($("#controlActionList option:selected").val()) {
            case MQTT_PUBLISHER_ACTION.MODE_CHANGE:
                $("#controlActionModeChange").toggleClass("d-none");
                break;
            case MQTT_PUBLISHER_ACTION.MANUAL:
                $("#controlActionManual").toggleClass("d-none");
                break;
            case MQTT_PUBLISHER_ACTION.SET_SCHEDULE:
                $("#controlActionSchedule").toggleClass("d-none");
                break;
        }

        $("#controlUpdatedAt").toggleClass("d-none");
        $("#controlActionList").val("");
        clearControlModalInput();
    });

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

    $("#control-send-button").on("click", function (e) {
        $.LoadingOverlay("show");

        let endpoint = $("#controlEndpoint").attr("data-mqtt-url");
        let mqttReqData = {
            clientHost: MQTT_CONNECT.clientHost,
            clientPort: MQTT_CONNECT.clientPort,
            clientCredUser: MQTT_CONNECT.clientCredUser,
            clientCredPassword: MQTT_CONNECT.clientCredPassword,
            topicLevel: MQTT_CONNECT.topicLevel,
            topicProduct: MQTT_CONNECT.topicProduct,
            topicModel: MQTT_CONNECT.topicModel,
            topicGroup: MQTT_CONNECT.topicGroup,
            topicSerialNo: $("#controlLampSerialNo").val(),
            _currentMode: $("#controlMode").val()
        }

        switch ($("#controlActionList option:selected").val()) {
            case MQTT_PUBLISHER_ACTION.MODE_CHANGE:
                mqttReqData.payload = {
                    tsID: moment().format("YYMMDD-HHmmss-SSS"),
                    CMD: MQTT_CMD.CHANGE_MODE,
                    MODE: $("#controlChangeModeList option:selected").val()
                };

                if ($("#controlProjectType").val() == "1") {
                    mqttReqData.payload.SSID = $("#controlControllerCode").val();
                }
                break;

            case MQTT_PUBLISHER_ACTION.MANUAL:
                mqttReqData.payload = {
                    tsID: moment().format("YYMMDD-HHmmss-SSS"),
                    CMD: MQTT_CMD.MANUAL,
                    Relay: $("#controlRelayState option:selected").val(),
                    PWM1: $("#controlRangeWarm").val(),
                    PWM2: $("#controlRangeCool").val()
                };

                if ($("#controlProjectType").val() == "1") {
                    mqttReqData.payload.SSID = $("#controlControllerCode").val();
                }
                break;

            case MQTT_PUBLISHER_ACTION.SET_SCHEDULE:
                mqttReqData.payload = [
                    {
                        tsID: moment().format("YYMMDD-HHmmss-SSS"),
                        CMD: MQTT_CMD.SET_SCHEDULE,
                        ScheduleNo: $("#schedule_1_no").val(),
                        Start: $("#schedule_1_start").val(),
                        //Duration: $("#schedule_1_duration").val(),
                        Duration: $("#schedule_1_duration_h").val() + ":" + $("#schedule_1_duration_m").val(),
                        PWM1: $("#schedule_1_controlRangeWarm").val(),
                        PWM2: $("#schedule_1_controlRangeCool").val()
                    }
                    , {
                        tsID: moment().format("YYMMDD-HHmmss-SSS"),
                        CMD: MQTT_CMD.SET_SCHEDULE,
                        ScheduleNo: $("#schedule_2_no").val(),
                        Start: $("#schedule_2_start").val(),
                        //Duration: $("#schedule_2_duration").val(),
                        Duration: $("#schedule_2_duration_h").val() + ":" + $("#schedule_2_duration_m").val(),
                        PWM1: $("#schedule_2_controlRangeWarm").val(),
                        PWM2: $("#schedule_2_controlRangeCool").val()
                    }
                    , {
                        tsID: moment().format("YYMMDD-HHmmss-SSS"),
                        CMD: MQTT_CMD.SET_SCHEDULE,
                        ScheduleNo: $("#schedule_3_no").val(),
                        Start: $("#schedule_3_start").val(),
                        //Duration: $("#schedule_3_duration").val(),
                        Duration: $("#schedule_3_duration_h").val() + ":" + $("#schedule_3_duration_m").val(),
                        PWM1: $("#schedule_3_controlRangeWarm").val(),
                        PWM2: $("#schedule_3_controlRangeCool").val()
                    }
                    , {
                        tsID: moment().format("YYMMDD-HHmmss-SSS"),
                        CMD: MQTT_CMD.SET_SCHEDULE,
                        ScheduleNo: $("#schedule_4_no").val(),
                        Start: $("#schedule_4_start").val(),
                        //Duration: $("#schedule_4_duration").val(),
                        Duration: $("#schedule_4_duration_h").val() + ":" + $("#schedule_4_duration_m").val(),
                        PWM1: $("#schedule_4_controlRangeWarm").val(),
                        PWM2: $("#schedule_4_controlRangeCool").val()
                    }
                    , {
                        tsID: moment().format("YYMMDD-HHmmss-SSS"),
                        CMD: MQTT_CMD.SET_SCHEDULE,
                        ScheduleNo: $("#schedule_5_no").val(),
                        Start: $("#schedule_5_start").val(),
                        //Duration: $("#schedule_5_duration").val(),
                        Duration: $("#schedule_5_duration_h").val() + ":" + $("#schedule_5_duration_m").val(),
                        PWM1: $("#schedule_5_controlRangeWarm").val(),
                        PWM2: $("#schedule_5_controlRangeCool").val()
                    }
                ];

                if ($("#controlProjectType").val() == "1") {
                    mqttReqData.payload[0].SSID = $("#controlControllerCode").val();
                    mqttReqData.payload[1].SSID = $("#controlControllerCode").val();
                    mqttReqData.payload[2].SSID = $("#controlControllerCode").val();
                    mqttReqData.payload[3].SSID = $("#controlControllerCode").val();
                    mqttReqData.payload[4].SSID = $("#controlControllerCode").val();
                }
                break;

            default:
                mqttReqData = "";
                break;
        }

        if (!$.isEmptyObject(mqttReqData)) {
            fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify(mqttReqData)
            }).then(response => {
                $.LoadingOverlay("hide");
                return response.json();
            }).then(result => {
                let viewModel = JSON.parse(JSON.stringify(result));

                if (viewModel.status == "OK") {
                    Swal.fire({
                        title: "ดำเนินการสำเร็จ",
                        text: "ส่งคำสั่งไปหลอดไฟ \"" + $("#controlLampSerialNo").val() + "\" แล้ว",
                        icon: "success",
                        confirmButtonColor: "#3085d6"
                    });
                    $("#controlInfoModal").modal("hide");
                } else {
                    Swal.fire({
                        title: "เกิดข้อผิดพลาด",
                        text: "ส่งคำสั่งไม่สำเร็จ",
                        icon: "error",
                        confirmButtonColor: "#3085d6"
                    });
                }
            }).catch(error => {
                console.log(error.message);
                showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
            });
        }
    });

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