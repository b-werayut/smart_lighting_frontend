$(document).ready(function () {
    bindButtonByPermission();
    getUserData(1, "");

    //-----------------------------------------------

    var modalState = MODAL_STATE.CREATE;

    //-----------------------------------------------

    var defaultPagingOptions = {
        onPageClick: function (e, page) {
            getUserData(page, $("#searchText").val());
        }
    };

    //-----------------------------------------------

    function bindButtonByPermission() {
        if ($("#parentRole").attr("data-valkey") == "1") {
            $("#buttonNewUser").addClass("invisible");
            $("#modal-save-button").addClass("d-none");
        }
    };

    function getUserData(currentPage, searchText) {
        $("#no-more-tables").LoadingOverlay("show");

        currentPage = typeof currentPage == "number" ? currentPage : 1;

        let reqData = {
            page: currentPage,
            searchText: searchText
        };

        fetch(ENDPOINT_URL.USER_LIST, {
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
                let userCodeCol = jQuery("<td></td>").attr("data-title", "รหัสผู้ใช้").html(item.userCode).appendTo(tableRow);
                let userNameCol = jQuery("<td></td>").attr("data-title", "ชื่อผู้ใช้").html("<span class='d-inline-block text-truncate' style='max-width:400px;'>" + item.userName + "</span>").appendTo(tableRow);
                let roleCol = jQuery("<td></td>").attr("data-title", "สิทธิ์").html(item.roleName).appendTo(tableRow);

                let buttonCol = jQuery("<td></td>").appendTo(tableRow);

                let buttonArea = jQuery("<div></div>", {
                    class: "d-flex justify-content-end flex-wrap"
                }).appendTo(buttonCol);

                let editButton = jQuery("<button></button>", {
                    type: "button",
                    class: "btn btn-light btn-icon ml-3"
                })
                    .attr("data-valkey", item.userCode).html("<i class=\"mdi mdi-pencil\"></i>")
                    .on("click", showInfoModalEditMode)
                    .appendTo(buttonArea);
                editButton.tooltip({ title: "แก้ไขข้อมูล", boundary: "window", placement: "left" });

                if ($("#parentRole").attr("data-valkey") != "1") {

                    let deleteButton = jQuery("<button></button>", {
                        type: "button",
                        class: "btn btn-light btn-icon ml-3"
                    })
                        .attr("data-valkey", item.userCode)
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

    function bindViewModelToModal(viewModel) {
        $("#userCode").val(viewModel.userCode);
        $("#userCode").prop("disabled", true);

        $("#userName").val(viewModel.userName);
        $("#userPassword").val(viewModel.password);
        $("#customerRole").val(viewModel.role).change();
    };

    function validateUserData() {
        let isValid = true;

        if (!$("#userCode").val().trim()) {
            $("#userCode").addClass("is-invalid");
            isValid = false;
        } else {
            var regex = new RegExp("^[a-zA-Z0-9 ]+$");
            if (!regex.test($("#userCode").val().trim())) {
                $("#userCode").addClass("is-invalid");
                isValid = false;
            }
        }

        if (!$("#userName").val().trim()) {
            $("#userName").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#userPassword").val().trim()) {
            $("#userPassword").addClass("is-invalid");
            isValid = false;
        }

        if (!$("#customerRole option:selected").val().trim()) {
            $("#customerRole").addClass("is-invalid");
            isValid = false;
        }

        return isValid;
    };

    function showInfoModalEditMode() {
        modalState = MODAL_STATE.UPDATE;

        $("#userInfoModalLongTitle").text("ข้อมูลผู้ใช้");
        $("#userInfoModal").LoadingOverlay("show");

        fetch(ENDPOINT_URL.USER_INFO, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ "userCode": $(this).attr("data-valkey") })
        }).then(response => {
            $("#userInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                bindViewModelToModal(viewModel.data);
                $("#userInfoModal").modal("show");
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
            text: "ลบผู้ใช้ \"" + $(this).attr("data-valkey") + "\" ออกจากระบบ?",
            icon: "question",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "ลบ",
            showCancelButton: true,
            cancelButtonColor: "#d33",
            cancelButtonText: "ยกเลิก"
        }).then((result) => {
            if (result.isConfirmed) {
                $.LoadingOverlay("show");

                fetch(ENDPOINT_URL.USER_DELETE, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    body: JSON.stringify({ "userCode": $(this).attr("data-valkey") })
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
                            getUserData($("#bottomPagination").twbsPagination("getCurrentPage"), $("#searchText").val())
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

    $("#userCode").keypress(function (e) {
        var regex = new RegExp("^[a-zA-Z0-9 ]+$");
        var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
        if (regex.test(str)) return true;
        e.preventDefault();
        return false;
    });

    $(".modal-state-create").on("click", function (e) {
        modalState = MODAL_STATE.CREATE;
        $("#userInfoModalLongTitle").text("เพิ่มผู้ใช้ใหม่");
    });

    $("#modal-save-button").on("click", function (e) {
        if (!validateUserData()) {
            return;
        }

        $("#userInfoModal").LoadingOverlay("show");

        let postToUrl;
        switch (modalState) {
            case MODAL_STATE.CREATE:
                postToUrl = ENDPOINT_URL.USER_CREATE;
                break;
            case MODAL_STATE.UPDATE:
                postToUrl = ENDPOINT_URL.USER_UPDATE;
                break;
        };

        let reqData = {
            userCode: $("#userCode").val(),
            userName: $("#userName").val(),
            password: $("#userPassword").val(),
            role: $("#customerRole option:selected").val(),
        };

        fetch(postToUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(reqData)
        }).then(response => {
            $("#userInfoModal").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                $("#userInfoModal").modal("hide");

                Swal.fire({
                    title: viewModel.title,
                    text: viewModel.message,
                    icon: viewModel.state,
                    confirmButtonColor: "#3085d6"
                }).then((result) => {
                    getUserData($("#bottomPagination").twbsPagination("getCurrentPage"), $("#searchText").val())
                });
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    });

    $("#userInfoModal").on("hidden.bs.modal", function (e) {
        $("#userCode").val("");
        $("#userName").val("");
        $("#userPassword").val("");
        $("#customerRole").val("");

        $("#userCode").prop("disabled", false);
        $("#userCode").removeClass("is-invalid")
        $("#userName").removeClass("is-invalid")
        $("#userPassword").removeClass("is-invalid")
        $("#customerRole").removeClass("is-invalid")
    });

    $("#searchText").keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $("#searchSubmit").click();
        }
    });

    $("#searchSubmit").on("click", function (e) {
        getUserData(1, $("#searchText").val());
    });
});