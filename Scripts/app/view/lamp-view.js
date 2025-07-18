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

        //     Swal.fire({
        //         title: '🔄 กำลังดึงข้อมูล...',
        //         html: `
        //     <div style="font-size: 16px; color: #555;">
        //         กำลังดึงข้อมูลอุปกรณ์ <strong>${macaddress}</strong><br>
        //         กรุณารอสักครู่...
        //     </div>
        // `,
        //         allowOutsideClick: false,
        //         allowEscapeKey: false,
        //         showConfirmButton: false,
        //         timerProgressBar: true,
        //         didOpen: () => {
        //             Swal.showLoading();
        //         }
        //     });

        // setTimeout(() => {
        fetch(endpoint, options)
            .then(res => {
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
            }).then(result => {
                let obj = result

                clearControlModalInput();
                bindControlPanelViewModelToModal(obj);

                // setTimeout(() => {
                $("#controlInfoModal").modal("show");
                // }, 1500);

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
        // }, 1000)
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
            $('#control-send-schedule').addClass('d-none')
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

            $('#control-send-schedule').removeClass('d-none')
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

        //allcontrol
        // $("#scheduleall_1_start").val("00:00");
        // $("#scheduleall_1_end").val("00:00");
        // $("#scheduleall_1_duration_h").val("0");
        // $("#scheduleall_1_duration_m").val("0");
        // $("#scheduleall_1_rangeWarm").text("0");
        // $("#scheduleall_1_controlRangeWarm").val("0");
        // $("#scheduleall_1_rangeCool").text("0");
        // $("#scheduleall_1_controlRangeCool").val("0");

        // $("#scheduleall_2_start").val("00:00");
        // $("#scheduleall_2_end").val("00:00");
        // $("#scheduleall_2_duration_h").val("0");
        // $("#scheduleall_2_duration_m").val("0");
        // $("#scheduleall_2_rangeWarm").text("0");
        // $("#scheduleall_2_controlRangeWarm").val("0");
        // $("#scheduleall_2_rangeCool").text("0");
        // $("#scheduleall_2_controlRangeCool").val("0");

        // $("#scheduleall_3_start").val("00:00");
        // $("#scheduleall_3_end").val("00:00");
        // $("#scheduleall_3_duration_h").val("0");
        // $("#scheduleall_3_duration_m").val("0");
        // $("#scheduleall_3_rangeWarm").text("0");
        // $("#scheduleall_3_controlRangeWarm").val("0");
        // $("#scheduleall_3_rangeCool").text("0");
        // $("#scheduleall_3_controlRangeCool").val("0");

        // $("#scheduleall_4_start").val("00:00");
        // $("#scheduleall_4_end").val("00:00");
        // $("#scheduleall_4_duration_h").val("0");
        // $("#scheduleall_4_duration_m").val("0");
        // $("#scheduleall_4_rangeWarm").text("0");
        // $("#scheduleall_4_controlRangeWarm").val("0");
        // $("#scheduleall_4_rangeCool").text("0");
        // $("#scheduleall_4_controlRangeCool").val("0");

        // $("#scheduleall_5_start").val("00:00");
        // $("#scheduleall_5_end").val("00:00");
        // $("#scheduleall_5_duration_h").val("0");
        // $("#scheduleall_5_duration_m").val("0");
        // $("#scheduleall_5_rangeWarm").text("0");
        // $("#scheduleall_5_controlRangeWarm").val("0");
        // $("#scheduleall_5_rangeCool").text("0");
        // $("#scheduleall_5_controlRangeCool").val("0");
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
        const transbox = $('#transbox')
        const subtransbox = $('#subtransbox')
        const btnswitchmanual = $('#controlRelayState')
        const btnswitchauto = $('#controlRelayState2')
        let mode = $(this).val();
        // $('.mn').fadeOut()
        // $('.mn2').fadeOut()

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
                    }, 500)

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
                            $('#control-send-schedule').addClass('d-none')
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
                    }, 500)
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
                            // if (!btnswitchauto.prop('checked')) {
                            //     $('.mn2').fadeOut()
                            // }
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
                            $('#control-send-schedule').removeClass('d-none')
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
                    }, 500)
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

    //     $('#controlRelayState').on('change', function () {
    //         if (firstloadmanual) {
    //             firstloadmanual = false;
    //             return;
    //         }

    //         if (isInternalChange) {
    //             isInternalChange = false;
    //             return;
    //         }

    //         const controlRelay = $("#controlRelayState");
    //         const macAddress = $('#controlLampSerialNo').val()
    //         const endpointon = "http://85.204.247.82:3002/api/turnonlight"
    //         const endpointoff = "http://85.204.247.82:3002/api/turnofflight"
    //         const transbox = $('#transbox')
    //         const subtransbox = $('#subtransbox')
    //         const datas = {
    //             macAddress,
    //         }
    //         const options = {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json; charset=utf-8"
    //             },
    //             body: JSON.stringify(datas)
    //         }

    //         if ($(this).is(":checked")) {
    //             Swal.fire({
    //                 title: "⚠️ ต้องการส่งคำสั่ง?",
    //                 html: `<div style="font-size: 16px;">ต้องการเปิดไฟอุปกรณ์ <strong>${macAddress}</strong> ใช่หรือไม่?</div>`,
    //                 icon: "warning",
    //                 showCancelButton: true,
    //                 confirmButtonColor: "#3085d6",
    //                 cancelButtonColor: "#d33",
    //                 confirmButtonText: "ตกลง",
    //                 cancelButtonText: "ยกเลิก"
    //             }).then((result) => {
    //                 if (result.isConfirmed) {
    //                     Swal.fire({
    //                         title: '🔄 กำลังส่งคำสั่ง...',
    //                         html: `
    //         <div style="font-size: 16px; color: #555;">
    //             กำลังส่งคำสั่งเปิดไฟอุปกรณ์ <strong>${macAddress}</strong><br>
    //             กรุณารอสักครู่...
    //         </div>
    //     `,
    //                         allowOutsideClick: false,
    //                         allowEscapeKey: false,
    //                         showConfirmButton: false,
    //                         timerProgressBar: true,
    //                         didOpen: () => {
    //                             Swal.showLoading();
    //                         }
    //                     });

    //                     setTimeout(() => {
    //                         fetch(endpointon, options)
    //                             .then(res => res.json())
    //                             .then(obj => {
    //                                 Swal.close();
    //                                 subtransbox.addClass('move-left')
    //                                 transbox.removeClass('justify-content-center')
    //                                 subtransbox.removeClass('col-md-12')
    //                                 subtransbox.addClass('col-md-3')
    //                                 $(".mn").fadeIn();
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'success',
    //                                     title: "สำเร็จ",
    //                                     html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
    //   ✅ เปิดไฟอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
    // </div>`,
    //                                     showConfirmButton: false,
    //                                     timer: 1500
    //                                 })
    //                                 $(this).prop('disabled', true);
    //                                 const btn = $('#control-send-manual')
    //                                 btn.removeAttr('disabled');
    //                                 btn.removeClass('btn-secondary');
    //                                 btn.addClass('btn-success');
    //                                 setTimeout(() => {
    //                                     $(this).prop('disabled', false);
    //                                 }, 5000);
    //                             })
    //                             .catch(err => {
    //                                 console.error("เกิดข้อผิดพลาด:", err);
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'error',
    //                                     title: "❌ ผิดพลาด!",
    //                                     html: `
    //         <div style="font-size: 16px; color: #b71c1c;">
    //             🚫 <strong>เปิดไฟไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
    //         </div>
    //     `,
    //                                     showConfirmButton: false,
    //                                     timer: 2000
    //                                 })
    //                             });
    //                     }, 1000);
    //                 } else {
    //                     isInternalChange = true;
    //                     controlRelay.bootstrapToggle('off');
    //                     subtransbox.removeClass('move-left')
    //                     transbox.addClass('justify-content-center')
    //                     subtransbox.addClass('col-md-12')
    //                     subtransbox.removeClass('col-md-3')
    //                     $(".mn").fadeOut();
    //                     const btn = $('#control-send-manual')
    //                     btn.attr('disabled', true);
    //                     btn.removeClass('btn-success');
    //                     btn.addClass('btn-secondary');
    //                 }
    //             });

    //         } else {
    //             Swal.fire({
    //                 title: "⚠️ ต้องการส่งคำสั่ง?",
    //                 html: `<div style="font-size: 16px;">ต้องการปิดไฟอุปกรณ์ <strong>${macAddress}</strong> ใช่หรือไม่?</div>`,
    //                 icon: "warning",
    //                 showCancelButton: true,
    //                 confirmButtonColor: "#3085d6",
    //                 cancelButtonColor: "#d33",
    //                 confirmButtonText: "ตกลง",
    //                 cancelButtonText: "ยกเลิก"
    //             }).then((result) => {
    //                 if (result.isConfirmed) {
    //                     Swal.fire({
    //                         title: '🔄 กำลังส่งคำสั่ง...',
    //                         html: `
    //         <div style="font-size: 16px; color: #555;">
    //             กำลังส่งคำสั่งปิดไฟอุปกรณ์ <strong>${macAddress}</strong><br>
    //             กรุณารอสักครู่...
    //         </div>
    //     `,
    //                         allowOutsideClick: false,
    //                         allowEscapeKey: false,
    //                         showConfirmButton: false,
    //                         timerProgressBar: true,
    //                         didOpen: () => {
    //                             Swal.showLoading();
    //                         }
    //                     });
    //                     setTimeout(() => {
    //                         fetch(endpointoff, options)
    //                             .then(res => res.json())
    //                             .then(obj => {
    //                                 Swal.close();
    //                                 subtransbox.removeClass('move-left')
    //                                 transbox.addClass('justify-content-center')
    //                                 $(".mn").fadeOut();
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'success',
    //                                     title: "สำเร็จ",
    //                                     html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
    //   ✅ ปิดไฟอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
    // </div>`,
    //                                     showConfirmButton: false,
    //                                     timer: 1500
    //                                 })
    //                                 $(this).prop('disabled', true);
    //                                 const btn = $('#control-send-manual')
    //                                 btn.attr('disabled', true);
    //                                 btn.removeClass('btn-success');
    //                                 btn.addClass('btn-secondary');
    //                                 subtransbox.removeClass('col-md-3')
    //                                 subtransbox.addClass('col-md-12')
    //                                 setTimeout(() => {
    //                                     $(this).prop('disabled', false);
    //                                 }, 3000);
    //                             })
    //                             .catch(err => {
    //                                 console.error("เกิดข้อผิดพลาด:", err);
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'error',
    //                                     title: "❌ ผิดพลาด!",
    //                                     html: `
    //         <div style="font-size: 16px; color: #b71c1c;">
    //             🚫 <strong>ปิดไฟไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
    //         </div>
    //     `,
    //                                     showConfirmButton: false,
    //                                     timer: 2000
    //                                 })
    //                             });
    //                     }, 1000);
    //                 } else {
    //                     isInternalChange = true;
    //                     controlRelay.bootstrapToggle('on');
    //                 }
    //             });
    //         }
    //     });

    //     $('#controlRelayState2').on('change', function () {
    //         if (firstloadauto) {
    //             firstloadauto = false;
    //             return;
    //         }

    //         if (isInternalChange) {
    //             isInternalChange = false;
    //             return;
    //         }

    //         const controlRelay = $("#controlRelayState2");
    //         const macAddress = $('#controlLampSerialNo').val()
    //         const endpointon = "http://85.204.247.82:3002/api/turnonlight"
    //         const endpointoff = "http://85.204.247.82:3002/api/turnofflight"
    //         const datas = {
    //             macAddress
    //         }
    //         const options = {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json; charset=utf-8"
    //             },
    //             body: JSON.stringify(datas)
    //         }

    //         if ($(this).is(":checked")) {

    //             Swal.fire({
    //                 title: "⚠️ ต้องการส่งคำสั่ง?",
    //                 html: `<div style="font-size: 16px;">ต้องการเปิดไฟอุปกรณ์ <strong>${macAddress}</strong> ใช่หรือไม่?</div>`,
    //                 icon: "warning",
    //                 showCancelButton: true,
    //                 confirmButtonColor: "#3085d6",
    //                 cancelButtonColor: "#d33",
    //                 confirmButtonText: "ตกลง",
    //                 cancelButtonText: "ยกเลิก"
    //             }).then((result) => {
    //                 if (result.isConfirmed) {
    //                     Swal.fire({
    //                         title: '🔄 กำลังส่งคำสั่ง...',
    //                         html: `
    //         <div style="font-size: 16px; color: #555;">
    //             กำลังส่งคำสั่งเปิดไฟอุปกรณ์ <strong>${macAddress}</strong><br>
    //             กรุณารอสักครู่...
    //         </div>
    //     `,
    //                         allowOutsideClick: false,
    //                         allowEscapeKey: false,
    //                         showConfirmButton: false,
    //                         timerProgressBar: true,
    //                         didOpen: () => {
    //                             Swal.showLoading();
    //                         }
    //                     });
    //                     setTimeout(() => {
    //                         fetch(endpointon, options)
    //                             .then(res => res.json())
    //                             .then(obj => {
    //                                 // console.log("obj", obj.status);
    //                                 Swal.close();
    //                                 $(".mn2").fadeIn();
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'success',
    //                                     title: "สำเร็จ",
    //                                     html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
    //   ✅ เปิดไฟอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
    // </div>`,
    //                                     showConfirmButton: false,
    //                                     timer: 1500
    //                                 })
    //                                 $(this).prop('disabled', true);
    //                                 const btn = $('#control-send-schedule')
    //                                 btn.removeAttr('disabled');
    //                                 btn.removeClass('btn-secondary');
    //                                 btn.addClass('btn-success');
    //                                 setTimeout(() => {
    //                                     $(this).prop('disabled', false);
    //                                 }, 5000);
    //                             })
    //                             .catch(err => {
    //                                 console.error("เกิดข้อผิดพลาด:", err);
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'error',
    //                                     title: "❌ ผิดพลาด!",
    //                                     html: `
    //         <div style="font-size: 16px; color: #b71c1c;">
    //             🚫 <strong>เปิดไฟไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
    //         </div>
    //     `,
    //                                     showConfirmButton: false,
    //                                     timer: 2000
    //                                 })
    //                             });
    //                     }, 1000);
    //                     // showControlModal()
    //                 } else {
    //                     isInternalChange = true;
    //                     controlRelay.bootstrapToggle('off');
    //                     $(".mn2").fadeOut();
    //                     const btn = $('#control-send-schedule')
    //                     btn.attr('disabled', true);
    //                     btn.removeClass('btn-success');
    //                     btn.addClass('btn-secondary');
    //                 }
    //             });

    //         } else {

    //             Swal.fire({
    //                 title: "⚠️ ต้องการส่งคำสั่ง?",
    //                 html: `<div style="font-size: 16px;">ต้องการปิดไฟอุปกรณ์ <strong>${macAddress}</strong> ใช่หรือไม่?</div>`,
    //                 icon: "warning",
    //                 showCancelButton: true,
    //                 confirmButtonColor: "#3085d6",
    //                 cancelButtonColor: "#d33",
    //                 confirmButtonText: "ตกลง",
    //                 cancelButtonText: "ยกเลิก"
    //             }).then((result) => {
    //                 if (result.isConfirmed) {
    //                     Swal.fire({
    //                         title: '🔄 กำลังส่งคำสั่ง...',
    //                         html: `
    //         <div style="font-size: 16px; color: #555;">
    //             กำลังส่งคำสั่งปิดไฟอุปกรณ์ <strong>${macAddress}</strong><br>
    //             กรุณารอสักครู่...
    //         </div>
    //     `,
    //                         allowOutsideClick: false,
    //                         allowEscapeKey: false,
    //                         showConfirmButton: false,
    //                         timerProgressBar: true,
    //                         didOpen: () => {
    //                             Swal.showLoading();
    //                         }
    //                     });
    //                     setTimeout(() => {
    //                         fetch(endpointoff, options)
    //                             .then(res => res.json())
    //                             .then(obj => {
    //                                 // console.log("obj", obj.status);
    //                                 Swal.close();
    //                                 $(".mn2").fadeOut();
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'success',
    //                                     title: 'ปิดไฟสำเร็จ',
    //                                     showConfirmButton: false,
    //                                     timer: 1500
    //                                 });
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'success',
    //                                     title: "สำเร็จ",
    //                                     html: `<div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
    //   ✅ ปิดไฟอุปกรณ์ <strong style="color: #1b5e20;">${macAddress}</strong> สำเร็จ
    // </div>`,
    //                                     showConfirmButton: false,
    //                                     timer: 1500
    //                                 })
    //                                 $(this).prop('disabled', true);
    //                                 const btn = $('#control-send-schedule')
    //                                 btn.attr('disabled', true);
    //                                 btn.removeClass('btn-success');
    //                                 btn.addClass('btn-secondary');
    //                                 setTimeout(() => {
    //                                     $(this).prop('disabled', false);
    //                                 }, 5000);
    //                             })
    //                             .catch(err => {
    //                                 console.error("เกิดข้อผิดพลาด:", err);
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'error',
    //                                     title: "❌ ผิดพลาด!",
    //                                     html: `
    //         <div style="font-size: 16px; color: #b71c1c;">
    //             🚫 <strong>ปิดไฟไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
    //         </div>
    //     `,
    //                                     showConfirmButton: false,
    //                                     timer: 2000
    //                                 });
    //                             });
    //                     }, 1000);
    //                 } else {
    //                     isInternalChange = true;
    //                     controlRelay.bootstrapToggle('on');
    //                 }
    //             });
    //         }
    //     });

    $('#controlAllRelayState').click(function () {
        const groupval = $('#groupDevices').val()
        const endpoint = `http://85.204.247.82:3002/api/getgroupdevices/${groupval}`
        const endpointAllDevices = `http://85.204.247.82:3002/api/getalldevices`
        const table = $('#alldevice');
        const tableBody = document.querySelector("#alldevice tbody")
        const transbox = $('#tb')
        const subtransbox = $('#stb')
        const groupselect = $('#groupSelect')
        const options = {
            method: "GET"
        }

        tableBody.innerHTML = ""

        clearControlModalInput()
        //     Swal.fire({
        //         title: '🔄 กำลังดึงข้อมูล...',
        //         html: `
        //     <div style="font-size: 16px; color: #555;">
        //         กำลังดึงข้อมูลอุปกรณ์ทั้งหมด<br>
        //         กรุณารอสักครู่...
        //     </div>
        // `,
        //         allowOutsideClick: false,
        //         allowEscapeKey: false,
        //         showConfirmButton: false,
        //         timerProgressBar: true,
        //         didOpen: () => {
        //             Swal.showLoading();
        //         }
        //     });


        // setTimeout(() => {
        fetch(endpoint, options)
            .then(res => res.json())
            .then(obj => {
                //                 Swal.fire({
                //                     position: "center",
                //                     icon: 'success',
                //                     title: '✅ สำเร็จ!',
                //                     html: `
                //     <div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
                //         ระบบดึงข้อมูลอุปกรณ์ เรียบร้อยแล้ว
                //     </div>
                // `,
                //                     showConfirmButton: false,
                //                     timer: 2000
                //                 });


                // setTimeout(() => {
                obj.groupdevices.forEach(item => {
                    const row = tableBody.insertRow();
                    row.insertCell().textContent = item?.macAddress;
                    row.insertCell().textContent = item?.tag;
                    row.insertCell().textContent = item?.relay;
                    row.insertCell().textContent = item?.pwm_freq;
                    row.insertCell().textContent = item?.mid;
                    row.insertCell().textContent = item?.workmode;
                });


                if ($.fn.DataTable.isDataTable(table)) {
                    table.DataTable().clear().destroy();
                }

                table.removeClass("animate__fadeOut").addClass("animate__animated animate__fadeIn");
                table.find("tbody").empty();


                obj.groupdevices.forEach(item => {
                    const row = $("<tr>");
                    row.append(`<td>${item?.macAddress}</td>`)
                    row.append(`<td>${item?.tag}</td>`)
                    row.append(`<td>${item?.relay}</td>`)
                    row.append(`<td>${item?.pwm_freq}</td>`)
                    row.append(`<td>${item?.mid}</td>`)
                    row.append(`<td>${item?.workmode}</td>`)
                    table.find("tbody").append(row)
                });

                table.DataTable({
                    language: {
                        search: "ค้นหา:",
                        lengthMenu: "แสดง _MENU_ รายการต่อหน้า",
                        zeroRecords: "ไม่พบข้อมูล",
                        info: "แสดง _START_ ถึง _END_ จาก _TOTAL_ รายการ",
                        infoEmpty: "แสดง 0 ถึง 0 จาก 0 รายการ",
                        infoFiltered: "(กรองจากทั้งหมด _MAX_ รายการ)"
                    },
                    initComplete: function () {
                        addDropdown().then(async () => {
                            const groupselect = $('#groupSelect');
                            const getGroup = await fetch(endpointAllDevices);
                            const result = await getGroup.json();

                            const mids = [...new Set(result.devices.map(item => item.mid))];

                            mids.forEach(mid => {
                                let group = $(`<option value="${mid}">กลุ่ม ${mid}</option>`);
                                group.appendTo(groupselect);
                            })

                            groupselect.selectpicker('refresh')
                            groupselect.val(groupval)
                            groupselect.selectpicker('render')
                        })

                    }
                })

                $('#controlAllRelayStateModal').modal('show');

                // if (parseInt(statarr.length) !== parseInt(obj.groupdevices.length)) {
                //     const endpointoff = "http://85.204.247.82:3002/api/turnoffalllight"
                //     const options = {
                //         method: "POST"
                //     }
                //     // setTimeout(() => {
                //     //                 fetch(endpointoff, options)
                //     //                     .then(res => res.json())
                //     //                     .then(obj => {
                //     //                         console.log("Turn off all Devices Status: ", obj.status)
                //     //                     })
                //     //                     .catch(err => {
                //     //                         console.error("เกิดข้อผิดพลาด:", err);
                //     //                         Swal.fire({
                //     //                             position: "center",
                //     //                             icon: 'error',
                //     //                             title: "❌ ผิดพลาด!",
                //     //                             html: `
                //     //     <div style="font-size: 16px; color: #b71c1c;">
                //     //         🚫 ไม่สามารถ <strong>ปิดไฟทุกอุปกรณ์</strong> ได้<br>
                //     //         กรุณาติดต่อผู้ดูแลระบบ
                //     //     </div>
                //     // `,
                //     //                             showConfirmButton: false,
                //     //                             timer: 2000
                //     //                         })

                //     //                     })
                //     // }, 1000)
                //     firstloadall = true
                //     $('#controlAllRelayStatebtn').bootstrapToggle('off')
                //     const btn = $('#control-send-all')

                //     // subtransbox.removeClass('move-left')
                //     // transbox.addClass('justify-content-center')
                //     // subtransbox.addClass('col-md-12')
                //     // subtransbox.removeClass('col-md-3')
                //     // btn.attr('disabled', true);
                //     // btn.removeClass('btn-success');
                //     // btn.addClass('btn-secondary');
                //     // $(".mn3").fadeOut()
                // } else {
                //     firstloadall = true
                //     $('#controlAllRelayStatebtn').bootstrapToggle('on')
                //     const btn = $('#control-send-all')

                //     // subtransbox.addClass('move-left')
                //     // transbox.removeClass('justify-content-center')
                //     // subtransbox.removeClass('col-md-12')
                //     // subtransbox.addClass('col-md-3')
                //     btn.removeClass('btn-secondary');
                //     btn.addClass('btn-success');
                //     btn.removeAttr('disabled');
                //     $(".mn3").fadeIn()
                // }

                // }, 1500);
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
        // }, 500);
    });

    // $('#controlAllRelayStatebtn').change(function () {
    //     if (firstloadall) {
    //         firstloadall = false;
    //         return;
    //     }

    //     if (isInternalChange) {
    //         isInternalChange = false;
    //         return;
    //     }

    //     const endpointon = "http://85.204.247.82:3002/api/turnonalllight"
    //     const endpointoff = "http://85.204.247.82:3002/api/turnoffalllight"
    //     const controlRelay = $("#controlAllRelayStatebtn");
    //     const transbox = $('#tb')
    //     const subtransbox = $('#stb')
    //     const options = {
    //         method: "POST"
    //     }

    //     if (!controlRelay.prop('checked')) {

    //         Swal.fire({
    //             title: "⚠️ ยืนยันการปิดไฟ?",
    //             html: `<div style="font-size: 16px;">คุณต้องการ <strong>ปิดไฟทุกอุปกรณ์</strong> ใช่หรือไม่?</div>`,
    //             icon: "warning",
    //             showCancelButton: true,
    //             confirmButtonColor: "#3085d6",
    //             cancelButtonColor: "#d33",
    //             confirmButtonText: "ตกลง",
    //             cancelButtonText: "ยกเลิก"
    //         }).then((result) => {
    //             if (result.isConfirmed) {
    //                 Swal.fire({
    //                     title: '🔄 กำลังดำเนินการ...',
    //                     html: `
    //     <div style="font-size: 16px; color: #555;">
    //         กำลังส่งคำสั่ง <strong>ปิดไฟทุกอุปกรณ์</strong><br>
    //         กรุณารอสักครู่...
    //     </div>
    // `,
    //                     timerProgressBar: true,
    //                     allowOutsideClick: false,
    //                     allowEscapeKey: false,
    //                     showConfirmButton: false,
    //                     didOpen: () => {
    //                         Swal.showLoading();
    //                     }
    //                 });

    //                 setTimeout(() => {
    //                     fetch(endpointoff, options)
    //                         .then(res => res.json())
    //                         .then(obj => {
    //                             console.log("obj", obj.status)
    //                             if (obj.status === "Success") {
    //                                 Swal.close();
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'success',
    //                                     title: '✅ สำเร็จ!',
    //                                     html: `
    //     <div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
    //         ปิดไฟให้กับ <strong style="color: #1b5e20;">ทุกอุปกรณ์</strong> เรียบร้อยแล้ว
    //     </div>
    // `,
    //                                     showConfirmButton: false,
    //                                     timer: 2000
    //                                 });

    //                                 $(this).prop('disabled', true)
    //                                 const btn = $('#control-send-all')

    //                                 // btn.attr('disabled', true);
    //                                 // btn.removeClass('btn-success');
    //                                 // btn.addClass('btn-secondary');
    //                                 // $(".mn3").fadeOut();
    //                                 // subtransbox.removeClass('move-left')
    //                                 // transbox.addClass('justify-content-center')
    //                                 // subtransbox.addClass('col-md-12')
    //                                 // subtransbox.removeClass('col-md-3')
    //                                 setTimeout(() => {
    //                                     $(this).prop('disabled', false);
    //                                 }, 5000);
    //                             }
    //                         })
    //                         .catch(err => {
    //                             console.error("เกิดข้อผิดพลาด:", err);
    //                             Swal.fire({
    //                                 position: "center",
    //                                 icon: 'error',
    //                                 title: "❌ ผิดพลาด!",
    //                                 html: `
    //     <div style="font-size: 16px; color: #b71c1c;">
    //         🚫 ไม่สามารถ <strong>ปิดไฟทุกอุปกรณ์</strong> ได้<br>
    //         กรุณาติดต่อผู้ดูแลระบบ
    //     </div>
    // `,
    //                                 showConfirmButton: false,
    //                                 timer: 2000
    //                             });

    //                         });
    //                 }, 3000);
    //             } else {
    //                 isInternalChange = true;
    //                 controlRelay.bootstrapToggle('on');
    //                 const btn = $('#control-send-all')
    //                 btn.attr('disabled', true);
    //                 btn.removeClass('btn-success');
    //                 btn.addClass('btn-secondary');
    //             }
    //         })
    //     } else {
    //         Swal.fire({
    //             title: "⚠️ ต้องการส่งคำสั่ง?",
    //             html: `<div style="font-size: 16px;">คุณต้องการ <strong>เปิดไฟทุกอุปกรณ์</strong> ใช่หรือไม่?</div>`,
    //             icon: "warning",
    //             showCancelButton: true,
    //             confirmButtonColor: "#3085d6",
    //             cancelButtonColor: "#d33",
    //             confirmButtonText: "ตกลง",
    //             cancelButtonText: "ยกเลิก"
    //         }).then((result) => {
    //             if (result.isConfirmed) {
    //                 Swal.fire({
    //                     title: '🔄 กำลังดำเนินการ...',
    //                     html: `
    //     <div style="font-size: 16px; color: #555;">
    //         กำลังส่งคำสั่ง <strong>ปิดไฟทุกอุปกรณ์</strong><br>
    //         กรุณารอสักครู่...
    //     </div>
    // `,
    //                     timerProgressBar: true,
    //                     allowOutsideClick: false,
    //                     allowEscapeKey: false,
    //                     showConfirmButton: false,
    //                     didOpen: () => {
    //                         Swal.showLoading();
    //                     }
    //                 });

    //                 setTimeout(() => {
    //                     fetch(endpointon, options)
    //                         .then(res => res.json())
    //                         .then(obj => {
    //                             if (obj.status === "Success") {
    //                                 Swal.close();
    //                                 Swal.fire({
    //                                     position: "center",
    //                                     icon: 'success',
    //                                     title: '✅ สำเร็จ!',
    //                                     html: `
    //     <div style="padding: 12px; background-color: #e6f4ea; border: 1px solid #a3d9a5; border-radius: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2e7d32;">
    //         เปิดไฟให้กับ <strong>ทุกอุปกรณ์</strong> เรียบร้อยแล้ว
    //     </div>
    // `,
    //                                     showConfirmButton: false,
    //                                     timer: 2000
    //                                 });

    //                                 $(this).prop('disabled', true)
    //                                 const btn = $('#control-send-all')

    //                                 // subtransbox.addClass('move-left')
    //                                 // transbox.removeClass('justify-content-center')
    //                                 // subtransbox.removeClass('col-md-12')
    //                                 // subtransbox.addClass('col-md-3')
    //                                 btn.attr('disabled', false);
    //                                 btn.removeClass('btn-secondary');
    //                                 btn.addClass('btn-success');
    //                                 $(".mn3").fadeIn();
    //                                 setTimeout(() => {
    //                                     $(this).prop('disabled', false);
    //                                 }, 5000);

    //                             }
    //                         })
    //                         .catch(err => {
    //                             console.error("เกิดข้อผิดพลาด:", err);
    //                             Swal.fire({
    //                                 position: "center",
    //                                 icon: 'error',
    //                                 title: "❌ ผิดพลาด!",
    //                                 html: `
    //     <div style="font-size: 16px; color: #b71c1c;">
    //         🚫 ไม่สามารถ <strong>เปิดไฟ</strong> ให้กับทุกอุปกรณ์ได้<br>
    //         กรุณาติดต่อผู้ดูแลระบบ
    //     </div>
    // `,
    //                                 showConfirmButton: false,
    //                                 timer: 2000
    //                             });

    //                         });
    //                 }, 3000);
    //             } else {
    //                 isInternalChange = true;
    //                 controlRelay.bootstrapToggle('off');
    //                 // $(".mn3").fadeOut();
    //                 // const btn = $('#control-send-all')
    //                 // btn.attr('disabled', true);
    //                 // btn.removeClass('btn-success');
    //                 // btn.addClass('btn-secondary');
    //             }
    //         })
    //     }
    // })

    $('#control-send-manual').click(function () {
        const macAddress = $('#controlLampSerialNo').val()
        const switchbtn = $('#controlRelayState')
        const endpoint = "http://85.204.247.82:3002/api/turnonlightval"
        const warmVal = $('#controlRangeWarm').val()
        const coolVal = $('#controlRangeCool').val()
        let relay

        if (switchbtn.prop('checked')) {
            relay = 'ON'
        } else {
            relay = 'OFF'
        }

        const datas = {
            macAddress,
            relay,
            warmVal,
            coolVal,
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
                    }, 7000);
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
        }, 500)
    })

    $('#control-send-schedule').click(async function () {
        const macAddress = $('#controlLampSerialNo').val()
        const endpoint = "http://85.204.247.82:3002/api/setschedule"
        const mac = macAddress
        let datasarr = []

        for (let i = 1; i <= 5; i++) {
            const no = $(`#schedule_${i}_no`).val()
            const start = $(`#schedule_${i}_start`).val()
            const end = $(`#schedule_${i}_end`).val()
            if (no && start && end) {
                datasarr.push({
                    no: no,
                    starttime: start,
                    endtime: end,
                    warmval: $(`#schedule_${i}_controlRangeWarm`).val(),
                    coolval: $(`#schedule_${i}_controlRangeCool`).val()
                })
            }
        }

        let datas = { macAddress: mac, schedule: datasarr }
        console.log(datas)
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(datas)
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
    })

    $('#control-send-all-schedule').click(async function () {
        const group = $('#groupSelect').val()
        const endpoint = 'http://85.204.247.82:3002/api/setallschedule'
        const schedulDatas = []

        // $('#schedulelist li').each(function (index) {
        //     const no = index + 1
        //     const starttime = $(`#scheduleall_${no}_start`).val()
        //     const endtime = $(`#scheduleall_${no}_end`).val()
        //     const warmval = $(`#scheduleall_${no}_controlRangeWarm`).val()
        //     const coolval = $(`#scheduleall_${no}_controlRangeCool`).val()

        //     const schedulVal = {
        //         no,
        //         starttime,
        //         endtime,
        //         warmval,
        //         coolval
        //     }

        //     schedulDatas.push(schedulVal)
        // })

        for (let i = 1; i <= 5; i++) {
            let no = i
            let active = true
            let starttime = $(`#scheduleall_${no}_start`).val()
            let endtime = $(`#scheduleall_${no}_end`).val()
            let warmval = $(`#scheduleall_${no}_controlRangeWarm`).val()
            let coolval = $(`#scheduleall_${no}_controlRangeCool`).val()

            if (!starttime && !endtime && !warmval && !coolval) active = false
            if (starttime === '00:00' && endtime === '00:00' && warmval === '0' && coolval === '0') active = false
            if (endtime <= starttime) starttime = '00:00', endtime = '00:00', active = false
            // if (!starttime && !endtime) starttime = '00:00', endtime = '00:00'
            // if (!warmval && !coolval) warmval = '0', coolval = '0'


            // if (warmval === '0' && coolval === '0') active = false

            const datas = {
                no,
                active,
                starttime,
                endtime,
                warmval,
                coolval
            }

            schedulDatas.push(datas)

        }

        schedulDatas.forEach(items => {
            console.log(items)
        })

        // const datas = { group: group, schedule: schedulDatas }
        // // console.log('datas', datas)

        // // schedulDatas.forEach(items =>{
        // //     console.log(items)
        // // })

        // const options = {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json; charset=utf-8"
        //     },
        //     body: JSON.stringify(datas)
        // }

        // Swal.fire({
        //     title: '<span>🔄 กำลังดำเนินการ...</span>',
        //     html: `
        //     <div style="font-size: 16px; color: #555;">
        //         กำลังส่งคำสั่งทุกอุปกรณ์<br>
        //         กรุณารอสักครู่...
        //     </div>
        // `,
        //     timerProgressBar: true,
        //     allowOutsideClick: false,
        //     allowEscapeKey: false,
        //     showConfirmButton: false,
        //     didOpen: () => {
        //         Swal.showLoading();
        //     }
        // })

        // try {
        //     const resp = await fetch(endpoint, options);
        //     const obj = await resp.json();
        //     // console.log('response', obj.status)

        //     Swal.fire({
        //         position: "center",
        //         icon: 'success',
        //         title: '✅ สำเร็จ!',
        //         html: `
        //     <div style="font-size: 16px; color: #2e7d32;">
        //         ส่งคำสั่งไปยังทุกอุปกรณ์ <strong>สำเร็จ</strong>
        //     </div>
        // `,
        //         showConfirmButton: false,
        //         timer: 2000
        //     })

        //     // setTimeout(() => {
        //     //     $('#controlInfoModal').modal('hide')
        //     // }, 1500);
        //     $(this).prop('disabled', true);
        //     setTimeout(() => {
        //         $(this).prop('disabled', false);
        //     }, 15000);

        // } catch (err) {
        //     console.error("เกิดข้อผิดพลาด:", err);
        //     Swal.fire({
        //         position: "center",
        //         icon: 'error',
        //         title: "❌ ผิดพลาด!",
        //         html: `
        //             <div style="font-size: 16px; color: #b71c1c;">
        //                 🚫 <strong>ส่งคำสั่งไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ</strong>
        //             </div>
        //         `,
        //         showConfirmButton: false,
        //         timer: 1500
        //     });
        // }

    })

    $('#control-send-all-manual').click(function () {
        const endpoint = "http://85.204.247.82:3002/api/turnonalllightval"
        const warmVal = $('#controlAllRangeWarm').val()
        const coolVal = $('#controlAllRangeCool').val()
        const relaybtn = $('#controlAllRelayStatebtn')
        const group = $('#groupSelect').val()
        let relay

        if (relaybtn.prop('checked')) {
            relay = "ON"
        } else {
            relay = "OFF"
        }

        const datas = {
            relay,
            group,
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
        })

        // setTimeout(() => {
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
                })

                setTimeout(() => {
                    // $('#controlAllRelayStateModal').modal('hide')
                }, 1500);
                $(this).prop('disabled', true);
                setTimeout(() => {
                    $(this).prop('disabled', false);
                }, 7000);
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
        // }, 5000)
    })

    const toggleStatus = (relay) => {
        const controlRelay = $("#controlRelayState");
        const transbox = $('#transbox')
        const subtransbox = $('#subtransbox')

        controlRelay.val(relay)
        if (relay === "OFF") {
            const btn = $('#control-send-manual')

            // subtransbox.removeClass('move-left')
            // transbox.addClass('justify-content-center')
            // subtransbox.addClass('col-md-12')
            // subtransbox.removeClass('col-md-3')
            // btn.attr('disabled', true);
            // btn.removeClass('btn-success');
            // btn.addClass('btn-secondary');
            // $(".mn").fadeOut();
            controlRelay.bootstrapToggle('off');
            $("#controlActionManual").fadeOut();
        } else if (relay === "ON") {
            const btn = $('#control-send-manual')

            // subtransbox.addClass('move-left')
            // transbox.removeClass('justify-content-center')
            // subtransbox.removeClass('col-md-12')
            // subtransbox.addClass('col-md-3')
            btn.removeClass('btn-secondary');
            btn.addClass('btn-success');
            btn.removeAttr('disabled');
            // $(".mn").fadeIn();
            controlRelay.bootstrapToggle('on');
        }
    }

    const toggleStatus2 = (relay) => {
        const controlRelay = $("#controlRelayState2");
        controlRelay.val(relay)
        if (relay === "OFF") {
            // const btn = $('#control-send-schedule')
            // btn.attr('disabled', true);
            // btn.removeClass('btn-success');
            // btn.addClass('btn-secondary');
            // $(".mn2").fadeOut();
            // $("#controlActionManual").fadeOut();
            controlRelay.bootstrapToggle('off');
        } else if (relay === "ON") {
            // const btn = $('#control-send-schedule')
            // btn.removeClass('btn-secondary');
            // btn.addClass('btn-success');
            // btn.removeAttr('disabled');
            // $(".mn2").fadeIn();
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

    $('#controllerCode').on('change', function () {
        const alldevicesbtn = $('#controlAllRelayState')
        const groupDevies = $('#groupDeviceslebel')
        const groupdropdown = $('.groupDevices')
        let value = $(this).val()
        let text = $(this).find('option:selected').text()
        if (value !== 'CTL25-00002') {
            groupDevies.addClass('d-none')
            groupDevies.removeClass('d-flex')
            alldevicesbtn.addClass('d-none')
            alldevicesbtn.removeClass('d-flex')
            groupdropdown.addClass('d-none')
        } else {
            alldevicesbtn.fadeIn()
            alldevicesbtn.addClass('d-flex')
            groupDevies.fadeIn()
            groupDevies.addClass('d-flex')
            groupdropdown.removeClass('d-none')
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

    const getGroupDevices = async () => {
        const inputGroup = $("#groupDevices")
        const inputGroup_addmodal = $("#groupDevices_addmodal")
        const endpoint = "http://85.204.247.82:3002/api/getalldevices"
        const checkArr = new Set()
        const options = { method: "GET" }

        try {
            const response = await fetch(endpoint, options)
            const result = await response.json()

            result?.devices?.forEach(item => {
                const group = item?.mid
                if (!group || checkArr.has(group)) return

                checkArr.add(group)
                $(`<option value="${group}">${group}</option>`).appendTo(inputGroup)
                $(`<option value="${group}">${group}</option>`).appendTo(inputGroup_addmodal)
            })
        } catch (error) {
            console.error("Error fetching group devices:", error)
        }
    }
    getGroupDevices()

    const addDropdown = async () => {
        if ($('#groupSelect').length > 0) return;

        const headtable = $('.dt-layout-start').first();

        const dropdown = $(`
        <div class="col-md-3 d-flex align-items-center justify-content-center groupSelect">
            <select id="groupSelect" class="selectpicker form-control border-secondary text-dark" data-live-search="true" title="เลือกกลุ่ม" style="min-width: 200px; border: 1px solid;">
                <option value="0">เลือกทั้งหมด</option>
            </select>
        </div>
    `);

        headtable.after(dropdown);
        $('#groupSelect').selectpicker();
    }


    const selectGroupDevices = async (group) => {
        const table = $('#alldevice')
        const endpointgetgroupdatas = `http://85.204.247.82:3002/api/getgroupdevices/${group}`
        const tableBody = document.querySelector("#alldevice tbody");
        tableBody.innerHTML = "";
        const groupselect = $('.groupSelect')
        try {
            const response = await fetch(endpointgetgroupdatas)
            const obj = await response.json()

            obj.groupdevices.forEach(item => {
                const row = tableBody.insertRow();
                row.insertCell().textContent = item?.macAddress
                row.insertCell().textContent = item?.tag
                row.insertCell().textContent = item?.relay
                row.insertCell().textContent = item?.pwm_freq
                row.insertCell().textContent = item?.mid
                row.insertCell().textContent = item?.workmode
            });

            if ($.fn.DataTable.isDataTable(table)) {
                table.DataTable().clear().destroy()
            }

            obj.groupdevices.forEach(item => {
                const row = $("<tr>");
                row.append(`<td>${item?.macAddress}</td>`)
                row.append(`<td>${item?.tag}</td>`)
                row.append(`<td>${item?.relay}</td>`)
                row.append(`<td>${item?.pwm_freq}</td>`)
                row.append(`<td>${item?.mid}</td>`)
                row.append(`<td>${item?.workmode}</td>`)
                table.find("tbody").append(row);
            });

            table.removeClass("animate__fadeOut").addClass("animate__animated animate__fadeIn");
            groupselect.removeClass("animate__fadeOut").addClass("animate__animated animate__fadeIn");


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
            await addDropdown(group)
            await loadGroupDropdown(group)
        } catch (error) {
            console.error("Error loading group devices", error)
        }
    };

    $(document).on('change', '#groupSelect', async function () {
        const group = $('#groupSelect').val()
        console.log('groupSelect', group)
        await selectGroupDevices(group)
    })

    const loadGroupDropdown = async (selectedGroup) => {
        const groupselect = $('#groupSelect');
        groupselect.empty()

        try {
            const res = await fetch("http://85.204.247.82:3002/api/getalldevices")
            const data = await res.json();
            const mids = [...new Set(data.devices.map(item => item.mid))]

            await groupselect.append(`<option value="0">เลือกทั้งหมด</option>`)
            mids.forEach(mid => {
                groupselect.append(`<option value="${mid}">กลุ่ม ${mid}</option>`)
            });

            groupselect.selectpicker('refresh')
            groupselect.val(selectedGroup)
            groupselect.selectpicker('refresh')
            groupselect.selectpicker('render')

        } catch (err) {
            console.error("โหลด groupSelect ล้มเหลว:", err)
        }
    };

    $('a[data-toggle="pill"]').on('shown.bs.tab', function (e) {
        var targetTabId = $(e.target).attr('id')
        const manualbtn = $('#control-send-all-manual')
        const manualauto = $('#control-send-all-schedule')

        if (targetTabId === 'manualAll-tab') {
            manualbtn.removeClass('d-none')
            manualauto.addClass('d-none')
            runManualFunction()
        } else if (targetTabId === 'autoAll-tab') {
            manualbtn.addClass('d-none')
            manualauto.removeClass('d-none')
            runAutoFunction()
        }
    })

    function runManualFunction() {
        console.log("กำลังทำงานในแท็บ Manual")
        // ใส่โค้ดที่ต้องการให้ทำงาน
    }

    $('#addtaskbtn').click(() => {
        const taskInput = $("#taskInput");
        const taskText = taskInput.val().trim();
        if (taskText) {
            addTask(taskText);
            taskInput.val("");
        }
    });

    let schedultab = true

    function runAutoFunction() {

        if (!schedultab) return

        const currentCount = $('#schedulelist li').length;
        const period = currentCount + 1

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
          <label for="scheduleall_${period}_start">ตั้งแต่เวลา</label>
          <input type="text" class="form-control datetimepicker-input" id="scheduleall_${period}_start" data-toggle="datetimepicker" autocomplete="off" data-target="#scheduleall_${period}_start"/>
        </div>

        <div class="form-group">
        <label for="scheduleall_${period}_end">ถึงเวลา</label>
          <input type="text" class="form-control datetimepicker-input" id="scheduleall_${period}_end" data-toggle="datetimepicker" autocomplete="off" data-target="#scheduleall_${period}_end" />
        </div>
        </div>
        </div>

        <div class="col-md-8">
        <div class="sliders-wrapper">
          <div class="slider-box">
            <label>แสงอุ่น</label>
            <input type="range" min="0" max="100" value="0" class="brightness-slider-warm py-2" id="scheduleall_${period}_controlRangeWarm" onInput="$('#scheduleall_${period}_rangeWarm').html($(this).val())">
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
              <p class="value" id="scheduleall_${period}_rangeWarm">0</p>
            </div>
          </div>

          <div class="slider-box">
            <label>แสงเย็น</label>
            <input type="range" min="0" max="100" value="0" class="brightness-slider-cool py-2" id="scheduleall_${period}_controlRangeCool" onInput="$('#scheduleall_${period}_rangeCool').html($(this).val())">
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
              <p class="value" id="scheduleall_${period}_rangeCool">0</p>
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

        $('#schedulelist').append($li);
        $li.fadeIn(function () {
            $(`#scheduleall_${period}_start`).datetimepicker({
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

            $(`#scheduleall_${period}_end`).datetimepicker({
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

            $(`#scheduleall_${period}_start`).datetimepicker('date', moment('00:00', 'HH:mm'));
            if (period > 1) {
                const prevEndVal = $(`#scheduleall_${period - 1}_end`).val();
                if (prevEndVal) {
                    const startMoment = moment(prevEndVal, 'HH:mm');
                    const endMoment = startMoment.clone().add(1, 'hours');

                    $(`#scheduleall_${period}_start`).datetimepicker('date', startMoment);
                    $(`#scheduleall_${period}_end`).datetimepicker('date', endMoment);
                } else {
                    $(`#scheduleall_${period}_start`).datetimepicker('date', moment('00:00', 'HH:mm'));
                    $(`#scheduleall_${period}_end`).datetimepicker('date', moment('01:00', 'HH:mm'));
                }
            } else {
                $(`#scheduleall_${period}_start`).datetimepicker('date', moment('00:00', 'HH:mm'));
                $(`#scheduleall_${period}_end`).datetimepicker('date', moment('01:00', 'HH:mm'));
            }

            $(`#scheduleall_${period}_rangeWarm`).text("0");
            $(`#scheduleall_${period}_controlRangeWarm`).val("0");
            $(`#scheduleall_${period}_rangeCool`).text("0");
            $(`#scheduleall_${period}_controlRangeCool`).val("0");

            $(`#scheduleall_${period}_start`).on("change.datetimepicker", function (e) {
                const start = moment(e.date, 'HH:mm');

                if (start.format('HH:mm') === '23:00' || start.isSameOrAfter(moment('23:00', 'HH:mm')) || start.hour() >= 23) {
                    Swal.fire({
                        title: 'แจ้งเตือน',
                        html: '<h4 style="color:#333;font-weight:normal;">เป็นเวลาของวันที่แล้ว ไม่สามารถตั้งค่าได้</h4>',
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

                    $(`#scheduleall_${period}_start`).datetimepicker('date', moment('00:00', 'HH:mm'));
                    return;
                }

                // const endVal = $(`#scheduleall_${period}_end`).val();
                // if (endVal) {
                //     const end = moment(endVal, 'HH:mm');
                //     if (start.isSameOrAfter(end)) {
                //         Swal.fire({
                //             title: 'แจ้งเตือน',
                //             html: '<h4 style="color:#333;font-weight:normal;">เวลาเริ่มต้นต้องไม่มากกว่าหรือเท่ากับเวลาสิ้นสุด</h4>',
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

                //         $(`#scheduleall_${period}_start`).datetimepicker('date', moment('00:00', 'HH:mm'));
                //         return;
                //     }
                // }

                const newEnd = moment(start).add(1, 'hours');
                $(`#scheduleall_${period}_end`).datetimepicker('date', newEnd);

                for (let i = 1; i < period; i++) {
                    const prevEndVal = $(`#scheduleall_${i}_end`).val();
                    if (prevEndVal) {
                        const prevEnd = moment(prevEndVal, 'HH:mm');
                        if (start.isBefore(prevEnd)) {
                            Swal.fire({
                                title: 'แจ้งเตือน',
                                html: `<h4 style="color:#333;font-weight:normal;">ช่วงเวลาที่ ${period} ต้องไม่เริ่มก่อนช่วงเวลาที่ ${i}</h4>`,
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
                                $(`#scheduleall_${period}_start`).datetimepicker('date', moment(previousStart, 'HH:mm'));
                            }
                            return;
                        }
                    }
                }

                const nextPeriod = period + 1;
                const $nextStart = $(`#scheduleall_${nextPeriod}_start`);
                if ($nextStart.length) {
                    const thisEndVal = $(`#scheduleall_${period}_end`).val();
                    if (thisEndVal) {
                        const thisEndMoment = moment(thisEndVal, 'HH:mm');
                        if (moment($nextStart.val(), 'HH:mm').isBefore(thisEndMoment)) {
                            $nextStart.datetimepicker('date', thisEndMoment);
                        }
                    }
                }
            });

            let previousEnd = null;

            $(`#scheduleall_${period}_end`).on("show.datetimepicker", function () {
                previousEnd = $(`#scheduleall_${period}_end`).val();
            });

            $(`#scheduleall_${period}_end`).on("change.datetimepicker", function (e) {
                const end = moment(e.date, 'HH:mm');
                const startVal = $(`#scheduleall_${period}_start`).val();
                if (startVal) {
                    const start = moment(startVal, 'HH:mm');
                    if (end.isSameOrBefore(start)) {
                        Swal.fire({
                            title: 'แจ้งเตือน',
                            html: `<h4 style="color:#333;font-weight:normal;">เวลาสิ้นสุดต้องไม่น้อยกว่าหรือเท่ากับเวลาเริ่มต้น</h4>`,
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

                        $(`#scheduleall_${period}_end`).datetimepicker('date', moment(previousEnd, 'HH:mm'));
                        return;
                    }
                }

                for (let i = 1; i < period; i++) {
                    const prevEndVal = $(`#scheduleall_${i}_end`).val();
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

                            $(`#scheduleall_${period}_end`).datetimepicker('date', prevEnd); // <<< ใช้ prevEnd
                            return;
                        }
                    }
                }

                const nextPeriod = period + 1;
                const $nextStart = $(`#scheduleall_${nextPeriod}_start`);
                if ($nextStart.length) {
                    const nextStartVal = $nextStart.val();
                    if (!nextStartVal || moment(nextStartVal, 'HH:mm').isBefore(end)) {
                        $nextStart.datetimepicker('date', end);
                    }
                }

            });
        });

        schedultab = false
    }

    function addTask(taskText) {
        const taskList = $('#tasklist');

        const li = $("<li></li>");
        const spanText = $("<span></span>").text(taskText).on("click", function () {
            $(this).parent().toggleClass("done");
        });
        const spanRemove = $("<span class='remove'>×</span>").on("click", function () {
            $(this).parent().remove();
        });

        li.append(spanText, spanRemove);
        taskList.append(li);
    }

    document.querySelector('#addschedule').addEventListener('click', function (e) {
        e.preventDefault();

        const currentCount = $('#schedulelist li').length;
        const period = currentCount + 1;

        if (period > 5) return

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
          <label for="scheduleall_${period}_start">ตั้งแต่เวลา</label>
          <input type="text" class="form-control datetimepicker-input" id="scheduleall_${period}_start" data-toggle="datetimepicker" autocomplete="off" data-target="#scheduleall_${period}_start"/>
        </div>

        <div class="form-group">
        <label for="scheduleall_${period}_end">ถึงเวลา</label>
          <input type="text" class="form-control datetimepicker-input py-2" id="scheduleall_${period}_end" data-toggle="datetimepicker" autocomplete="off" data-target="#scheduleall_${period}_end" />
        </div>
        </div>
        </div>

        <div class="col-md-8">
        <div class="sliders-wrapper">
          <div class="slider-box">
            <label>แสงอุ่น</label>
            <input type="range" min="0" max="100" value="0" class="brightness-slider-warm" id="scheduleall_${period}_controlRangeWarm" onInput="$('#scheduleall_${period}_rangeWarm').html($(this).val())">
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
              <p class="value" id="scheduleall_${period}_rangeWarm">0</p>
            </div>
          </div>

          <div class="slider-box">
            <label>แสงเย็น</label>
            <input type="range" min="0" max="100" value="0" class="brightness-slider-cool py-2" id="scheduleall_${period}_controlRangeCool" onInput="$('#scheduleall_${period}_rangeCool').html($(this).val())">
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
              <p class="value" id="scheduleall_${period}_rangeCool">0</p>
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

        $('#schedulelist').append($li);
        $li.fadeIn(function () {
            $(`#scheduleall_${period}_start`).datetimepicker({
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

            $(`#scheduleall_${period}_end`).datetimepicker({
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

            if (period > 1) {
                const prevEndVal = $(`#scheduleall_${period - 1}_end`).val();
                if (prevEndVal) {
                    const startMoment = moment(prevEndVal, 'HH:mm');
                    const endMoment = startMoment.clone().add(1, 'hours'); // เพิ่ม 1 ชม.

                    $(`#scheduleall_${period}_start`).datetimepicker('date', startMoment);
                    $(`#scheduleall_${period}_end`).datetimepicker('date', endMoment);
                } else {
                    $(`#scheduleall_${period}_start`).datetimepicker('date', moment('00:00', 'HH:mm'));
                    $(`#scheduleall_${period}_end`).datetimepicker('date', moment('01:00', 'HH:mm'));
                }
            } else {
                $(`#scheduleall_${period}_start`).datetimepicker('date', moment('00:00', 'HH:mm'));
                $(`#scheduleall_${period}_end`).datetimepicker('date', moment('01:00', 'HH:mm'));
            }

            $(`#scheduleall_${period}_rangeWarm`).text("0");
            $(`#scheduleall_${period}_controlRangeWarm`).val("0");
            $(`#scheduleall_${period}_rangeCool`).text("0");
            $(`#scheduleall_${period}_controlRangeCool`).val("0");

            let previousStart = null;

            $(`#scheduleall_${period}_start`).on("show.datetimepicker", function () {
                previousStart = $(`#scheduleall_${period}_start`).val(); // เก็บไว้ก่อนกรอกใหม่
            });

            $(`#scheduleall_${period}_start`).on("change.datetimepicker", function (e) {
                const start = moment(e.date, 'HH:mm');
                const endVal = $(`#scheduleall_${period}_end`).val();

                // if (endVal) {
                //     const end = moment(endVal, 'HH:mm');
                //     if (start.isSameOrAfter(end)) {
                //         Swal.fire({
                //             title: 'แจ้งเตือน',
                //             html: `<h4 style="color:#333;font-weight:normal;">เวลาเริ่มต้นต้องไม่มากกว่าหรือเท่ากับเวลาสิ้นสุด</h4>`,
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
                //             $(`#scheduleall_${period}_start`).datetimepicker('date', moment(previousStart, 'HH:mm'));
                //         }
                //         return;
                //     }
                // }

                const newEnd = moment(start).add(1, 'hours');
                $(`#scheduleall_${period}_end`).datetimepicker('date', newEnd);

                for (let i = 1; i < period; i++) {
                    const prevEndVal = $(`#scheduleall_${i}_end`).val();
                    if (prevEndVal) {
                        const prevEnd = moment(prevEndVal, 'HH:mm');
                        if (start.isBefore(prevEnd)) {
                            Swal.fire({
                                title: 'แจ้งเตือน',
                                html: `<h4 style="color:#333;font-weight:normal;">ช่วงเวลาที่ ${period} ต้องไม่เริ่มก่อนช่วงเวลาที่ ${i}</h4>`,
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
                                $(`#scheduleall_${period}_start`).datetimepicker('date', moment(previousStart, 'HH:mm'));
                            }
                            return;
                        }
                    }
                }

                const nextPeriod = period + 1;
                const $nextStart = $(`#scheduleall_${nextPeriod}_start`);
                if ($nextStart.length) {
                    const thisEndVal = $(`#scheduleall_${period}_end`).val();
                    if (thisEndVal) {
                        const thisEndMoment = moment(thisEndVal, 'HH:mm');
                        if (moment($nextStart.val(), 'HH:mm').isBefore(thisEndMoment)) {
                            $nextStart.datetimepicker('date', thisEndMoment);
                        }
                    }
                }
            });

            let previousEnd = null;

            $(`#scheduleall_${period}_end`).on("show.datetimepicker", function () {
                previousEnd = $(`#scheduleall_${period}_end`).val();
            });

            $(`#scheduleall_${period}_end`).on("change.datetimepicker", function (e) {
                const end = moment(e.date, 'HH:mm');
                const startVal = $(`#scheduleall_${period}_start`).val();
                if (startVal) {
                    const start = moment(startVal, 'HH:mm');
                    if (end.isSameOrBefore(start)) {
                        Swal.fire({
                            title: 'แจ้งเตือน',
                            html: `<h4 style="color:#333;font-weight:normal;">เวลาสิ้นสุดต้องไม่น้อยกว่าหรือเท่ากับเวลาเริ่มต้น</h4>`,
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

                        $(`#scheduleall_${period}_end`).datetimepicker('date', moment(previousEnd, 'HH:mm'));
                        return;
                    }
                }

                for (let i = 1; i < period; i++) {
                    const prevEndVal = $(`#scheduleall_${i}_end`).val();
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

                            $(`#scheduleall_${period}_end`).datetimepicker('date', prevEnd); // <<< ใช้ prevEnd
                            return;
                        }
                    }
                }

                if (period === 5) {
                    const firstStartVal = $(`#scheduleall_1_start`).val();
                    if (firstStartVal) {
                        const firstStartTime = moment(firstStartVal, 'HH:mm');
                        const endTime = moment(end.format('HH:mm'), 'HH:mm');

                        let endMoment = moment().set({
                            hour: endTime.get('hour'),
                            minute: endTime.get('minute'),
                            second: 0,
                            millisecond: 0
                        });

                        if (endTime.isSameOrBefore(firstStartTime)) {
                            endMoment.add(1, 'day');
                        }

                        let maxEnd = moment().add(1, 'day').startOf('day');

                        if (endMoment.isSameOrAfter(maxEnd)) {
                            Swal.fire({
                                title: 'แจ้งเตือน',
                                html: `<h4 style="color:#333;font-weight:normal;">ช่วงเวลาที่ 5 ต้องสิ้นสุดก่อนเที่ยงคืนของวันเริ่มต้นช่วงที่ 1 (ไม่สามารถตั้งเป็น 00:00 ได้)</h4>`,
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

                            const startVal = $(`#scheduleall_${period}_start`).val();
                            if (startVal) {
                                const startMoment = moment(startVal, 'HH:mm');
                                const resetTime = startMoment.clone().add(1, 'hour');
                                $(`#scheduleall_${period}_end`).datetimepicker('date', resetTime);
                            } else {
                                const resetTime = moment().add(1, 'hour');
                                $(`#scheduleall_${period}_end`).datetimepicker('date', resetTime);
                            }
                            return;
                        }
                    }
                }

                const nextPeriod = period + 1;
                const $nextStart = $(`#scheduleall_${nextPeriod}_start`);
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
        $('#schedulelist li').each(function (index) {
            const $li = $(this);
            const newPeriod = index + 1;

            $li.find('h2.text-center').html(`🕒 ช่วงเวลาที่ ${newPeriod}`);
            $li.find('input#no').val(newPeriod);

            const $startInput = $li.find('input[id^="scheduleall_"][id$="_start"]');
            $startInput.attr('id', `scheduleall_${newPeriod}_start`);
            $startInput.attr('data-target', `#scheduleall_${newPeriod}_start`);
            $li.find(`label[for^="scheduleall_"][for$="_start"]`).attr('for', `scheduleall_${newPeriod}_start`);

            const $endInput = $li.find('input[id^="scheduleall_"][id$="_end"]');
            $endInput.attr('id', `scheduleall_${newPeriod}_end`);
            $endInput.attr('data-target', `#scheduleall_${newPeriod}_end`);
            $li.find(`label[for^="scheduleall_"][for$="_end"]`).attr('for', `scheduleall_${newPeriod}_end`);

            $li.find('input.brightness-slider-warm')
                .attr('id', `scheduleall_${newPeriod}_controlRangeWarm`)
                .attr('oninput', `$('#scheduleall_${newPeriod}_rangeWarm').html($(this).val())`);
            $li.find('#' + $li.find('.light-info-box-warm .value').attr('id'))
                .attr('id', `scheduleall_${newPeriod}_rangeWarm`)
            // .text('0');

            $li.find('input.brightness-slider-cool')
                .attr('id', `scheduleall_${newPeriod}_controlRangeCool`)
                .attr('oninput', `$('#scheduleall_${newPeriod}_rangeCool').html($(this).val())`);
            $li.find('#' + $li.find('.light-info-box-cool .value').attr('id'))
                .attr('id', `scheduleall_${newPeriod}_rangeCool`)
            // .text('0');
        });
    }

    $('#clearAllSchedules').on('click', function () {
        $('#schedulelist li').slice(1).remove();

        const $firstLi = $('#schedulelist li').first();

        $firstLi.find('input[id^="scheduleall_"][id$="_start"]').datetimepicker('date', moment('00:00', 'HH:mm'));

        $firstLi.find('input[id^="scheduleall_"][id$="_end"]').datetimepicker('date', moment('01:00', 'HH:mm'));

        $firstLi.find('input[id^="scheduleall_"][id$="_controlRangeWarm"]').val(0).trigger('input');
        $firstLi.find('p[id^="scheduleall_"][id$="_rangeWarm"]').text('0');

        $firstLi.find('input[id^="scheduleall_"][id$="_controlRangeCool"]').val(0).trigger('input');
        $firstLi.find('p[id^="scheduleall_"][id$="_rangeCool"]').text('0');
    });







})