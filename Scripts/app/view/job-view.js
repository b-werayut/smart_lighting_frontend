$(document).ready(function () {
    bindButtonByPermission();

    //-----------------------------------------------

    var modalState = MODAL_STATE.CREATE;

    //-----------------------------------------------

    var defaultPagingOptions = {
        onPageClick: function (e, page) {
            getJobData(page, $("#searchText").val(), $("#filterProjectCode option:selected").val());
        }
    };

    //-----------------------------------------------

    function bindButtonByPermission() {
        if ($("#parentRole").attr("data-valkey") == "1") {
            $("#buttonNewJob").addClass("invisible");
            $("#modal-save-button").addClass("d-none");
        }
    }

    $("#problemTime").datetimepicker({
        locale: "th",
        format: "yyyy/MM/DD HH:mm:ss",
    });

    $("#resolveTime").datetimepicker({
        locale: "th",
        format: "yyyy/MM/DD HH:mm:ss",
    });


    getFilterProjectData();
    getJobData(1, "", $("#filterProjectCode option:selected").val());
    
    function validateData() {
        let isValid = true;

        if (!$("#projectCode option:selected").val().trim()) {
            $("#projectCode").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#controllerCode option:selected").val().trim() && !$("#lampCode option:selected").val().trim()) {
            $("#controllerCode").addClass("is-invalid");
            $("#lampCode").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#jobProblem").val().trim()) {
            $("#jobProblem").addClass("is-invalid");
            isValid = false;
        }

        if (modalState == MODAL_STATE.UPDATE) {
            if (!$("#jobResolve").val().trim()) {
                $("#jobResolve").addClass("is-invalid");
                isValid = false;
            }

            if (!$("#isComplete option:selected").val().trim()) {
                $("#isComplete").addClass("is-invalid");
                isValid = false;
            }
        }

        return isValid;
    };

    async function getJobData(currentPage, searchText, projectCode) {
        $("#no-more-tables").LoadingOverlay("show");

        currentPage = typeof currentPage == "number" ? currentPage : 1;

        let jobData = {
            page: currentPage,
            searchText: searchText,
            projectCode: projectCode
        };
     
        fetch(ENDPOINT_URL.JOB_LIST, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(jobData)
        }).then(response => {
            $("#no-more-tables").LoadingOverlay("hide");
           
            return response.json();
        }).then(result => {
          
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                if (currentPage > viewModel.pagingTotalPage) {
                    currentPage = viewModel.pagingTotalPage;
                }
               
                bindingJobTable(viewModel.data, viewModel.pagingTotalPage, currentPage);
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    async function getDataByAsync(projectCode, controllerCode, lampCode) {
        await getProjectData(projectCode);
        await getControllerData(projectCode, controllerCode)
        await getLampData(controllerCode, lampCode);
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
                resetProjectDropDown();
                bindingProjectDropdown(viewModel.data);
                if (viewModel.data.length > 0) {
                    if (selectProjectCode.trim().length > 0) {
                        $("#projectCode").val(selectProjectCode);
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

    async function getControllerData(projectCode, selectControllerCode) {
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
                resetLampDropDown();
                bindingControllerDropdown(viewModel.data);

                if (selectControllerCode.trim().length > 0) {
                    $("#controllerCode").val(selectControllerCode);
                }
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    async function getLampData(controllerCode, selectLampCode) {
        $("#lampCode").LoadingOverlay("show");

        let lampData = {
            controllerCode: controllerCode
        };

        fetch(ENDPOINT_URL.LAMP_BY_CONTROLLER, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(lampData)
        }).then(response => {
            $("#lampCode").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                resetLampDropDown();
                bindingLampDropdown(viewModel.data);

                if (selectLampCode.trim().length > 0) {
                    $("#lampCode").val(selectLampCode);
                }
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    async function getFilterProjectData() {
        $("#filterProjectCode").LoadingOverlay("show");

        await fetch(ENDPOINT_URL.PROJECT_BY_CUSTOMER, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }).then(response => {
            $("#filterProjectCode").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                bindingFilterProjectDropdown(viewModel.data);
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    };

    function bindingJobTable(jsonJob, totalPage, currentPage) {
        
        let tableBody = $("#no-more-tables tbody")
        tableBody.empty();

        let colSpan = 6;
        if (jsonJob.length == 0) {
            tableBody.append("<tr><td colspan=\"" + colSpan + "\">ไม่มีข้อมูล</td></tr>");
        } else {
            
            $.each(jsonJob, function (_, item) {
               
                let tableRow = jQuery("<tr></tr>");
                let jobDocNo = jQuery("<td></td>").attr("data-title", "เลขที่งาน").html(item.jobDocNo).appendTo(tableRow);
                let problemTime = jQuery("<td></td>").attr("data-title", "วันที่แจ้งงาน").html(item.problemTime).appendTo(tableRow);
                let projectName = jQuery("<td></td>").attr("data-title", "โครงการ").html(item.projectName).appendTo(tableRow);
                let jobProblem = jQuery("<td></td>").attr("data-title", "รายละเอียดปัญหา").html(item.jobProblem).appendTo(tableRow);
                let jobProblem2 = jQuery("<td></td>").attr("data-title", "วิธีแก้ไข").html(item.jobResolv).appendTo(tableRow);
             
              

                let docStatusBadge;
                if (item.docStatus == "1") {
                    docStatusBadge = "badge-primary";
                } else {
                    docStatusBadge = "badge-success";
                }

                let badgeHtml = "<span class=\"badge badge-pill " + docStatusBadge + "\">" + item.docStatusText + "</span>";
                let docStatus = jQuery("<td></td>").attr("data-title", "สถานะ").html(badgeHtml).appendTo(tableRow);

                let buttonCol = jQuery("<td></td>").appendTo(tableRow);

                let buttonArea = jQuery("<div></div>", {
                    class: "d-flex justify-content-end flex-wrap"
                }).appendTo(buttonCol);
               
                let lampButton = jQuery("<button></button>", {
                    type: "button",
                    class: "btn btn-light btn-icon"
                })
                    .attr("data-valkey", item.jobDocNo)
                    .on("click", showJobModalInEditMode)
                    .html("<i class=\"mdi mdi-comment-processing\"></i>")
                    .appendTo(buttonArea);
                lampButton.tooltip({ title: "รายละเอียด", boundary: "window", placement: "left" });

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

    function bindingProjectDropdown(jsonProject) {
        if (jsonProject.length > 0) {
            $.each(jsonProject, function (_, item) {
                $("#projectCode").append($("<option value=" + item.projectCode + " data-valkey=" + item.projectType + ">" + item.projectName + "</option>"));
            });
        } else {
            $("#projectCode").append("<option selected disabled value=''>ไม่มีข้อมูล</option>");
        }
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

    function bindingLampDropdown(jsonLamp) {
        if (jsonLamp.length > 0) {
            $.each(jsonLamp, function (_, item) {
                $("#lampCode").append($("<option value=" + item.lampCode + ">" + item.lampName + "</option>"));
            });
        } else {
            $("#lampCode").append("<option selected disabled value=''>ไม่มีข้อมูล</option>");
        }
    };

    function bindingFilterProjectDropdown(jsonProject) {
        if (jsonProject.length > 0) {
            $.each(jsonProject, function (_, item) {
                $("#filterProjectCode").append($("<option value=" + item.projectCode + " data-valkey=" + item.projectType + ">" + item.projectName + "</option>"));
            });
        } else {
            $("#filterProjectCode")
                .empty()
                .append("<option selected disabled value=''>ไม่มีข้อมูล</option>");
        }
    };

    function resetProjectDropDown() {
        $("#projectCode")
            .empty()
            .append("<option selected disabled value=''>...</option>");
    }

    function resetControllerDropDown() {
        $("#controllerCode")
            .empty()
            .append("<option selected disabled value=''>...</option>");
    };

    function resetLampDropDown() {
        $("#lampCode")
            .empty()
            .append("<option selected disabled value=''>...</option>");
    };

    function destroyPaging() {
        if ($("#bottomPagination").data("twbs-pagination")) {
            $("#bottomPagination").twbsPagination("destroy");
        }
    };

    function showJobModalInEditMode() {
        modalState = MODAL_STATE.UPDATE;

        $("#jobInfoModalLongTitle").text("รายละเอียดงานซ่อม");
        $("#jobInfoModal").LoadingOverlay("show");

        fetch(ENDPOINT_URL.JOB_INFO, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ "jobCode": $(this).attr("data-valkey") })
        }).then(response => {
            $("#jobInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                bindjobViewModelToModal(viewModel.data);
                $("#jobInfoModal").modal("show");
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    }

    function bindjobViewModelToModal(viewModel) {
        getDataByAsync(viewModel.projectCode, viewModel.controllerCode, viewModel.lampCode);

        $("#jobDocNo").val(viewModel.jobDocNo);
        $("#problemTime").datetimepicker("date", moment(viewModel.problemTime));
        $("#jobProblem").val(viewModel.jobProblem);
        $("#docStatus").val(viewModel.docStatusText);

        $("#projectCode").prop("disabled", true);
        $("#controllerCode").prop("disabled", true);
        $("#lampCode").prop("disabled", true);
        $("#jobProblem").prop("disabled", true);

        $("#jobResolve").val(viewModel.jobResolve);
        $("#engineerName").val(viewModel.engineerName);

        if (viewModel.resolveTime != null) {
            $("#resolveTime").datetimepicker("date", moment(viewModel.resolveTime));
        } else {
            $("#resolveTime").datetimepicker("date", moment());
        }

        if (viewModel.isComplete != null) {
            $("#isComplete").val(viewModel.isComplete.toString());
        }

        //--------------------------------

        $("#docStatus").removeClass("btn-outline-secondary");
        if (viewModel.docStatus == "1") {
            $("#docStatus").addClass("btn-outline-primary");

            if ($("#resolveSection").attr("data-valkey") == "3" || $("#resolveSection").attr("data-valkey") == "2") {
                if ($("#modal-save-button").hasClass("d-none")) {
                    $("#modal-save-button").removeClass("d-none");
                }
            } else {
                if (!$("#modal-save-button").hasClass("d-none")) {
                    $("#modal-save-button").addClass("d-none");
                }
            }
        } else {
            $("#docStatus").addClass("btn-outline-success");

            $("#jobResolve").prop("disabled", true);
            $("#isComplete").prop("disabled", true);

            if (!$("#modal-save-button").hasClass("d-none")) {
                $("#modal-save-button").addClass("d-none");
            }
        }

        //--------------------------------

        if (viewModel.docStatus == "2" || $("#resolveSection").attr("data-valkey") == "2" || $("#resolveSection").attr("data-valkey") == "3") {
            if ($("#resolveSection").hasClass("d-none")) {
                $("#resolveSection").removeClass("d-none");
            }
        }
    }

    $(".modal-state-create").on("click", function (e) {
        modalState = MODAL_STATE.CREATE;

        $("#jobInfoModalLongTitle").text("แจ้งงานซ่อมใหม่");
        $("#jobDocNo").val("#####");
        $("#docStatus").val("ยังไม่บันทึก");
        $("#problemTime").datetimepicker("date", moment());

        if ($("#docStatus").hasClass("btn-outline-secondary")) {
            $("#docStatus").addClass("btn-outline-secondary");
        }

        getProjectData("");
    });

    $("#jobInfoModal").on("shown.bs.modal", function (e) { 
        if (modalState == MODAL_STATE.CREATE) {
            resetControllerDropDown();
            resetLampDropDown();
        }
    });

    $("#modal-save-button").on("click", function (e) {
        if (!validateData()) {
            return;
        }

        $("#jobInfoModal").LoadingOverlay("show");

        let postToUrl;
        switch (modalState) {
            case MODAL_STATE.CREATE:
                postToUrl = ENDPOINT_URL.JOB_CREATE;
                break;
            case MODAL_STATE.UPDATE:
                postToUrl = ENDPOINT_URL.JOB_UPDATE;
                break;
        };

        let jobData = {
            jobDocNo: $("#jobDocNo").val(),
            projectCode: $("#projectCode option:selected").val(),
            problemTime: $("#problemTime").val(),
            controllerCode: $("#controllerCode option:selected").val(),
            lampCode: $("#lampCode option:selected").val(),
            jobProblem: $("#jobProblem").val(),
            jobResolve: $("#jobResolve").val(),
            resolveTime: $("#resolveTime").val(),
            isComplete: $("#isComplete option:selected").val()
        };

        fetch(postToUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(jobData)
        }).then(response => {
            $("#jobInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                $("#jobInfoModal").modal("hide");
            }

            Swal.fire({
                title: viewModel.title,
                text: viewModel.message,
                icon: viewModel.state,
                confirmButtonColor: "#3085d6"
            }).then((result) => {
                if (viewModel.state == "success") {
                    getJobData($("#bottomPagination").twbsPagination("getCurrentPage"), $("#searchText").val(), $("#filterProjectCode option:selected").val());
                }
            });
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    });

    $("#jobInfoModal").on("hidden.bs.modal", function (e) {
        resetProjectDropDown();
        resetControllerDropDown();
        resetLampDropDown();

        $("#problemTime").val("");
        $("#docStatus").val("");
        $("#projectCode").val("");
        $("#controllerCode").val("");
        $("#lampCode").val("");
        $("#jobProblem").val("");
        $("#jobResolve").val("");
        $("#engineerName").val("");
        $("#resolveTime").val("");
        $("#isComplete").val("");

        $("#projectCode").prop("disabled", false);
        $("#controllerCode").prop("disabled", false);
        $("#lampCode").prop("disabled", false);
        $("#jobProblem").prop("disabled", false);
        $("#jobResolve").prop("disabled", false);
        $("#isComplete").prop("disabled", false);

        $("#projectCode").removeClass("is-invalid");
        $("#controllerCode").removeClass("is-invalid");
        $("#lampCode").removeClass("is-invalid");
        $("#jobProblem").removeClass("is-invalid");
        $("#jobResolve").removeClass("is-invalid");
        $("#resolveTime").removeClass("is-invalid");
        $("#isComplete").removeClass("is-invalid");

        if (!$("#resolveSection").hasClass("d-none")) {
            $("#resolveSection").addClass("d-none")
        }

        if ($("#modal-save-button").hasClass("d-none")) {
            $("#modal-save-button").removeClass("d-none");
        }
        
        if ($("#docStatus").hasClass("btn-outline-primary")) {
            $("#docStatus").removeClass("btn-outline-primary");
        }

        if ($("#docStatus").hasClass("btn-outline-success")) {
            $("#docStatus").removeClass("btn-outline-success");
        }

        if (!$("#docStatus").hasClass("btn-outline-success")) {
            $("#docStatus").addClass("btn-outline-secondary");
        }

    });

    $("#projectCode").change(function (e) {
        getControllerData($("#projectCode option:selected").val(), "");
    });

    $("#controllerCode").change(function (e) {
        if ($("#projectCode option:selected").attr("data-valkey") != "2") {
            getLampData($("#controllerCode option:selected").val(), "");
        } else {
            $("#lampCode").append("<option selected disabled value=''>เนื่องจากโครงการนี้ใช้กล่องควบคุมประเภท EMM จึงไม่สามารถเลือกหลอดไฟได้</option>");
        }
    });

    $("#searchText").keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == "13") {
            $("#searchSubmit").click();
        }
    });

    $("#searchSubmit").on("click", function (e) {
        getJobData(1, $("#searchText").val(), $("#filterProjectCode option:selected").val());
    });

    $("#filterProjectCode").change(function () {
        getJobData(1, $("#jobsearchText").val(), $("#filterProjectCode option:selected").val());
    });

});