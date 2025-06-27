$(document).ready(function () {
    let lampStatusChart;
    let jobStatusChart;
    let emmStatusChart;

    getProjectData();
    getLampStatusDashboardData();
    getJobStatusDashboardData();
    getEMMStatusDashboardData();

    $("#weatherImage").LoadingOverlay("show");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getWeatherDashboardData);
    } else {
        console.log("Geolocation is not supported by this browser.")
    }

    async function getWeatherDashboardData(position) {
        $("#weatherDashboardTitle").text("พิกัด " + position.coords.latitude.toString() + ", " + position.coords.longitude.toString());

        data = {
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
        }

        await fetch(ENDPOINT_URL.DASHBOARD_WEATHER, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ "location": data })
        }).then(response => {
            $("#weatherImage").LoadingOverlay("hide");
            return response.json();
        }).then(result => {
            if (!result.error) {
                let weatherData = JSON.parse(JSON.stringify(result));
                bindingWeatherData(weatherData.data);
            } else {
                showError(result.error);
            }
        }).catch(error => {
            showError(error.message);
        });
    }

    async function getLampStatusDashboardData(projectCode) {
        try {
            $("#lampStatusChart").LoadingOverlay("show");

            await fetch(ENDPOINT_URL.DASHBOARD_LAMP, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({ "projectCode": projectCode })
            }).then(response => {
                $("#lampStatusChart").LoadingOverlay("hide");
                return response.json();
            }).then(result => {
                if (!result.error) {
                    let lampStatusData = JSON.parse(JSON.stringify(result));
                    bindingLampStatusChart(lampStatusData.data);
                } else {
                    showError(result.error);
                }
            }).catch(error => {
                showError(error.message);
            });
        } catch (err) {
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: err,
                icon: "error"
            });
        }
    };

    async function getJobStatusDashboardData(projectCode) {
        try {
            $("#jobStatusChart").LoadingOverlay("show");

            await fetch(ENDPOINT_URL.DASHBOARD_JOB, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({ "projectCode": projectCode })
            }).then(response => {
                $("#jobStatusChart").LoadingOverlay("hide");
                return response.json();
            }).then(result => {
                if (!result.error) {
                    let jobStatusData = JSON.parse(JSON.stringify(result));
                    bindingJobStatusChart(jobStatusData.data);
                } else {
                    showError(result.error);
                }
            }).catch(error => {
                showError(error.message);
            });
        } catch (err) {
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: err,
                icon: "error"
            });
        }
    };

    async function getEMMStatusDashboardData(projectCode) {
        try {
            $("#emmStatusChart").LoadingOverlay("show");

            await fetch(ENDPOINT_URL.DASHBOARD_EMM, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({ "projectCode": projectCode })
            }).then(response => {
                $("#emmStatusChart").LoadingOverlay("hide");
                return response.json();
            }).then(result => {
                if (!result.error) {
                    let emmStatusData = JSON.parse(JSON.stringify(result));
                    bindingEMMStatusChart(emmStatusData.data);
                } else {
                    showError(result.error);
                }
            }).catch(error => {
                showError(error.message);
            });
        } catch (err) {
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: err,
                icon: "error"
            });
        }
    };

    async function getProjectData() {
        try {
            $("#lampProjectFilter").LoadingOverlay("show");
            $("#jobProjectFilter").LoadingOverlay("show");
            $("#emmProjectFilter").LoadingOverlay("show");

            await fetch(ENDPOINT_URL.PROJECT_BY_CUSTOMER, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                }
            }).then(response => {
                $("#lampProjectFilter").LoadingOverlay("hide");
                $("#jobProjectFilter").LoadingOverlay("hide");
                $("#emmProjectFilter").LoadingOverlay("hide");
                return response.json();
            }).then(result => {
                if (!result.error) {
                    let projectData = JSON.parse(JSON.stringify(result));
                    bindingProjectDropdown(projectData.data);
                } else {
                    showError(result.error);
                }
            }).catch(error => {
                showError(error.message);
            });
        } catch (err) {
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: err,
                icon: "error"
            });
        }
    };

    function bindingLampStatusChart(data) {
        let labels = [];
        let lampOnData = [];
        let lampOffData = [];
        let lampUnreachableData = [];

        $.each(data, function (_, item) {
            labels.push(item.projectName);
            lampOnData.push(item.lampOn);
            lampOffData.push(item.lampOff);
            lampUnreachableData.push(item.lampUnreachable);
        });

        const dataSource = {
            labels: labels,
            datasets: [
                {
                    label: "ไฟติด",
                    backgroundColor: "rgb(255, 193, 0)",
                    borderColor: "rgb(255, 193, 0)",
                    data: lampOnData,
                },
                {
                    label: "ไฟดับ",
                    backgroundColor: "rgb(40, 47, 58)",
                    borderColor: "rgb(40, 47, 58)",
                    data: lampOffData,
                },
                {
                    label: "ติดต่อไม่ได้",
                    backgroundColor: "rgb(255, 71, 71)",
                    borderColor: "rgb(255, 71, 71)",
                    data: lampUnreachableData,
                }
            ]
        };

        const config = {
            type: "bar",
            data: dataSource,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top",
                    },
                    //title: {
                    //    display: true,
                    //    text: "Chart.js Bar Chart"
                    //}
                },
                scales: {
                    y: {
                        ticks: {
                            stepSize: 5,
                            beginAtZero: true,
                        }
                    }
                }
            }
        };

        if (lampStatusChart != null) {
            lampStatusChart.destroy();
        }
        
        lampStatusChart = new Chart($("#lampStatusChart"), config);
    };

    function bindingJobStatusChart(data) {
        let labels = [];
        let jobComplete = [];
        let jobNotComplete = [];

        $.each(data, function (_, item) {
            labels.push(item.projectName);
            jobComplete.push(item.completedJob);
            jobNotComplete.push(item.notCompletedJob);
        });

        const dataSource = {
            labels: labels,
            datasets: [
                {
                    label: "สำเร็จ",
                    backgroundColor: "rgb(113, 192, 22)",
                    borderColor: "rgb(113, 192, 22)",
                    data: jobComplete,
                }
                , {
                    label: "รอแก้ไข",
                    backgroundColor: "rgb(30, 51, 100)",
                    borderColor: "rgb(30, 51, 100)",
                    data: jobNotComplete,
                }
            ]
        };

        const config = {
            type: "bar",
            data: dataSource,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top",
                    },
                    //title: {
                    //    display: true,
                    //    text: "Chart.js Bar Chart"
                    //}
                },
                scales: {
                    y: {
                        ticks: {
                            stepSize: 5,
                            beginAtZero: true,
                        }
                    }
                }
            }
        };

        if (jobStatusChart != null) {
            jobStatusChart.destroy();
        }

        jobStatusChart = new Chart($("#jobStatusChart"), config);
    };

    function bindingEMMStatusChart(data) {
        let labels = [];
        let currentData = [];
        let voltageData = [];
        let powerData = [];

        $.each(data, function (_, item) {
            labels.push(item.controllerSerialNo);
            currentData.push(item.current);
            voltageData.push(item.voltage);
            powerData.push(item.power);
        });

        const dataSource = {
            labels: labels,
            datasets: [
                {
                    label: "ค่ากระแส",
                    backgroundColor: "rgb(255, 193, 0)",
                    borderColor: "rgb(255, 193, 0)",
                    data: currentData,
                },
                {
                    label: "ค่า Volt",
                    backgroundColor: "rgb(40, 47, 58)",
                    borderColor: "rgb(40, 47, 58)",
                    data: voltageData,
                },
                {
                    label: "ค่า Watt",
                    backgroundColor: "rgb(255, 71, 71)",
                    borderColor: "rgb(255, 71, 71)",
                    data: powerData,
                }
            ]
        };

        const config = {
            type: "bar",
            data: dataSource,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top",
                    },
                    //title: {
                    //    display: true,
                    //    text: "Chart.js Bar Chart"
                    //}
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };

        if (emmStatusChart != null) {
            emmStatusChart.destroy();
        }

        emmStatusChart = new Chart($("#emmStatusChart"), config);
    };

    function bindingProjectDropdown(data) {
        if (data.length > 0) {
            $.each(data, function (_, item) {
                $("#lampProjectFilter").append($("<option value=" + item.projectCode + " data-valkey=" + item.projectType + ">" + item.projectName + "</option>"));
                $("#jobProjectFilter").append($("<option value=" + item.projectCode + " data-valkey=" + item.projectType + ">" + item.projectName + "</option>"));
                $("#emmProjectFilter").append($("<option value=" + item.projectCode + " data-valkey=" + item.projectType + ">" + item.projectName + "</option>"));
            });
        } else {
            $("#lampProjectFilter").append("<option selected disabled value=''>ไม่มีข้อมูล</option>");
            $("#jobProjectFilter").append("<option selected disabled value=''>ไม่มีข้อมูล</option>");
            $("#emmProjectFilter").append("<option selected disabled value=''>ไม่มีข้อมูล</option>");
        }
    };

    function bindingWeatherData(data) {
        $("#weatherImage").attr('src', data.imgPath);
        $("#weatherStatus").text(data.weatherStatus);
        $("#highTemp").text("อุณหภูมิสูงสุด " + data.highTemp);
        $("#lowTemp").text("อุณหภูมิต่ำสุด " + data.lowTemp);
    }

    $("#lampProjectFilter").change(function (e) {
        getLampStatusDashboardData($(this).val());
    });

    $("#jobProjectFilter").change(function (e) {
        getJobStatusDashboardData($(this).val());
    });

    $("#emmProjectFilter").change(function (e) {
        getEMMStatusDashboardData($(this).val());
    });

});