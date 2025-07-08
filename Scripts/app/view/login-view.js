$(document).ready(function () {
    $('#loginModal').modal({ backdrop: 'static', keyboard: false });

    $("#loginModal").on("shown.bs.modal", function (e) {
        $("#usercode").focus();
    });

    $("#usercode").keypress(function (e) {
        var keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == "13") {
            $("#password").focus();
        }
    });

    $("#password").keypress(function (e) {
        var keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == "13") {
            $("#loginButton").click();
        }
    });

    $("#loginButton").on("click", function (e) {
        if (!validateLoginData()) {
            showDialog("warning", "แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        let loginData = {
            usercode: $("#usercode").val(),
            password: $("#password").val()
        };

        $.LoadingOverlay("show");

        fetch(ENDPOINT_URL.LOGIN, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(loginData)
        }).then(response => {
            $.LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            let viewModel = JSON.parse(JSON.stringify(result));

            if (viewModel.state == "success") {
                window.location.replace("/Home");
            } else {
                showDialog(viewModel.state, viewModel.title, viewModel.message);
            }
        }).catch(error => {
            console.log(error.message);
            showDialog("error", "เกิดข้อผิดพลาด", "กรุณาติดต่อผู้ดูแลระบบ");
        });
    });

    function validateLoginData() {
        let isValid = true;

        if (!$("#usercode").val().trim() || !$("#password").val().trim()) {
            isValid = false;
        }

        return isValid;
    }
});