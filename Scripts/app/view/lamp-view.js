$(document).ready(function () {
    let firstloadmanual = true;
    let firstloadauto = true;
    let firstloadall = true
    let isInternalChange = false;
    let isInitializing = false;
    let dataTableInstance;

    bindButtonByPermission();

    //-----------------------------------------------

    var modalState = MODAL_STATE.CREATE;

    //-----------------------------------------------

    var defaultPagingOptions = {
        onPageClick: function (e, page) {
            getLampData($("#controllerCode option:selected").val(), page, $("#lampTextSearch").val());
        }
    };

    //-----------------------------------------------

    function bindButtonByPermission() {
        if ($("#parentRole").attr("data-valkey") == "1") {
            $("#buttonNewLamp").addClass("invisible");
            $("#modal-save-button").addClass("d-none");
            $("#control-send-button").addClass("d-none");
        }
    }

    bindingChangeModeListDropDown();

    $("#schedule_1_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_1_end").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_2_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_2_end").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_3_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_3_end").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_4_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_4_end").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_5_start").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    $("#schedule_5_end").datetimepicker({ format: "HH:mm", buttons: { showToday: true, showClose: true } });
    //$("#schedule_1_duration").datetimepicker({ format: "HH:mm" });
    //$("#schedule_2_duration").datetimepicker({ format: "HH:mm" });
    //$("#schedule_3_duration").datetimepicker({ format: "HH:mm" });
    //$("#schedule_4_duration").datetimepicker({ format: "HH:mm" });
    //$("#schedule_5_duration").datetimepicker({ format: "HH:mm" });

    if (document.location.search) {
        let queryString = {};

        $.each(document.location.search.substr(1).split('&'), function (_, params) {
            let i = params.split('=');
            queryString[i[0].toString()] = i[1].toString();
        });

        if (!$.isEmptyObject(queryString)) {
            fromDevicePageWithAsync(queryString);
        }
    } else {
        getProjectData("");
    }

    setInterval(function () {
        if ($("#isAutoRefresh").is(":checked")) {
            if (!($("#lampInfoModal").data('bs.modal') || {})._isShown && !($("#controlInfoModal").data('bs.modal') || {})._isShown && !($("#controlAllRelayStateModal").data('bs.modal') || {})._isShown) {
                if ($("#projectCode option:selected").attr("data-valkey") != "2") {
                    console.log("interval activate !");
                    getLampData($("#controllerCode option:selected").val(), $("#bottomPagination").twbsPagination("getCurrentPage"), $("#lampTextSearch").val());
                }
            }
        }
    }, 10000);

    async function fromDevicePageWithAsync(queryString) {
        await getProjectData(queryString["projectCode"]);

        $("#projectCode").val(queryString["projectCode"]).change(
            getControllerData(queryString["projectCode"], queryString["controllerCode"])
        );

        $("#controllerCode").val(queryString["projectCode"]).change(
            getLampData(queryString["controllerCode"], 1, "")
        );

        bindingAddButtonState();
    }

    //-----------------------------------------------

    function validateData() {
        let isValid = true;

        if (!$("#lampSerialNo").val().trim()) {
            $("#lampSerialNo").addClass("is-invalid")
            isValid = false;
        }

        if (!$("#lampName").val().trim()) {
            $("#lampName").addClass("is-invalid")
            isValid = false;
        }

        return isValid;
    };

    async function getProjectData(selectProjectCode) {
        $("#projectCode").LoadingOverlay("show");

        await fetch(ENDPOINT_URL.PROJECT_BY_CUSTOMER, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }).then(response => {
            $("#projectCode").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                bindingProjectDropdown(viewModel.data);

                if (viewModel.data.length > 0) {
                    if (selectProjectCode.trim().length > 0) {
                        $("#projectCode").val(selectProjectCode);
                    } else {
                        $("#projectCode").prop('selectedIndex', 0).change();
                    }
                }
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    function bindingChangeModeListDropDown() {
        $("#controlChangeModeList").append("<option value='1'>กำหนดการทำงานด้วยตนเอง</option>");
        $("#controlChangeModeList").append("<option value='2'>ตั้งเวลาทำงานอัตโนมัติ</option>");

        if ($("#parentRole").attr("data-valkey") != "1") {
            $("#controlChangeModeList").append("<option value='-1'>DEBUG</option>");
            $("#controlChangeModeList").append("<option value='0'>CONFIG</option>");
            $("#controlChangeModeList").append("<option value='3'>AMBIENT_LIGHT</option>");
            $("#controlChangeModeList").append("<option value='4'>SCHEDULER_WITH_AMBIENT_LIGHT</option>");
        }
    };

    function bindingProjectDropdown(jsonProject) {
        if (jsonProject.length > 0) {
            $.each(jsonProject, function (_, item) {
                $("#projectCode").append($("<option value=" + item.projectCode + " data-valkey=" + item.projectType + ">" + item.projectName + "</option>"));
            });
        } else {
            $("#projectCode").append("<option selected disabled value=''>ไม่มีข้อมูล</option>");

            if (!$("#buttonNewLamp").hasClass("invisible")) {
                $("#buttonNewLamp").addClass("invisible");
            }
        }
    };

    function bindingAddButtonState() {
        if ($("#projectCode option:selected").attr("data-valkey") == "2") {
            if (!$("#buttonNewLamp").hasClass("invisible")) {
                $("#buttonNewLamp").addClass("invisible");
            }

            if ($("#EMMProjectWarning").hasClass("d-none")) {
                $("#EMMProjectWarning").removeClass("d-none")
            }

            if (!$("#no-more-tables").hasClass("d-none")) {
                $("#no-more-tables").addClass("d-none")
            }
        } else {
            if ($("#buttonNewLamp").hasClass("invisible")) {
                $("#buttonNewLamp").removeClass("invisible");
            }

            if (!$("#EMMProjectWarning").hasClass("d-none")) {
                $("#EMMProjectWarning").addClass("d-none")
            }

            if ($("#no-more-tables").hasClass("d-none")) {
                $("#no-more-tables").removeClass("d-none")
            }
        }

        bindButtonByPermission();
    }

    $("#projectCode").change(function (e) {
        bindingAddButtonState();

        $("#lampTextSearch").val("");
        $("#no-more-tables tbody").empty();

        getControllerData($("#projectCode option:selected").val(), "");
    });

    function getControllerData(projectCode, selectControllerCode) {
        $("#controllerCode").LoadingOverlay("show");

        let projectData = {
            projectCode: projectCode
        };

        fetch(ENDPOINT_URL.CONTROLLER_BY_PROJECT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(projectData)
        }).then(response => {
            $("#controllerCode").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                resetControllerDropDown();
                bindingControllerDropdown(viewModel.data);

                if (selectControllerCode.trim().length > 0) {
                    $("#controllerCode").val(selectControllerCode);
                } else {
                    $("#controllerCode").prop('selectedIndex', 0).change();
                }
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    function bindingControllerDropdown(jsonController) {
        if (jsonController.length > 0) {
            $.each(jsonController, function (_, item) {
                $("#controllerCode").append($("<option value=" + item.controllerCode + ">" + item.controllerName + "</option>"));
            });
        } else {
            $("#controllerCode").append("<option selected disabled value=''>ไม่มีข้อมูล</option>");
        }
    };

    function resetControllerDropDown() {
        $("#controllerCode").empty();
    };

    $("#controllerCode").change(function (e) {
        getLampData($("#controllerCode option:selected").val(), 1, "");
    });

    function getLampData(controllerCode, currentPage, searchText) {
        if ($("#projectCode option:selected").attr("data-valkey") != "2") {
            // $("#no-more-tables").LoadingOverlay("show");

            currentPage = typeof currentPage == "number" ? currentPage : 1;

            let lampData = {
                controllerCode: controllerCode,
                page: currentPage,
                searchText: searchText
            };

            fetch(ENDPOINT_URL.LAMP_LIST, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify(lampData)
            }).then(response => {
                $("#no-more-tables").LoadingOverlay("hide");
                return response.json();
            }).then(result => {
                let viewModel = JSON.parse(JSON.stringify(result));

                if (viewModel.state == "success") {
                    if (currentPage > viewModel.pagingTotalPage) {
                        currentPage = viewModel.pagingTotalPage;
                    }

                    bindingLampTable(viewModel.data, viewModel.pagingTotalPage, currentPage);
                } else {
                    showDialog(viewModel.state, viewModel.title, viewModel.message);
                }
            }).catch(error => {
                console.log(error.message);
                showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
            });
        } else {
            if ($("#EMMProjectWarning").hasClass("d-none")) {
                $("#EMMProjectWarning").removeClass("d-none")
            }

            $("#no-more-tables tbody").empty();
            destroyPaging();

            return;
        }
    };

    function bindingLampTable(data, totalPage, currentPage) {
        if ($("#no-more-tables").hasClass("d-none")) {
            $("#no-more-tables").removeClass("d-none");
        }

        let tableBody = $("#no-more-tables tbody");
        tableBody.empty();

        let colSize = 4;
        if (data.length == 0) {
            tableBody.append("<tr><td colspan='" + colSize.toString() + "'>ไม่มีข้อมูล</td></tr>");
        } else {
            $.each(data, function (_, item) {
                let tableRow = jQuery("<tr></tr>");
                let serialNoCol = jQuery("<td></td>").attr("data-title", "Mac Address").html(item.lampCode).appendTo(tableRow);
                let lampNameCol = jQuery("<td></td>").attr("data-title", "ชื่อหลอดไฟ").html(item.lampName).appendTo(tableRow);

                let statusBadge;
                switch (item.lampStatus) {
                    case 0:
                        statusBadge = "badge-dark";
                        break;
                    case 1:
                        statusBadge = "badge-warning";
                        break;
                    case 2:
                        statusBadge = "badge-danger";
                        break;
                }
                let badgeHtml = "<span class=\"badge badge-pill " + statusBadge + "\">" + item.lampStatusText + "</span>";
                let lampStatusCol = jQuery("<td></td>").attr("data-title", "สถานะ").html(badgeHtml).appendTo(tableRow);

                let buttonCol = jQuery("<td></td>").appendTo(tableRow);

                let buttonArea = jQuery("<div></div>", {
                    class: "d-flex justify-content-end flex-wrap"
                }).appendTo(buttonCol);

                let controlButton = jQuery("<button></button>", {
                    type: "button",
                    class: "btn btn-light btn-icon"
                })
                    .attr("data-valkey", item.lampCode).html("<i class=\"mdi mdi-tune-vertical\"></i>")
                    .attr("data-status", item.lampStatus)
                    .on("click", showControlModal)
                    .appendTo(buttonArea);
                controlButton.tooltip({ title: "แผงควบคุม", boundary: "window", placement: "left" });

                let editButton = jQuery("<button></button>", {
                    type: "button",
                    class: "btn btn-light btn-icon ml-3"
                })
                // .attr("data-valkey", item.lampCode).html("<i class=\"mdi mdi-pencil\"></i>")
                // .on("click", showLampModalInEditMode)
                // .appendTo(buttonArea);
                editButton.tooltip({ title: "แก้ไขข้อมูล", boundary: "window", placement: "left" });

                if ($("#parentRole").attr("data-valkey") != "1") {
                    let deleteButton = jQuery("<button></button>", {
                        type: "button",
                        class: "btn btn-light btn-icon ml-3"
                    })
                        .attr("data-valkey", item.lampCode)
                        .on("click", promptDeleteLamp)
                        .html("<i class=\"mdi mdi-delete\"></i>")
                        .appendTo(buttonArea);
                    deleteButton.tooltip({ title: "ลบ", boundary: "window", placement: "left" });
                }

                tableBody.append(tableRow);
            });
        }

        destroyPaging();
        $("#bottomPagination").twbsPagination($.extend({}, defaultPagingOptions, {
            startPage: currentPage <= totalPage ? currentPage : totalPage,
            totalPages: totalPage
        }));
    };

    function destroyPaging() {
        if ($("#bottomPagination").data("twbs-pagination")) {
            $("#bottomPagination").twbsPagination("destroy");
        }
    };

    // function showControlModal() {
    //     firstLoad = true;
    //     if ($(this).attr("data-status") == "2") {
    //         Swal.fire({
    //             title: "เกิดข้อผิดพลาด",
    //             text: "ไม่สามารถเชื่อมต่อหลอดไฟ \"" + $(this).attr("data-valkey") + "\"",
    //             icon: "error"
    //         });
    //         return;
    //     }
    //     $("#controlInfoModal").modal("show");
    //     $("#controlInfoModal").LoadingOverlay("show");
    //     fetch(ENDPOINT_URL.LAMP_STATUS, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json; charset=utf-8"
    //         },
    //         body: JSON.stringify({ "lampCode": $(this).attr("data-valkey") })
    //     }).then(response => {
    //         $("#controlInfoModal").LoadingOverlay("hide");
    //         return response.json();
    //     }).then(result => {
    //         let viewModel = JSON.parse(JSON.stringify(result));

    //         if (viewModel.state == "success") {
    //             clearControlModalInput();
    //             bindControlPanelViewModelToModal(viewModel.data);
    //             $("#controlInfoModal").modal("show");
    //         } else {
    //             showDialog(viewModel.state, viewModel.title, viewModel.message);
    //         }
    //     }).catch(error => {
    //         console.log(error.message);
    //         showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
    //     });
    // }

    function showControlModal() {
        firstloadmanual = true
        firstloadauto = true
        const macaddress = $(this).attr("data-valkey")
        const endpoint = `http://85.204.247.82:3002/api/getmacdatas/${macaddress}`
        const options = {
            method: "GET"
        }

        if ($(this).attr("data-status") == "2") {
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                html: `ไม่สามารถเชื่อมต่อหลอดไฟ <strong>"${$(this).attr("data-valkey")}"</strong> ได้`,
                icon: "error"
            });
            return;
        }

        Swal.fire({
            title: '🔄 กำลังดึงข้อมูล...',
            html: `
        <div style="font-size: 16px; color: #555;">
            กำลังดึงข้อมูลอุปกรณ์ <strong>${macaddress}</strong><br>
            กรุณารอสักครู่...
        </div>
    `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        setTimeout(() => {
            fetch(endpoint, options)
                .then(res => {
                    $("#controlInfoModal").LoadingOverlay("hide");
                    Swal.fire({
                        position: "center",
                        icon: 'success',
                        title: "สำเร็จ",
                        html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
  ✅ ดึงข้อมูลอุปกรณ์ <strong style="color: #1b5e20;">${macaddress}</strong> สำเร็จ
</div>`,
                        showConfirmButton: false,
                        timer: 1500
                    })
                    return res.json();
                }).then(result => {
                    let obj = result

                    clearControlModalInput();
                    bindControlPanelViewModelToModal(obj);

                    setTimeout(() => {
                        $("#controlInfoModal").modal("show");
                    }, 1500);

                    // if (viewModel.state == "success") {
                    //     clearControlModalInput();
                    //     bindControlPanelViewModelToModal(viewModel.data);
                    //     $("#controlInfoModal").modal("show");
                    // } else {
                    //     showDialog(viewModel.state, viewModel.title, viewModel.message);
                    // }
                }).catch(error => {
                    console.log(error.message);
                    Swal.fire({
                        position: "center",
                        icon: 'error',
                        title: "ผิดพลาด!",
                        html: `ดึงข้อมูลอุปกรณ์ <b>${macaddress}</b> ไม่สำเร็จ`,
                        showConfirmButton: false,
                        timer: 1500
                    })
                });
        }, 5000)
    }


    function showLampModalInEditMode() {
        modalState = MODAL_STATE.UPDATE;

        $("#lampInfoModalLongTitle").text("ข้อมูลหลอดไฟ");
        $("#lampInfoModal").LoadingOverlay("show");

        fetch(ENDPOINT_URL.LAMP_INFO, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ "lampCode": $(this).attr("data-valkey") })
        }).then(response => {
            $("#lampInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                bindLampViewModelToModal(viewModel.data);
                $("#lampInfoModal").modal("show");
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    function promptDeleteLamp() {
        const mac = $(this).attr("data-valkey");
        Swal.fire({
            title: "ยืนยันรายการ",
            text: "ลบหลอดไฟ \"" + $(this).attr("data-valkey") + "\" ออกจากระบบ?",
            icon: "question",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "ลบ",
            showCancelButton: true,
            cancelButtonColor: "#d33",
            cancelButtonText: "ยกเลิก"
        }).then((result) => {
            if (result.isConfirmed) {
                $.LoadingOverlay("show");

                fetch(ENDPOINT_URL.LAMP_DELETE, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({ "lampCode": $(this).attr("data-valkey") })
                }).then(response => {
                    $.LoadingOverlay("hide");
                    return response.json();
                }).then(result => {
                    let viewModel = JSON.parse(JSON.stringify(result));

                    if (viewModel.state == "success") {
                        deleteDevices(mac)
                        Swal.fire({
                            title: viewModel.title,
                            text: viewModel.message,
                            icon: viewModel.state,
                            confirmButtonColor: "#3085d6"
                        }).then((result) => {
                            if (viewModel.state == "success") {
                                getLampData($("#controllerCode option:selected").val(), $("#bottomPagination").twbsPagination("getCurrentPage"), $("#lampTextSearch").val());
                            }
                        });
                    } else {
                        showDialog(viewModel.state, viewModel.title, viewModel.message);
                    }
                }).catch(error => {
                    console.log(error.message);
                    showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
                });
            }
        });
    };

    function bindLampViewModelToModal(viewModel) {
        $("#lampSerialNo").val(viewModel.lampCode);
        $("#lampSerialNo").prop("disabled", true);

        $("#lampName").val(viewModel.lampName);
        $("#lampDescription").val(viewModel.lampDescription);
        $("#lampLat").val(viewModel.latitude);
        $("#lampLong").val(viewModel.longitude);
        $("#isWarning").prop("checked", viewModel.allowNotify);
    };

    $(".modal-state-create").on("click", function (e) {
        modalState = MODAL_STATE.CREATE;
        $("#lampInfoModalLongTitle").text("เพิ่มหลอดไฟใหม่");
    });

    $("#modal-save-button").on("click", function (e) {
        if (!validateData()) {
            return;
        }

        $("#lampInfoModal").LoadingOverlay("show");

        let postToUrl;
        switch (modalState) {
            case MODAL_STATE.CREATE:
                postToUrl = ENDPOINT_URL.LAMP_CREATE;
                break;
            case MODAL_STATE.UPDATE:
                postToUrl = ENDPOINT_URL.LAMP_UPDATE;
                break;
        };

        let controllerData = {
            lampCode: $("#lampSerialNo").val(),
            lampName: $("#lampName").val(),
            lampDescription: $("#lampDescription").val(),
            controllerCode: $("#controllerCode option:selected").val(),
            lampSerialNo: $("#lampSerialNo").val(),
            latitude: $("#lampLat").val(),
            longitude: $("#lampLong").val(),
            allowNotify: $("#isWarning").is(":checked")
        };

        fetch(postToUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(controllerData)
        }).then(response => {
            $("#lampInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                $("#lampInfoModal").modal("hide");
            }

            Swal.fire({
                title: viewModel.title,
                text: viewModel.message,
                icon: viewModel.state,
                confirmButtonColor: "#3085d6"
            }).then((result) => {
                if (viewModel.state == "success") {
                    getLampData($("#controllerCode option:selected").val(), $("#bottomPagination").twbsPagination("getCurrentPage"), $("#lampTextSearch").val());
                }
            });
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    });

    $("#lampInfoModal").on("hidden.bs.modal", function (e) {
        $("#lampSerialNo").val("");
        $("#lampSerialNo").prop("disabled", false);

        $("#lampName").val("");
        $("#lampDescription").val("");
        $("#lampLat").val("");
        $("#lampLong").val("");
        $("#isWarning").prop("checked", true);

        $("#lampSerialNo").removeClass("is-invalid")
        $("#lampName").removeClass("is-invalid")

    });

    $("#lampTextSearch").keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $("#lampSearchSubmit").click();
        }
    });

    $("#lampSearchSubmit").on("click", function (e) {
        getLampData($("#controllerCode option:selected").val(), 1, $("#lampTextSearch").val());
    });

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

    //     // $("#controlRelayState").val(viewModel.relay).change();

    //     toggleStatus(viewModel.relay)

    //     $("#rangeWarm").text(viewModel.pwm1);
    //     $("#controlRangeWarm").val(viewModel.pwm1);
    //     $("#rangeCool").text(viewModel.pwm2);
    //     $("#controlRangeCool").val(viewModel.pwm2);
    //     $("#controlUpdatedAt").text("ข้อมูลเมื่อ: " + moment(viewModel.updatedAt).format("yyyy/MM/DD HH:mm:ss"));
    // };

    function bindControlPanelViewModelToModal(obj) {
        isInitializing = true;
        let relay = obj.data[0]?.relay
        let workmode = obj.data[0]?.workmode

        const relayMap = {
            ON: "เปิด",
            OFF: "ปิด"
        };

        const workmodeMap = {
            MANUAL: "กำหนดการทำงานด้วยตนเอง",
            SCHEDULE: "ตั้งเวลาทำงานอัตโนมัติ"
        };

        relay = relayMap[relay] || relay
        workmode = workmodeMap[workmode] || workmode

        // $("#controlMode").val(viewModel.mode);
        // $("#controlProjectType").val(viewModel.projectType);
        // $("#controlControllerCode").val(viewModel.controllerCode);
        $("#controlLampSerialNo").val(obj.data[0]?.macAddress);
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
            console.log("MANUAL")
            $("#controlActionList").val(obj.data[0]?.workmode).trigger("change");
            $('#control-send-manual').removeClass('d-none')
            $('#control-send-auto').addClass('d-none')
            $("#manual").fadeIn()
            $("#auto").fadeOut()
            $("#pills-tabContent").fadeIn()
            $("#pills-tabContent").removeClass("d-none")
            $("#auto").removeClass("active show")
            $("#manual").addClass("active show")
            $("#auto-tab").removeClass("active")
            $("#auto-tab").addClass("disabled")
            $("#manual-tab").addClass("active")
            $(".n-pills").removeClass("d-none")

        } else if (obj.data[0]?.workmode === "SCHEDULE") {
            console.log("SCHEDULE")
            let mode = obj.data[0]?.workmode
            if (mode === "SCHEDULE") {
                mode = "SET_SCHEDULE"
            }
            //startTime
            const schTimeStart = {
                schStartTime1: obj.data[0]?.schStartTime1,
                schStartTime2: obj.data[0]?.schStartTime2,
                schStartTime3: obj.data[0]?.schStartTime3,
                schStartTime4: obj.data[0]?.schStartTime4,
                schStartTime5: obj.data[0]?.schStartTime5,
            }

            //endTime
            const schTimeEnd = {
                schEndTime1: obj.data[0]?.schEndTime1,
                schEndTime2: obj.data[0]?.schEndTime2,
                schEndTime3: obj.data[0]?.schEndTime3,
                schEndTime4: obj.data[0]?.schEndTime4,
                schEndTime5: obj.data[0]?.schEndTime5,
            }

            const schPwm1 = {
                schPwm11: obj.data[0]?.schPwm11,
                schPwm12: obj.data[0]?.schPwm12,
                schPwm13: obj.data[0]?.schPwm13,
                schPwm14: obj.data[0]?.schPwm14,
                schPwm15: obj.data[0]?.schPwm15,
            }

            const schPwm2 = {
                schPwm21: obj.data[0]?.schPwm21,
                schPwm22: obj.data[0]?.schPwm22,
                schPwm23: obj.data[0]?.schPwm23,
                schPwm24: obj.data[0]?.schPwm24,
                schPwm25: obj.data[0]?.schPwm25,
            }

            Object.values(schTimeStart).forEach((item, index) => {
                const i = index + 1
                $(`#schedule_${i}_start`).val(item)
            })

            Object.values(schTimeEnd).forEach((item, index) => {
                const i = index + 1
                $(`#schedule_${i}_end`).val(item)
            })

            Object.values(schPwm1).forEach((item, index) => {
                const i = index + 1
                $(`#schedule_${i}_controlRangeWarm`).val(item)
                $(`#schedule_${i}_rangeWarm`).text(item)
            })

            Object.values(schPwm2).forEach((item, index) => {
                const i = index + 1
                $(`#schedule_${i}_controlRangeCool`).val(item)
                $(`#schedule_${i}_rangeCool`).text(item)
            })

            $('#control-send-auto').removeClass('d-none')
            $('#control-send-manual').addClass('d-none')
            $("#controlActionList").val(mode).trigger("change");
            $("#auto").fadeIn()
            $("#manual").fadeOut()
            $("#pills-tabContent").fadeIn()
            $("#pills-tabContent").removeClass("d-none")
            $("#manual").removeClass("active show")
            $("#auto").addClass("active show")
            $("#manual-tab").removeClass("active")
            $("#auto-tab").addClass("active")
            $("#manual-tab").addClass("disabled")
            $(".n-pills").removeClass("d-none")
        }

        toggleStatus(obj.data[0]?.relay)
        toggleStatus2(obj.data[0]?.relay)


        firstloadmanual = false
        firstloadauto = false
        isInitializing = false;

        // $("#rangeWarm").text(viewModel.pwm1);
        // $("#controlRangeWarm").val(viewModel.pwm1);
        // $("#rangeCool").text(viewModel.pwm2);
        // $("#controlRangeCool").val(viewModel.pwm2);
        // $("#controlUpdatedAt").text(`ข้อมูลอัพเดทล่าสุดเมื่อ ${obj.data[0]?.datetime}`);
    };

    // function hideControlActionList() {
    //     if (!$("#controlActionModeChange").hasClass("d-none")) {
    //         $("#controlActionModeChange").addClass("d-none");
    //     }

    //     if (!$("#controlActionManual").hasClass("d-none")) {
    //         $("#controlActionManual").addClass("d-none");
    //     }

    //     if (!$("#controlActionSchedule").hasClass("d-none")) {
    //         $("#controlActionSchedule").addClass("d-none");
    //     }
    // };

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

    function clearControlModalInput() {
        $("#rangeWarm").text("0");
        $("#controlRangeWarm").val("0");
        $("#rangeCool").text("0");
        $("#controlRangeCool").val("0");

        $("#schedule_1_start").val("00:00");
        $("#schedule_1_end").val("00:00");
        $("#schedule_1_duration_h").val("0");
        $("#schedule_1_duration_m").val("0");
        $("#schedule_1_rangeWarm").text("0");
        $("#schedule_1_controlRangeWarm").val("0");
        $("#schedule_1_rangeCool").text("0");
        $("#schedule_1_controlRangeCool").val("0");

        $("#schedule_2_start").val("00:00");
        $("#schedule_2_end").val("00:00");
        $("#schedule_2_duration_h").val("0");
        $("#schedule_2_duration_m").val("0");
        $("#schedule_2_rangeWarm").text("0");
        $("#schedule_2_controlRangeWarm").val("0");
        $("#schedule_2_rangeCool").text("0");
        $("#schedule_2_controlRangeCool").val("0");

        $("#schedule_3_start").val("00:00");
        $("#schedule_3_end").val("00:00");
        $("#schedule_3_duration_h").val("0");
        $("#schedule_3_duration_m").val("0");
        $("#schedule_3_rangeWarm").text("0");
        $("#schedule_3_controlRangeWarm").val("0");
        $("#schedule_3_rangeCool").text("0");
        $("#schedule_3_controlRangeCool").val("0");

        $("#schedule_4_start").val("00:00");
        $("#schedule_4_end").val("00:00");
        $("#schedule_4_duration_h").val("0");
        $("#schedule_4_duration_m").val("0");
        $("#schedule_4_rangeWarm").text("0");
        $("#schedule_4_controlRangeWarm").val("0");
        $("#schedule_4_rangeCool").text("0");
        $("#schedule_4_controlRangeCool").val("0");

        $("#schedule_5_start").val("00:00");
        $("#schedule_5_end").val("00:00");
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

    // $("#controlRelayState").change(function (e) {
    //     switch ($(this).val()) {
    //         case "0":
    //             $("#controlRangeWarm").prop("disabled", true);
    //             $("#controlRangeCool").prop("disabled", true);
    //             $("#controlRangeWarm").val("0");
    //             $("#controlRangeCool").val("0");
    //             $("#rangeWarm").text("0");
    //             $("#rangeCool").text("0");
    //             break;
    //         case "1":
    //             $("#controlRangeWarm").prop("disabled", false);
    //             $("#controlRangeCool").prop("disabled", false);
    //             break;
    //     }
    // });

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
    //     }
    // });

    $('.numberInputValidate').keypress(function (e) {
        return numberInputValidate(e);
    });

    $('.numberInputValidate').blur(function (e) {
        if (e.currentTarget.value == "") {
            e.currentTarget.value = "0";
        }
    });

    function toggleLight() {
        const checkbox = document.getElementById('toggle');
        const light = document.getElementById('light');

        if (checkbox.checked) {
            light.classList.add('on');
        } else {
            light.classList.remove('on');
        }
    }

    $('.md-close').on('click', function () {
        $("#pills-tabContent").fadeOut()
        $('#controlActionList').val('0')
        $("#manual-tab").addClass("disabled")
        $("#auto-tab").addClass("disabled")
        $(".n-pills").fadeOut()
        $(".n-pills").addClass("d-none")

    });

    $('#controlActionList').change(function () {

        if (isInitializing) return;

        const macAddress = $("#controlLampSerialNo").val();
        const endpoint_updatemode = "http://85.204.247.82:3002/api/updateMode"
        const endpoint_off = "http://85.204.247.82:3002/api/turnofflight"
        const btnswitchmanual = $('#controlRelayState')
        const btnswitchauto = $('#controlRelayState2')
        let mode = $(this).val();
        $('.mn').fadeOut()
        $('.mn2').fadeOut()

        if (mode === "SET_SCHEDULE") {
            mode = "SCHEDULE";
        }

        const dataoff = {
            macAddress
        }

        const dataupdate = {
            macAddress,
            mode
        }



        if ($(this).val() === "MANUAL") {
            Swal.fire({
                title: "เปลี่ยน Mode?",
                html: `ต้องการเปลี่ยน <strong>${macAddress}</strong> เป็น <strong>Mode Manual</strong> ใช่หรือไม่?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก"
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
                        }
                    });

                    setTimeout(() => {
                        fetch(endpoint_off, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8"
                            },
                            body: JSON.stringify(dataoff)
                        }).then(response => {
                            firstloadmanual = true
                            btnswitchmanual.bootstrapToggle('off')
                            if (!btnswitchmanual.prop('checked')) {
                                console.log('!btnswitchmanual.prop(checked)')
                                $('.mn').fadeOut()
                            }
                            return response.json();
                        }).then(result => {
                            console.log('result', result)
                        }).catch(err => {
                            console.error("เกิดข้อผิดพลาด:", err);
                            Swal.fire({
                                position: "center",
                                icon: 'error',
                                title: "❌ ผิดพลาด!",
                                html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                showConfirmButton: false,
                                timer: 2000
                            })
                        })
                    }, 1000);

                    setTimeout(() => {
                        fetch(endpoint_updatemode, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8"
                            },
                            body: JSON.stringify(dataupdate)
                        }).then(response =>
                            response.json()
                        ).then(result => {
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
                                    timer: 2000
                                });
                            } else if (res.msg === "Error") {
                                Swal.fire({
                                    icon: "error",
                                    title: "❌ ไม่สำเร็จ!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            ไม่สามารถเปลี่ยน <strong>${macAddress}</strong> เป็น <strong>Mode Manual</strong> ได้
        </div>
    `
                                })
                            }
                            $('#control-send-manual').removeClass('d-none')
                            $('#control-send-auto').addClass('d-none')
                            $("#manual").fadeIn()
                            $("#auto").fadeOut()
                            $("#pills-tabContent").fadeIn()
                            $("#pills-tabContent").removeClass("d-none")
                            $("#auto").removeClass("active show")
                            $("#manual").addClass("active show")
                            $("#auto-tab").removeClass("active")
                            $("#auto-tab").addClass("disabled")
                            $("#manual-tab").addClass("active")
                            $(".n-pills").removeClass("d-none")
                        }).catch(error => {
                            console.error("เกิดข้อผิดพลาด:", err);
                            Swal.fire({
                                position: "center",
                                icon: 'error',
                                title: "❌ ผิดพลาด!",
                                html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                showConfirmButton: false,
                                timer: 2000
                            })
                        })
                    }, 2000)
                } else {
                    $('#controlActionList').val('0')
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
                cancelButtonText: "ยกเลิก"
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
                        }
                    });

                    setTimeout(() => {
                        fetch(endpoint_off, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8"
                            },
                            body: JSON.stringify(dataoff)
                        }).then(response => {
                            firstloadauto = true
                            btnswitchauto.bootstrapToggle('off')
                            if (!btnswitchauto.prop('checked')) {
                                console.log('!btnswitchauto.prop(checked)')
                                $('.mn2').fadeOut()
                            }
                            return response.json();
                        }).then(result => {
                            console.log('result', result)
                        }).catch(err => {
                            console.error("เกิดข้อผิดพลาด:", err);
                            Swal.fire({
                                position: "center",
                                icon: 'error',
                                title: "❌ ผิดพลาด!",
                                html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                showConfirmButton: false,
                                timer: 2000
                            })
                        })
                    }, 1000);

                    setTimeout(() => {
                        fetch(endpoint_updatemode, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8"
                            },
                            body: JSON.stringify(dataupdate)
                        }).then(response => {
                            return response.json();
                        }).then(result => {
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
                                    timer: 1800
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
    `
                                });

                            }
                            $('#control-send-auto').removeClass('d-none')
                            $('#control-send-manual').addClass('d-none')
                            $("#auto").fadeIn()
                            $("#manual").fadeOut()
                            $("#pills-tabContent").fadeIn()
                            $("#pills-tabContent").removeClass("d-none")
                            $("#manual").removeClass("active show")
                            $("#auto").addClass("active show")
                            $("#manual-tab").removeClass("active")
                            $("#auto-tab").addClass("active")
                            $("#manual-tab").addClass("disabled")
                            $(".n-pills").removeClass("d-none")
                        }).catch(error => {
                            console.log(error.message);
                            console.error("เกิดข้อผิดพลาด:", err);
                            Swal.fire({
                                position: "center",
                                icon: 'error',
                                title: "❌ ผิดพลาด!",
                                html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                showConfirmButton: false,
                                timer: 2000
                            })
                        })
                    }, 2000)
                } else {
                    $('#controlActionList').val('0')
                }
            })
        } else if ($(this).val() === "0") {
            Swal.fire({
                title: "⚠️ คุณไม่ได้เลือก Mode",
                text: "กรุณาเลือก Mode การทำงาน",
                icon: "warning",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "ตกลง"
            }).then((result) => {
                if (result.isConfirmed) {
                    $("#pills-tabContent").fadeOut()
                    $("#manual-tab").addClass("disabled")
                    $("#auto-tab").addClass("disabled")
                    $(".n-pills").fadeOut()
                    $(".n-pills").addClass("d-none")
                } else {
                    $('#controlActionList').val('0')
                }
            })
        }
    });

    $('#controlRelayState').on('change', function () {
        if (firstloadmanual) {
            firstloadmanual = false;
            return;
        }

        if (isInternalChange) {
            isInternalChange = false;
            return;
        }

        const controlRelay = $("#controlRelayState");
        const macAddress = $('#controlLampSerialNo').val()
        const endpointon = "http://85.204.247.82:3002/api/turnonlight"
        const endpointoff = "http://85.204.247.82:3002/api/turnofflight"
        const datas = {
            macAddress,
        }
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(datas)
        }

        if ($(this).is(":checked")) {
            Swal.fire({
                title: "⚠️ ต้องการส่งคำสั่ง?",
                html: `<div style="font-size: 16px;">ต้องการเปิดไฟอุปกรณ์ <strong>${macAddress}</strong> ใช่หรือไม่?</div>`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก"
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '🔄 กำลังส่งคำสั่ง...',
                        html: `
        <div style="font-size: 16px; color: #555;">
            กำลังส่งคำสั่งเปิดไฟอุปกรณ์ <strong>${macAddress}</strong><br>
            กรุณารอสักครู่...
        </div>
    `,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        timerProgressBar: true,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    setTimeout(() => {
                        fetch(endpointon, options)
                            .then(res => res.json())
                            .then(obj => {
                                Swal.close();
                                $(".mn").fadeIn();
                                Swal.fire({
                                    position: "center",
                                    icon: 'success',
                                    title: "สำเร็จ",
                                    html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
  ✅ เปิดไฟอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
</div>`,
                                    showConfirmButton: false,
                                    timer: 1500
                                })
                                $(this).prop('disabled', true);
                                const btn = $('#control-send-manual')
                                btn.removeAttr('disabled');
                                btn.removeClass('btn-secondary');
                                btn.addClass('btn-success');
                                setTimeout(() => {
                                    $(this).prop('disabled', false);
                                }, 5000);
                            })
                            .catch(err => {
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: 'error',
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เปิดไฟไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000
                                })
                            });
                    }, 1000);
                } else {
                    isInternalChange = true;
                    controlRelay.bootstrapToggle('off');
                    $(".mn").fadeOut();
                    const btn = $('#control-send-manual')
                    btn.attr('disabled', true);
                    btn.removeClass('btn-success');
                    btn.addClass('btn-secondary');
                }
            });

        } else {
            Swal.fire({
                title: "⚠️ ต้องการส่งคำสั่ง?",
                html: `<div style="font-size: 16px;">ต้องการปิดไฟอุปกรณ์ <strong>${macAddress}</strong> ใช่หรือไม่?</div>`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก"
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '🔄 กำลังส่งคำสั่ง...',
                        html: `
        <div style="font-size: 16px; color: #555;">
            กำลังส่งคำสั่งปิดไฟอุปกรณ์ <strong>${macAddress}</strong><br>
            กรุณารอสักครู่...
        </div>
    `,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        timerProgressBar: true,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    setTimeout(() => {
                        fetch(endpointoff, options)
                            .then(res => res.json())
                            .then(obj => {
                                Swal.close();
                                $(".mn").fadeOut();
                                Swal.fire({
                                    position: "center",
                                    icon: 'success',
                                    title: "สำเร็จ",
                                    html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
  ✅ ปิดไฟอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
</div>`,
                                    showConfirmButton: false,
                                    timer: 1500
                                })
                                $(this).prop('disabled', true);
                                const btn = $('#control-send-manual')
                                btn.attr('disabled', true);
                                btn.removeClass('btn-success');
                                btn.addClass('btn-secondary');
                                setTimeout(() => {
                                    $(this).prop('disabled', false);
                                }, 3000);
                            })
                            .catch(err => {
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: 'error',
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>ปิดไฟไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000
                                })
                            });
                    }, 1000);
                } else {
                    isInternalChange = true;
                    controlRelay.bootstrapToggle('on');
                }
            });
        }
    });

    $('#controlRelayState2').on('change', function () {
        if (firstloadauto) {
            firstloadauto = false;
            return;
        }

        if (isInternalChange) {
            isInternalChange = false;
            return;
        }

        const controlRelay = $("#controlRelayState2");
        const macAddress = $('#controlLampSerialNo').val()
        const endpointon = "http://85.204.247.82:3002/api/turnonlight"
        const endpointoff = "http://85.204.247.82:3002/api/turnofflight"
        const datas = {
            macAddress
        }
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(datas)
        }

        if ($(this).is(":checked")) {

            Swal.fire({
                title: "⚠️ ต้องการส่งคำสั่ง?",
                html: `<div style="font-size: 16px;">ต้องการเปิดไฟอุปกรณ์ <strong>${macAddress}</strong> ใช่หรือไม่?</div>`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก"
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '🔄 กำลังส่งคำสั่ง...',
                        html: `
        <div style="font-size: 16px; color: #555;">
            กำลังส่งคำสั่งเปิดไฟอุปกรณ์ <strong>${macAddress}</strong><br>
            กรุณารอสักครู่...
        </div>
    `,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        timerProgressBar: true,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    setTimeout(() => {
                        fetch(endpointon, options)
                            .then(res => res.json())
                            .then(obj => {
                                // console.log("obj", obj.status);
                                Swal.close();
                                $(".mn2").fadeIn();
                                Swal.fire({
                                    position: "center",
                                    icon: 'success',
                                    title: "สำเร็จ",
                                    html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
  ✅ เปิดไฟอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
</div>`,
                                    showConfirmButton: false,
                                    timer: 1500
                                })
                                $(this).prop('disabled', true);
                                const btn = $('#control-send-auto')
                                btn.removeAttr('disabled');
                                btn.removeClass('btn-secondary');
                                btn.addClass('btn-success');
                                setTimeout(() => {
                                    $(this).prop('disabled', false);
                                }, 5000);
                            })
                            .catch(err => {
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: 'error',
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>เปิดไฟไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000
                                })
                            });
                    }, 1000);
                    // showControlModal()
                } else {
                    isInternalChange = true;
                    controlRelay.bootstrapToggle('off');
                    $(".mn2").fadeOut();
                    const btn = $('#control-send-auto')
                    btn.attr('disabled', true);
                    btn.removeClass('btn-success');
                    btn.addClass('btn-secondary');
                }
            });

        } else {

            Swal.fire({
                title: "⚠️ ต้องการส่งคำสั่ง?",
                html: `<div style="font-size: 16px;">ต้องการปิดไฟอุปกรณ์ <strong>${macAddress}</strong> ใช่หรือไม่?</div>`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก"
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '🔄 กำลังส่งคำสั่ง...',
                        html: `
        <div style="font-size: 16px; color: #555;">
            กำลังส่งคำสั่งปิดไฟอุปกรณ์ <strong>${macAddress}</strong><br>
            กรุณารอสักครู่...
        </div>
    `,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        timerProgressBar: true,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    setTimeout(() => {
                        fetch(endpointoff, options)
                            .then(res => res.json())
                            .then(obj => {
                                // console.log("obj", obj.status);
                                Swal.close();
                                $(".mn2").fadeOut();
                                Swal.fire({
                                    position: "center",
                                    icon: 'success',
                                    title: 'ปิดไฟสำเร็จ',
                                    showConfirmButton: false,
                                    timer: 1500
                                });
                                Swal.fire({
                                    position: "center",
                                    icon: 'success',
                                    title: "สำเร็จ",
                                    html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
  ✅ ปิดไฟอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
</div>`,
                                    showConfirmButton: false,
                                    timer: 1500
                                })
                                $(this).prop('disabled', true);
                                const btn = $('#control-send-auto')
                                btn.attr('disabled', true);
                                btn.removeClass('btn-success');
                                btn.addClass('btn-secondary');
                                setTimeout(() => {
                                    $(this).prop('disabled', false);
                                }, 5000);
                            })
                            .catch(err => {
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: 'error',
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>ปิดไฟไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000
                                });
                            });
                    }, 1000);
                } else {
                    isInternalChange = true;
                    controlRelay.bootstrapToggle('on');
                }
            });
        }
    });

    $('#controlAllRelayState').click(function () {
        const endpoint = "http://85.204.247.82:3002/api/getalldevices"
        const table = $('#alldevice');
        const tableBody = document.querySelector("#alldevice tbody")
        let statarr = []

        tableBody.innerHTML = "";

        Swal.fire({
            title: '🔄 กำลังดึงข้อมูล...',
            html: `
        <div style="font-size: 16px; color: #555;">
            กำลังดึงข้อมูลอุปกรณ์ทั้งหมด<br>
            กรุณารอสักครู่...
        </div>
    `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            }
        });


        setTimeout(() => {
            fetch(endpoint)
                .then(res => res.json())
                .then(obj => {
                    Swal.fire({
                        position: "center",
                        icon: 'success',
                        title: '✅ สำเร็จ!',
                        html: `
        <div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
            ระบบดึงข้อมูลอุปกรณ์ เรียบร้อยแล้ว
        </div>
    `,
                        showConfirmButton: false,
                        timer: 2000
                    });


                    setTimeout(() => {
                        obj.devices.forEach(item => {
                            if (item.relay === "ON") {
                                statarr.push(item.relay)
                            }
                            const row = tableBody.insertRow();
                            row.insertCell().textContent = item.macAddress;
                            row.insertCell().textContent = item.tag;
                            row.insertCell().textContent = item.relay;
                            row.insertCell().textContent = item.pwm_freq;
                            row.insertCell().textContent = item.workmode;
                        });


                        if ($.fn.DataTable.isDataTable(table)) {
                            table.DataTable().clear().destroy();
                        }

                        table.find("tbody").empty();

                        obj.devices.forEach(item => {
                            const row = $("<tr>");
                            row.append(`<td>${item.macAddress}</td>`);
                            row.append(`<td>${item.tag}</td>`);
                            row.append(`<td>${item.relay}</td>`);
                            row.append(`<td>${item.pwm_freq}</td>`);
                            row.append(`<td>${item.workmode}</td>`);
                            table.find("tbody").append(row);
                        });

                        table.DataTable({
                            language: {
                                search: "ค้นหา:",
                                lengthMenu: "แสดง _MENU_ รายการต่อหน้า",
                                zeroRecords: "ไม่พบข้อมูล",
                                info: "แสดง _START_ ถึง _END_ จาก _TOTAL_ รายการ",
                                infoEmpty: "แสดง 0 ถึง 0 จาก 0 รายการ",
                                infoFiltered: "(กรองจากทั้งหมด _MAX_ รายการ)"
                            }
                        });

                        $('#controlAllRelayStateModal').modal('show');

                        if (parseInt(statarr.length) !== parseInt(obj.devices.length)) {
                            const endpointoff = "http://85.204.247.82:3002/api/turnoffalllight"
                            const options = {
                                method: "POST"
                            }
                            setTimeout(() => {
                                fetch(endpointoff, options)
                                    .then(res => res.json())
                                    .then(obj => {
                                        console.log("Turn off all Devices Status: ", obj.status)
                                    })
                                    .catch(err => {
                                        console.error("เกิดข้อผิดพลาด:", err);
                                        Swal.fire({
                                            position: "center",
                                            icon: 'error',
                                            title: "❌ ผิดพลาด!",
                                            html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 ไม่สามารถ <strong>ปิดไฟทุกอุปกรณ์</strong> ได้<br>
            กรุณาติดต่อผู้ดูแลระบบ
        </div>
    `,
                                            showConfirmButton: false,
                                            timer: 2000
                                        });

                                    });
                            }, 1000);
                            firstloadall = true
                            $('#controlAllRelayStatebtn').bootstrapToggle('off')
                            const btn = $('#control-send-all')
                            btn.attr('disabled', true);
                            btn.removeClass('btn-success');
                            btn.addClass('btn-secondary');
                            $(".mn3").fadeOut()
                        } else {
                            firstloadall = true
                            $('#controlAllRelayStatebtn').bootstrapToggle('on')
                            const btn = $('#control-send-all')
                            btn.removeClass('btn-secondary');
                            btn.addClass('btn-success');
                            btn.removeAttr('disabled');
                            $(".mn3").fadeIn()
                        }

                    }, 1500);
                })
                .catch(err => {
                    console.error("เกิดข้อผิดพลาด:", err);
                    Swal.fire({
                        position: "center",
                        icon: 'error',
                        title: "❌ ผิดพลาด!",
                        html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 ไม่สามารถดึงข้อมูลได้ในขณะนี้<br>
            กรุณาติดต่อ <strong>ผู้ดูแลระบบ</strong>
        </div>
    `,
                        showConfirmButton: false,
                        timer: 2000
                    });

                });
        }, 5000);
    });

    $('#controlAllRelayStatebtn').change(function () {
        if (firstloadall) {
            firstloadall = false;
            return;
        }

        if (isInternalChange) {
            isInternalChange = false;
            return;
        }

        const endpointon = "http://85.204.247.82:3002/api/turnonalllight"
        const endpointoff = "http://85.204.247.82:3002/api/turnoffalllight"
        const controlRelay = $("#controlAllRelayStatebtn");
        const options = {
            method: "POST"
        }

        if (!controlRelay.prop('checked')) {

            Swal.fire({
                title: "⚠️ ยืนยันการปิดไฟ?",
                html: `<div style="font-size: 16px;">คุณต้องการ <strong>ปิดไฟทุกอุปกรณ์</strong> ใช่หรือไม่?</div>`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก"
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '🔄 กำลังดำเนินการ...',
                        html: `
        <div style="font-size: 16px; color: #555;">
            กำลังส่งคำสั่ง <strong>ปิดไฟทุกอุปกรณ์</strong><br>
            กรุณารอสักครู่...
        </div>
    `,
                        timerProgressBar: true,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    setTimeout(() => {
                        fetch(endpointoff, options)
                            .then(res => res.json())
                            .then(obj => {
                                console.log("obj", obj.status)
                                if (obj.status === "Success") {
                                    Swal.close();
                                    Swal.fire({
                                        position: "center",
                                        icon: 'success',
                                        title: '✅ สำเร็จ!',
                                        html: `
        <div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
            ปิดไฟให้กับ <strong style="color: #1b5e20;">ทุกอุปกรณ์</strong> เรียบร้อยแล้ว
        </div>
    `,
                                        showConfirmButton: false,
                                        timer: 2000
                                    });

                                    $(this).prop('disabled', true)
                                    const btn = $('#control-send-all')
                                    btn.attr('disabled', true);
                                    btn.removeClass('btn-success');
                                    btn.addClass('btn-secondary');
                                    $(".mn3").fadeOut();
                                    setTimeout(() => {
                                        $(this).prop('disabled', false);
                                    }, 5000);
                                }
                            })
                            .catch(err => {
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: 'error',
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 ไม่สามารถ <strong>ปิดไฟทุกอุปกรณ์</strong> ได้<br>
            กรุณาติดต่อผู้ดูแลระบบ
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000
                                });

                            });
                    }, 3000);
                } else {
                    isInternalChange = true;
                    controlRelay.bootstrapToggle('on');
                    const btn = $('#control-send-all')
                    btn.attr('disabled', true);
                    btn.removeClass('btn-success');
                    btn.addClass('btn-secondary');
                }
            })
        } else {
            Swal.fire({
                title: "⚠️ ต้องการส่งคำสั่ง?",
                html: `<div style="font-size: 16px;">คุณต้องการ <strong>เปิดไฟทุกอุปกรณ์</strong> ใช่หรือไม่?</div>`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก"
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: '🔄 กำลังดำเนินการ...',
                        html: `
        <div style="font-size: 16px; color: #555;">
            กำลังส่งคำสั่ง <strong>ปิดไฟทุกอุปกรณ์</strong><br>
            กรุณารอสักครู่...
        </div>
    `,
                        timerProgressBar: true,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    setTimeout(() => {
                        fetch(endpointon, options)
                            .then(res => res.json())
                            .then(obj => {
                                if (obj.status === "Success") {
                                    Swal.close();
                                    Swal.fire({
                                        position: "center",
                                        icon: 'success',
                                        title: '✅ สำเร็จ!',
                                        html: `
        <div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
            เปิดไฟให้กับ <strong>ทุกอุปกรณ์</strong> เรียบร้อยแล้ว
        </div>
    `,
                                        showConfirmButton: false,
                                        timer: 2000
                                    });

                                    $(this).prop('disabled', true)
                                    const btn = $('#control-send-all')
                                    btn.attr('disabled', false);
                                    btn.removeClass('btn-secondary');
                                    btn.addClass('btn-success');
                                    $(".mn3").fadeIn();
                                    setTimeout(() => {
                                        $(this).prop('disabled', false);
                                    }, 5000);

                                }
                            })
                            .catch(err => {
                                console.error("เกิดข้อผิดพลาด:", err);
                                Swal.fire({
                                    position: "center",
                                    icon: 'error',
                                    title: "❌ ผิดพลาด!",
                                    html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 ไม่สามารถ <strong>เปิดไฟ</strong> ให้กับทุกอุปกรณ์ได้<br>
            กรุณาติดต่อผู้ดูแลระบบ
        </div>
    `,
                                    showConfirmButton: false,
                                    timer: 2000
                                });

                            });
                    }, 3000);
                } else {
                    isInternalChange = true;
                    controlRelay.bootstrapToggle('off');
                    $(".mn3").fadeOut();
                    const btn = $('#control-send-all')
                    btn.attr('disabled', true);
                    btn.removeClass('btn-success');
                    btn.addClass('btn-secondary');
                }
            })
        }
    })

    $('#control-send-manual').click(function () {
        const macAddress = $('#controlLampSerialNo').val()
        const endpoint = "http://85.204.247.82:3002/api/turnonlightval"
        const warmVal = $('#controlRangeWarm').val()
        const coolVal = $('#controlRangeCool').val()
        const datas = {
            macAddress,
            warmVal,
            coolVal
        }
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(datas)
        }

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
                Swal.showLoading();
            }
        });

        setTimeout(() => {
            fetch(endpoint, options)
                .then(resp => resp.json())
                .then(obj => {
                    getLampData($("#controllerCode option:selected").val(), $("#bottomPagination").twbsPagination("getCurrentPage"), $("#lampTextSearch").val());
                    Swal.fire({
                        position: "center",
                        icon: 'success',
                        title: "สำเร็จ",
                        html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
  ✅ ส่งคำสั่งอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
</div>`,
                        showConfirmButton: false,
                        timer: 1500
                    })
                    // setTimeout(() => {
                    //     $('#controlInfoModal').modal('hide')
                    // }, 1500);
                    $(this).prop('disabled', true);
                    setTimeout(() => {
                        $(this).prop('disabled', false);
                    }, 6000);
                })
                .catch(err => {
                    console.error("เกิดข้อผิดพลาด:", err);
                    Swal.fire({
                        position: "center",
                        icon: 'error',
                        title: "❌ ผิดพลาด!",
                        html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>ส่งคำสั่งไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                        showConfirmButton: false,
                        timer: 1500
                    });
                    $('#controlInfoModal').modal('hide')
                })
        }, 1000)
    })


    $('#control-send-auto').click(async function () {
        const macAddress = $('#controlLampSerialNo').val();
        const endpoint = "http://85.204.247.82:3002/api/setschedule";
        let datasarr = [];

        for (let i = 1; i <= 5; i++) {
            const no = $(`#schedule_${i}_no`).val();
            const start = $(`#schedule_${i}_start`).val();
            const end = $(`#schedule_${i}_end`).val();
            if (no && start && end) {
                datasarr.push({
                    macAddress: macAddress,
                    no: no,
                    starttime: start,
                    endtime: end,
                    warmval: $(`#schedule_${i}_controlRangeWarm`).val(),
                    coolval: $(`#schedule_${i}_controlRangeCool`).val()
                });
            }
        }

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(datasarr)
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
                Swal.showLoading();
            }
        });

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const resp = await fetch(endpoint, options);
            const obj = await resp.json();

            Swal.fire({
                position: "center",
                icon: 'success',
                title: "สำเร็จ",
                html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
  ✅ ส่งคำสั่งสำเร็จ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
</div>`,
                showConfirmButton: false,
                timer: 1500
            })
            // setTimeout(() => {
            //     $('#controlInfoModal').modal('hide')
            // }, 1500);
            $(this).prop('disabled', true);
            setTimeout(() => {
                $(this).prop('disabled', false);
            }, 7000);

        } catch (err) {
            console.error("เกิดข้อผิดพลาด:", err);
            Swal.fire({
                position: "center",
                icon: 'error',
                title: "❌ ผิดพลาด!",
                html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>ส่งคำสั่งไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
        </div>
    `,
                showConfirmButton: false,
                timer: 1500
            });
        }
    });

    $('#control-send-all').click(function () {
        const endpoint = "http://85.204.247.82:3002/api/turnonalllightval"
        const warmVal = $('#controlAllRangeWarm').val()
        const coolVal = $('#controlAllRangeCool').val()
        const datas = {
            warmVal,
            coolVal
        }
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(datas)
        }

        Swal.fire({
            title: '<span>🔄 กำลังดำเนินการ...</span>',
            html: `
        <div style="font-size: 16px; color: #555;">
            กำลังส่งคำสั่งทุกอุปกรณ์<br>
            กรุณารอสักครู่...
        </div>
    `,
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        setTimeout(() => {
            fetch(endpoint, options)
                .then(resp => resp.json())
                .then(obj => {
                    Swal.fire({
                        position: "center",
                        icon: 'success',
                        title: '✅ สำเร็จ!',
                        html: `
        <div style="font-size: 16px; color: #2e7d32;">
            ส่งคำสั่งไปยังทุกอุปกรณ์ <strong>สำเร็จ</strong>
        </div>
    `,
                        showConfirmButton: false,
                        timer: 2000
                    });

                    setTimeout(() => {
                        // $('#controlAllRelayStateModal').modal('hide')
                    }, 1500);
                    $(this).prop('disabled', true);
                    setTimeout(() => {
                        $(this).prop('disabled', false);
                    }, 6000);
                })
                .catch(err => {
                    console.error("เกิดข้อผิดพลาด:", err);
                    Swal.fire({
                        position: "center",
                        icon: 'error',
                        title: "❌ ผิดพลาด!",
                        html: `
        <div style="font-size: 16px; color: #b71c1c;">
            🚫 <strong>ส่งคำสั่งไปยังทุกอุปกรณ์ไม่สำเร็จ</strong><br>
            โปรดลองใหม่อีกครั้งในภายหลัง
        </div>
    `,
                        showConfirmButton: false,
                        timer: 2000
                    });

                    $('#controlAllRelayStateModal').modal('hide')
                })
        }, 5000)
    })

    const toggleStatus = (relay) => {
        const controlRelay = $("#controlRelayState");
        controlRelay.val(relay)
        if (relay === "OFF") {
            const btn = $('#control-send-manual')
            btn.attr('disabled', true);
            btn.removeClass('btn-success');
            btn.addClass('btn-secondary');
            $(".mn").fadeOut();
            controlRelay.bootstrapToggle('off');
            $("#controlActionManual").fadeOut();
        } else if (relay === "ON") {
            const btn = $('#control-send-manual')
            btn.removeClass('btn-secondary');
            btn.addClass('btn-success');
            btn.removeAttr('disabled');
            $(".mn").fadeIn();
            controlRelay.bootstrapToggle('on');
        }
    }

    const toggleStatus2 = (relay) => {
        const controlRelay = $("#controlRelayState2");
        controlRelay.val(relay)
        if (relay === "OFF") {
            const btn = $('#control-send-auto')
            btn.attr('disabled', true);
            btn.removeClass('btn-success');
            btn.addClass('btn-secondary');
            $(".mn2").fadeOut();
            controlRelay.bootstrapToggle('off');
            $("#controlActionManual").fadeOut();
        } else if (relay === "ON") {
            const btn = $('#control-send-auto')
            btn.removeClass('btn-secondary');
            btn.addClass('btn-success');
            btn.removeAttr('disabled');
            $(".mn2").fadeIn();
            controlRelay.bootstrapToggle('on');
        }
    }

    const bulb = $('#bulbIcon');
    const bulb2 = $('#bulbIcon2');
    const bulbIconmanual = $('#bulbIconmanual');
    const toggle = $('#controlRelayState');
    const toggle2 = $('#controlRelayState2');
    const toggle3 = $('#controlAllRelayStatebtn');

    function updateBulbStatus(isOn) {
        if (isOn) {
            bulb.removeClass('light-off');
            bulb.addClass('light-on');
            bulb2.removeClass('light-off');
            bulb2.addClass('light-on');
            bulbIconmanual.removeClass('light-off');
            bulbIconmanual.addClass('light-on');
        } else {
            bulb.removeClass('light-on');
            bulb.addClass('light-off');
            bulb2.removeClass('light-on');
            bulb2.addClass('light-off');
            bulbIconmanual.removeClass('light-on');
            bulbIconmanual.addClass('light-off');
        }
    }

    toggle.on('change', function () {
        updateBulbStatus(this.checked);
    });

    toggle2.on('change', function () {
        updateBulbStatus(this.checked);
    });

    toggle3.on('change', function () {
        updateBulbStatus(this.checked);
    });

    updateBulbStatus(toggle.checked);
    updateBulbStatus(toggle2.checked);
    updateBulbStatus(toggle3.checked);

    const toggles = $('#controlRelayState');
    const wrapper = $('.light-status-wrapper');
    const transbox = $('#transbox')
    const subtransbox = $('#subtransbox')

    toggles.change(function () {
        console.log('test')
        if (toggles.prop('checked')) {
            wrapper.addClass('shift-left'); // เมื่อเปิด -> ชิดซ้าย
            transbox.removeClass('justify-content-center')
            subtransbox.removeClass('col-md-12')
            subtransbox.addClass('col-md-3')
        } else {
            wrapper.removeClass('shift-left'); // เมื่อปิด -> กลับมาตรงกลาง
            transbox.addClass('justify-content-center')
            subtransbox.addClass('col-md-12')
            subtransbox.removeClass('col-md-3')
        }
    });

    $('#controllerCode').on('change', function () {
        const alldevicesbtn = $('#controlAllRelayState')
        let value = $(this).val();
        let text = $(this).find('option:selected').text();
        if (value !== 'CTL25-00002') {
            alldevicesbtn.addClass('d-none')
            alldevicesbtn.removeClass('d-flex')
        } else {
            alldevicesbtn.fadeIn()
            alldevicesbtn.addClass('d-flex')
        }
    });

    const getLampOnClick = async () => {
        const ctrlcode = $('#controllerCode option:selected').val()
        const paging = $("#bottomPagination").twbsPagination("getCurrentPage")
        const textsearch = $("#lampTextSearch").val()
        getLampData(ctrlcode, paging, textsearch);
    }

    $('.md-close').on('click', getLampOnClick);

    const deleteDevices = async (mac) => {
        const endpoint = "http://85.204.247.82:3002/api/deletedevices"
        const datas = {
            macAddress: mac
        }
        const options = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(datas)
        }

        try {
            fetch(endpoint, options)
                .then(resp => resp.json())
                .then(result => {
                    console.log(result?.status) //Devices F412FA49E9B9 is Delete
                })
        } catch (err) {
            console.error("Error", err)
        }
    }

})