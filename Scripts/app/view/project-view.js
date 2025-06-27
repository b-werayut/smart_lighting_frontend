$(document).ready(function () {
    bindButtonByPermission();

    //-----------------------------------------------

    const ADDRESS_PART = {
        PROVINCE: "province",
        DISTRICT: "district",
        SUBDISTRICT: "subdistrict"
    };

    //-----------------------------------------------

    var modalState = MODAL_STATE.CREATE;

    //-----------------------------------------------

    var defaultPagingOptions = {
        onPageClick: function (e, page) {
            getProjectData(page, $("#searchText").val(), $("#filterProjectType option:selected").val());
        }
    };

    //-----------------------------------------------

    function bindButtonByPermission() {
        if ($("#parentRole").attr("data-valkey") == "1") {
            $("#buttonNewProject").addClass("invisible");
            $("#modal-save-button").addClass("d-none");
        }
    }

    let hasProvince = false;
    if (typeof (Storage) !== "undefined") {
        if (sessionStorage.getItem(ADDRESS_PART.PROVINCE) != null) {
            hasProvince = true;
        }
    }

    if (!hasProvince) {
        getProvinceData();
    } else {
        bindingProvinceDropdown(sessionStorage.getItem(ADDRESS_PART.PROVINCE));
    }
    //-----------------------------------------------

    getProjectData(1, "", $("#filterProjectType option:selected").val());

    function getProjectData(currentPage, searchText, projectType) {
        $("#no-more-tables").LoadingOverlay("show");

        currentPage = typeof currentPage == "number" ? currentPage : 1;

        let reqData = {
            page: currentPage,
            searchText: searchText,
            projectType: projectType
        };

        fetch(ENDPOINT_URL.PROJECT_LIST, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(reqData)
        }).then(response => {
            $("#no-more-tables").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                if (currentPage > viewModel.pagingTotalPage) {
                    currentPage = viewModel.pagingTotalPage;
                }

                bindingTableContent(viewModel.data, viewModel.pagingTotalPage, currentPage);
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    function bindingTableContent(data, totalPage, currentPage) {
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
                let projectCodeCol = jQuery("<td></td>").attr("data-title", "รหัสโครงการ").html(item.projectCode).appendTo(tableRow);
                let projectNameCol = jQuery("<td></td>").attr("data-title", "ชื่อโครงการ").html("<span class='d-inline-block text-truncate' style='max-width:400px;'>" + item.projectName + "</span>").appendTo(tableRow);
                let projectTypeCol = jQuery("<td></td>").attr("data-title", "ประเภทกล่องควบคุม").html(item.projectTypeName).appendTo(tableRow);

                let buttonCol = jQuery("<td></td>").appendTo(tableRow);

                let buttonArea = jQuery("<div></div>", {
                    class: "d-flex justify-content-end flex-wrap"
                }).appendTo(buttonCol);

                let editButton = jQuery("<button></button>", {
                    type: "button",
                    class: "btn btn-light btn-icon ml-3"
                })
                    .attr("data-valkey", item.projectCode).html("<i class=\"mdi mdi-pencil\"></i>")
                    .on("click", showInfoModalEditMode)
                    .appendTo(buttonArea);
                editButton.tooltip({ title: "แก้ไขข้อมูล", boundary: "window", placement: "left" });

                if ($("#parentRole").attr("data-valkey") != "1") {

                    let deleteButton = jQuery("<button></button>", {
                        type: "button",
                        class: "btn btn-light btn-icon ml-3"
                    })
                        .attr("data-valkey", item.projectCode)
                        .on("click", promptDelete)
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

    async function getProvinceData() {
        $("#province").LoadingOverlay("show");

        fetch(ENDPOINT_URL.ADDRESS_PROVINCE, {
            method: "GET",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }).then(response => {
            $("#province").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                sessionStorage.setItem(ADDRESS_PART.PROVINCE, JSON.stringify(viewModel.data));
                bindingProvinceDropdown(sessionStorage.getItem(ADDRESS_PART.PROVINCE));
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    }

    async function getDistrictData(provinceCode, selectDistictCode) {
        $("#district").LoadingOverlay("show");

        fetch(ENDPOINT_URL.ADDRESS_DISTRICT + "?provinceCode=" + provinceCode, {
            method: "GET",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }).then(response => {
            $("#district").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                resetDistrictDropDown();
                resetSubDistrictDropDown();
                bindingDistrictDropdown(viewModel.data);

                if (selectDistictCode.trim().length > 0) {
                    $("#district").val(selectDistictCode);
                }
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    }

    async function getSubDistrictData(districtCode, selectSubDistrictCode) {
        $("#subdistrict").LoadingOverlay("show");

        fetch(ENDPOINT_URL.ADDRESS_SUBDISTRICT + "?districtCode=" + districtCode, {
            method: "GET",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }).then(response => {
            $("#subdistrict").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                resetSubDistrictDropDown();
                bindingSubDistrictDropdown(viewModel.data);

                if (selectSubDistrictCode.trim().length > 0) {
                    $("#subdistrict").val(selectSubDistrictCode);
                    $("#postCode").val($("#subdistrict option:selected").attr("val-postcode"));
                }
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    }

    function bindingProvinceDropdown(jsonProvince) {
        let provinceList = JSON.parse(jsonProvince);
        $.each(provinceList, function (_, item) {
            $("#province").append(
                $("<option value=" + item.provinceCode + ">" + item.provinceNameTH + "</option>")
            );
        });
    };

    function bindingDistrictDropdown(jsonDistrict) {
        $.each(jsonDistrict, function (_, item) {
            $("#district")
                .append($("<option value=" + item.districtCode + ">" + item.districtNameTH + "</option>")
            );
        });
    };

    function bindingSubDistrictDropdown(jsonSubDistrict) {
        $.each(jsonSubDistrict, function (_, item) {
            $("#subdistrict")
                .append($("<option value=" + item.subDistrictCode + " val-postcode=" + item.postCode + ">" + item.subDistrictNameTH + "</option>")
            );
        });
    };

    function resetDistrictDropDown() {
        $("#district")
            .empty()
            .append("<option selected disabled value=''>...</option>");
    }

    function resetSubDistrictDropDown() {
        $("#subdistrict")
            .empty()
            .append("<option selected disabled value=''>...</option>");

        $("#postCode").val("...");
    }

    function bindViewModelToModal(viewModel) {
        $("#projectCode").val(viewModel.projectCode);
        $("#projectName").val(viewModel.projectName);
        $("#projectAddress").val(viewModel.projectAddress);
        $("#projectType").val(viewModel.projectType).change();
        $("#projectType").prop("disabled", true);

        $("#province").val(viewModel.provinceCode).change(
            getDistrictData(viewModel.provinceCode, viewModel.districtCode)
        );

        $("#district").val(viewModel.districtCode).change(
            getSubDistrictData(viewModel.districtCode, viewModel.subDistrictCode)
        );

        $("#lineToken_1").val(viewModel.lineToken1);
        $("#lineToken_2").val(viewModel.lineToken2);
    };

    function validateProjectData() {
        let isValid = true;

        if (!$("#projectCode").val().trim()) {
            $("#projectCode").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#projectName").val().trim()) {
            $("#projectName").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#projectAddress").val().trim()) {
            $("#projectAddress").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#projectType option:selected").val().trim()) {
            $("#projectType").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#province option:selected").val().trim()) {
            $("#province").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#district option:selected").val().trim()) {
            $("#district").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#subdistrict option:selected").val().trim()) {
            $("#subdistrict").addClass("is-invalid");
            isValid = false;
        }

        return isValid;
    };

    function showInfoModalEditMode() {
        modalState = MODAL_STATE.UPDATE;

        $("#projectInfoModalLongTitle").text("ข้อมูลโครงการ");
        $("#projectInfoModal").LoadingOverlay("show");

        fetch(ENDPOINT_URL.PROJECT_INFO, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ "projectCode": $(this).attr("data-valkey") })
        }).then(response => {
            $("#projectInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                bindViewModelToModal(viewModel.data);
                $("#projectInfoModal").modal("show");
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    function promptDelete() {
        Swal.fire({
            title: "ยืนยันรายการ",
            text: "ข้อมูลกล่องควบคุมและหลอดไฟ ที่ทำงานร่วมกับโครงการนี้จะถูกลบทั้งหมด\r\nลบโครงการ \"" + $(this).attr("data-valkey") + "\" ออกจากระบบ?",
            icon: "question",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "ลบ",
            showCancelButton: true,
            cancelButtonColor: "#d33",
            cancelButtonText: "ยกเลิก"
        }).then((result) => {
            if (result.isConfirmed) {
                $.LoadingOverlay("show");

                fetch(ENDPOINT_URL.PROJECT_DELETE, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({ "projectCode": $(this).attr("data-valkey") })
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
                            getProjectData($("#bottomPagination").twbsPagination("getCurrentPage"), $("#searchText").val(), $("#filterProjectType option:selected").val())
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
    }

    $("#province").change(function () {
        getDistrictData($("#province option:selected").val(), "");
    });

    $("#district").change(function () {
        getSubDistrictData($("#district option:selected").val(), "")
    });

    $("#subdistrict").change(function () {
        $("#postCode").val($("#subdistrict option:selected").attr("val-postcode"));
    });

    $(".modal-state-create").on("click", function (e) {
        modalState = MODAL_STATE.CREATE;
        $("#projectInfoModalLongTitle").text("เพิ่มโครงการใหม่");
        $("#projectCode").val("#####");
    });

    $("#modal-save-button").on("click", function (e) {
        if (!validateProjectData()) {
            return;
        }

        $("#projectInfoModal").LoadingOverlay("show");

        let postToUrl;
        switch (modalState) {
            case MODAL_STATE.CREATE:
                postToUrl = ENDPOINT_URL.PROJECT_CREATE;
                break;
            case MODAL_STATE.UPDATE:
                postToUrl = ENDPOINT_URL.PROJECT_UPDATE;
                break;
        };

        let reqData = {
            projectCode: $("#projectCode").val(),
            projectName: $("#projectName").val(),
            projectAddress: $("#projectAddress").val(),
            projectType: $("#projectType option:selected").val(),
            subDistrictCode: $("#subdistrict option:selected").val(),
            lineToken1: $("#lineToken_1").val(),
            lineToken2: $("#lineToken_2").val(),
        };

        fetch(postToUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(reqData)
        }).then(response => {
            $("#projectInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                $("#projectInfoModal").modal("hide");

                Swal.fire({
                    title: viewModel.title,
                    text: viewModel.message,
                    icon: viewModel.state,
                    confirmButtonColor: "#3085d6"
                }).then((result) => {
                    getProjectData($("#bottomPagination").twbsPagination("getCurrentPage"), $("#searchText").val(), $("#filterProjectType option:selected").val())
                });
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    });

    $("#projectInfoModal").on("hidden.bs.modal", function (e) {
        $("#projectCode").val("");
        $("#projectName").val("");
        $("#projectAddress").val("");
        $("#projectType").val("");
        $("#projectType").prop("disabled", false);
        $("#province").val("");
        $("#lineToken_1").val("");
        $("#lineToken_2").val("");
        resetDistrictDropDown();
        resetSubDistrictDropDown();

        $("#projectCode").removeClass("is-invalid")
        $("#projectName").removeClass("is-invalid")
        $("#projectAddress").removeClass("is-invalid")
        $("#projectType").removeClass("is-invalid")
        $("#province").removeClass("is-invalid")
        $("#district").removeClass("is-invalid")
        $("#subdistrict").removeClass("is-invalid")
        $("#lineToken_1").removeClass("is-invalid")
        $("#lineToken_2").removeClass("is-invalid")
    });

    $("#searchText").keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $("#searchSubmit").click();
        }
    });

    $("#searchSubmit").on("click", function (e) {
        getProjectData(1, $("#searchText").val(), $("#filterProjectType option:selected").val());
    });

    $("#filterProjectType").change(function () {
        getProjectData(1, $("#searchText").val(), $("#filterProjectType option:selected").val());
    });

});