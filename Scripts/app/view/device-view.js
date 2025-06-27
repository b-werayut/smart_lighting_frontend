$(document).ready(function () {
    bindButtonByPermission();

    //-----------------------------------------------

    var modalState = MODAL_STATE.CREATE;

    //-----------------------------------------------

    var defaultPagingOptions = {
        onPageClick: function (e, page) {
            getControllerData($("#projectCode option:selected").val(), page, $("#searchText").val());
        }
    };

    //-----------------------------------------------

    function bindButtonByPermission() {
        if ($("#parentRole").attr("data-valkey") == "1") {
            $("#buttonNewController").addClass("invisible");
            $("#modal-save-button").addClass("d-none");
        }
    }

    if (document.location.search) {
        let queryString = {};

        $.each(document.location.search.substr(1).split('&'), function (_, params) {
            let i = params.split('=');
            queryString[i[0].toString()] = i[1].toString();
        });

        if (!$.isEmptyObject(queryString)) {
            fromProjectPageWithAsync(queryString);
        }
    } else {
        getProjectData("");
    }

    async function fromProjectPageWithAsync(queryString) {
        await getProjectData(queryString["projectCode"]);

        $("#projectCode").val(queryString["projectCode"]).change(
            getControllerData(queryString["projectCode"], 1, "")
        );

        bindingAddButtonState();
    }

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

    function bindingProjectDropdown(jsonProject) {
        if (jsonProject.length > 0) {
            $.each(jsonProject, function (_, item) {
                $("#projectCode").append($("<option value=" + item.projectCode + " data-valkey=" + item.projectType + ">" + item.projectName + "</option>"));
            });
        } else {
            $("#projectCode").append("<option selected disabled value=''>ไม่มีข้อมูล</option>");

            if (!$("#buttonNewController").hasClass("invisible")) {
                $("#buttonNewController").addClass("invisible");
            }
        }
    };

    function bindingAddButtonState() {
        if ($("#projectCode option:selected").attr("data-valkey") == "3") {
            if (!$("#buttonNewController").hasClass("invisible")) {
                $("#buttonNewController").addClass("invisible");
            }

            if ($("#NBNodeProjectWarning").hasClass("d-none")) {
                $("#NBNodeProjectWarning").removeClass("d-none")
            }
        } else {
            if ($("#buttonNewController").hasClass("invisible")) {
                $("#buttonNewController").removeClass("invisible");
            }

            if (!$("#NBNodeProjectWarning").hasClass("d-none")) {
                $("#NBNodeProjectWarning").addClass("d-none")
            }
        }

        bindButtonByPermission();
    };

    $("#projectCode").change(function (e) {
        bindingAddButtonState()

        $("#searchText").val("");
        $("#no-more-tables tbody").empty();

        getControllerData($("#projectCode option:selected").val(), 1, $("#searchText").val());
    });

    function destroyPaging() {
        if ($("#bottomPagination").data("twbs-pagination")) {
            $("#bottomPagination").twbsPagination("destroy");
        }
    };

    async function getControllerData(projectCode, currentPage, searchText) {
        $("#no-more-tables").LoadingOverlay("show");

        currentPage = typeof currentPage == "number" ? currentPage : 1;

        let controllerData = {
            projectCode: projectCode,
            page: currentPage,
            searchText: searchText
        };

        fetch(ENDPOINT_URL.CONTROLLER_LIST, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(controllerData)
        }).then(response => {
            $("#no-more-tables").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                if (currentPage > viewModel.pagingTotalPage) {
                    currentPage = viewModel.pagingTotalPage;
                }

                bindingControllerTable(viewModel.data, viewModel.pagingTotalPage, currentPage);
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    function bindingControllerTable(data, totalPage, currentPage) {
        let tableBody = $("#no-more-tables tbody")
        tableBody.empty();

        let colSpan;
        if ($("#projectCode option:selected").attr("data-valkey") != "3") {
            colSpan = 4;
            if ($("#controllerStatus").hasClass("d-none")) {
                $("#controllerStatus").removeClass("d-none");
            }
        } else {
            colSpan = 3;
            if (!$("#controllerStatus").hasClass("d-none")) {
                $("#controllerStatus").addClass("d-none");
            }
        }

        if (data.length == 0) {
            tableBody.append("<tr><td colspan=\"" + colSpan + "\">ไม่มีข้อมูล</td></tr>");
        } else {
            $.each(data, function (_, item) {
                let tableRow = jQuery("<tr></tr>");
                let serialNoCol = jQuery("<td></td>").attr("data-title", "S/N").html(item.controllerCode).appendTo(tableRow);
                let controllerNameCol = jQuery("<td></td>").attr("data-title", "ชื่อกล่องควบคุม").html("<span class='d-inline-block text-truncate' style='max-width:400px;'>" + item.controllerName + "</span>").appendTo(tableRow);

                if ($("#projectCode option:selected").attr("data-valkey") != "3") {
                    let statusBadge;
                    switch (item.controllerStatus) {
                        case 0:
                            statusBadge = "badge-danger";
                            break;
                        case 1:
                            statusBadge = "badge-success";
                            break;
                    }
                    let badgeHtml = "<span class=\"badge badge-pill " + statusBadge + "\">" + item.controllerStatusText + "</span>";
                    let controllerStatus = jQuery("<td></td>").attr("data-title", "สถานะ").html(badgeHtml).appendTo(tableRow);
                }

                let buttonCol = jQuery("<td></td>").appendTo(tableRow);

                let buttonArea = jQuery("<div></div>", {
                    class: "d-flex justify-content-end flex-wrap"
                }).appendTo(buttonCol);

                if ($("#projectCode option:selected").attr("data-valkey") != "2") {
                    let lampButton = jQuery("<button></button>", {
                        type: "button",
                        class: "btn btn-light btn-icon"
                    })
                        .attr("data-valkey", item.controllerCode)
                        .on("click", showLampModal)
                        .html("<i class=\"mdi mdi-lightbulb-on\"></i>")
                        .appendTo(buttonArea);
                    lampButton.tooltip({ title: "หลอดไฟ", boundary: "window", placement: "left" });
                }

                if ($("#projectCode option:selected").attr("data-valkey") != "3") {
                    let editButton = jQuery("<button></button>", {
                        type: "button",
                        class: "btn btn-light btn-icon ml-3"
                    })
                        .attr("data-valkey", item.controllerCode).html("<i class=\"mdi mdi-pencil\"></i>")
                        .on("click", showControllerModalInEditMode)
                        .appendTo(buttonArea);
                    editButton.tooltip({ title: "แก้ไขข้อมูล", boundary: "window", placement: "left" });
                }

                if ($("#parentRole").attr("data-valkey") != 1) {
                    if ($("#projectCode option:selected").attr("data-valkey") != "3") {
                        let deleteButton = jQuery("<button></button>", {
                            type: "button",
                            class: "btn btn-light btn-icon ml-3"
                        })
                            .attr("data-valkey", item.controllerCode)
                            .on("click", promptDeleteController)
                            .html("<i class=\"mdi mdi-delete\"></i>")
                            .appendTo(buttonArea);
                        deleteButton.tooltip({ title: "ลบ", boundary: "window", placement: "left" });
                    }
                }

                tableBody.append(tableRow);
            });
        }

        $("#no-more-tables").removeClass("d-none");

        destroyPaging();
        $("#bottomPagination").twbsPagination($.extend({}, defaultPagingOptions, {
            startPage: currentPage <= totalPage ? currentPage : totalPage,
            totalPages: totalPage
        }));
    };

    function validateData() {
        let isValid = true;

        if (!$("#controllerSerialNo").val().trim()) {
            $("#controllerSerialNo").addClass("is-invalid")
            isValid = false;
        }

        if (!$("#controllerName").val().trim()) {
            $("#controllerName").addClass("is-invalid")
            isValid = false;
        }

        return isValid;
    };

    function bindControllerViewModelToModal(viewModel) {
        $("#controllerSerialNo").val(viewModel.controllerCode);
        $("#controllerSerialNo").prop("disabled", true);
        $("#controllerName").val(viewModel.controllerName);
        $("#controllerDescription").val(viewModel.controllerDescription);
        $("#controllerLat").val(viewModel.latitude);
        $("#controllerLong").val(viewModel.longitude);
        $("#controllerPhone").val(viewModel.controllerPhone);
        $("#lampQty").val(viewModel.lampQty);
        $("#ampMin").val(viewModel.ampMin);
        $("#ampMax").val(viewModel.ampMax);
        $("#boxNo").val(viewModel.boxNo);
        $("#boxKmFrom").val(viewModel.boxKmFrom);
        $("#boxKmTo").val(viewModel.boxKmTo);
    };

    $(".modal-state-create").on("click", function (e) {
        modalState = MODAL_STATE.CREATE;
        $("#deviceInfoModalLongTitle").text("เพิ่มกล่องควบคุมใหม่");
    });

    $("#modal-save-button").on("click", function (e) {
        if (!validateData()) {
            return;
        }

        $("#deviceInfoModal").LoadingOverlay("show");

        let postToUrl;
        switch (modalState) {
            case MODAL_STATE.CREATE:
                postToUrl = ENDPOINT_URL.CONTROLLER_CREATE;
                break;
            case MODAL_STATE.UPDATE:
                postToUrl = ENDPOINT_URL.CONTROLLER_UPDATE;
                break;
        };

        let controllerData = {
            controllerCode: $("#controllerSerialNo").val(),
            controllerName: $("#controllerName").val(),
            controllerDescription: $("#controllerDescription").val(),
            projectCode: $("#projectCode option:selected").val(),
            controllerSerialNo: $("#controllerSerialNo").val(),
            latitude: $("#controllerLat").val(),
            longitude: $("#controllerLong").val(),
            controllerPhone: $("#controllerPhone").val(),
            lampQty: $("#lampQty").val(),
            ampMin: $("#ampMin").val(),
            ampMax: $("#ampMax").val(),
            boxNo: $("#boxNo").val(),
            boxKmFrom: $("#boxKmFrom").val(),
            boxKmTo: $("#boxKmTo").val(),
        };

        fetch(postToUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(controllerData)
        }).then(response => {
            $("#deviceInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                $("#deviceInfoModal").modal("hide");
            }

            Swal.fire({
                title: viewModel.title,
                text: viewModel.message,
                icon: viewModel.state,
                confirmButtonColor: "#3085d6"
            }).then((result) => {
                if (viewModel.state == "success") {
                    getControllerData($("#projectCode option:selected").val(), $("#bottomPagination").twbsPagination("getCurrentPage"), $("#searchText").val());
                }
            });
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    });

    $("#deviceInfoModal").on("hidden.bs.modal", function (e) {
        $("#controllerSerialNo").val("");
        $("#controllerSerialNo").prop("disabled", false);

        $("#controllerName").val("");
        $("#controllerDescription").val("");
        $("#controllerLat").val("");
        $("#controllerLong").val("");
        $("#controllerPhone").val("");
        $("#lampQty").val("");
        $("#ampMin").val("");
        $("#ampMax").val("");
        $("#boxNo").val("");
        $("#boxKmFrom").val("");
        $("#boxKmTo").val("");

        $("#controllerSerialNo").removeClass("is-invalid")
        $("#controllerName").removeClass("is-invalid")

    });

    function showControllerModalInEditMode() {
        modalState = MODAL_STATE.UPDATE;

        $("#deviceInfoModalLongTitle").text("ข้อมูลกล่องควบคุม");
        $("#deviceInfoModal").LoadingOverlay("show");

        fetch(ENDPOINT_URL.CONTROLLER_INFO, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ "controllerCode": $(this).attr("data-valkey") })
        }).then(response => {
            $("#deviceInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                bindControllerViewModelToModal(viewModel.data);
                $("#deviceInfoModal").modal("show");
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    function promptDeleteController() {
        Swal.fire({
            title: "ยืนยันรายการ",
            text: "ข้อมูลหลอดไฟที่ทำงานร่วมกับกล่องควบคุมนี้จะถูกลบทั้งหมด\r\nลบกล่องควบคุม \"" + $(this).attr("data-valkey") + "\" ออกจากระบบ?",
            icon: "question",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "ลบ",
            showCancelButton: true,
            cancelButtonColor: "#d33",
            cancelButtonText: "ยกเลิก"
        }).then((result) => {
            if (result.isConfirmed) {
                $.LoadingOverlay("show");

                fetch(ENDPOINT_URL.CONTROLLER_DELETE, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({ "controllerCode": $(this).attr("data-valkey") })
                }).then(response => {
                    $.LoadingOverlay("hide");
                    return response.json();
                }).then(result => {
                    let viewModel = JSON.parse(JSON.stringify(result));

                    if (viewModel.state == "success") {
                        Swal.fire({
                            title: viewModel.title,
                            text: viewModel.message,
                            icon: viewModel.state,
                            confirmButtonColor: "#3085d6"
                        }).then((result) => {
                            if (viewModel.state == "success") {
                                getControllerData($("#projectCode option:selected").val(), $("#bottomPagination").twbsPagination("getCurrentPage"), $("#searchText").val());
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

    function showLampModal() {
        let projectCode = $("#projectCode option:selected").val();
        let controllerCode = $(this).attr("data-valkey");
        window.location.href = "/Lamp/?projectCode=" + projectCode + "&controllerCode=" + controllerCode;
    };

    $("#searchText").keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $("#searchSubmit").click();
        }
    });

    $("#searchSubmit").on("click", function (e) {
        getControllerData($("#projectCode option:selected").val(), 1, $("#searchText").val());
    });

});