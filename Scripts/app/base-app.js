const FETCH_METHOD = {
    GET: "GET",
    POST: "POST"
};

const MODAL_STATE = {
    CREATE: "create",
    UPDATE: "update"
};

const ENDPOINT_URL = {
    ADDRESS_PROVINCE: "/smartlighting/Address/getProvince",
    ADDRESS_DISTRICT: "/smartlighting/Address/getDistrictByProvinceCode",
    ADDRESS_SUBDISTRICT: "/smartlighting/Address/getSubDistrictByDistrictCode",

    PROJECT_BY_CUSTOMER: "/smartlighting/Project/getProjectListByCustomer",
    CONTROLLER_BY_PROJECT: "/smartlighting/Device/getControllerListByProject",
    LAMP_BY_CONTROLLER: "/smartlighting/Lamp/getLampListByController",

    LOGIN: "/smartlighting/Login/Index",

    DASHBOARD_LAMP: "/smartlighting/Home/getLampStatusDashboardData",
    DASHBOARD_JOB: "/smartlighting/Home/getJobStatusDashboardData",
    DASHBOARD_EMM: "/smartlighting/Home/getEMMStatusDashboardData",
    DASHBOARD_WEATHER: "/smartlighting/Home/getWeatherDashboardData",

    USER_CREATE: "/smartlighting/User/Create",
    USER_UPDATE: "/smartlighting/User/Update",
    USER_INFO: "/smartlighting/User/Info",
    USER_DELETE: "/smartlighting/User/Delete",
    USER_LIST: "/smartlighting/User/getUserOnPagedList",

    PROJECT_CREATE: "/smartlighting/Project/Create",
    PROJECT_UPDATE: "/smartlighting/Project/Update",
    PROJECT_INFO: "/smartlighting/Project/Info",
    PROJECT_DELETE: "/smartlighting/Project/Delete",
    PROJECT_LIST: "/smartlighting/Project/getProjectOnPagedList",

    CONTROLLER_CREATE: "/smartlighting/Device/Create",
    CONTROLLER_UPDATE: "/smartlighting/Device/Update",
    CONTROLLER_INFO: "/smartlighting/Device/Info",
    CONTROLLER_DELETE: "/smartlighting/Device/Delete",
    CONTROLLER_LIST: "/smartlighting/Device/getControllerOnPagedList",

    LAMP_CREATE: "/smartlighting/Lamp/Create",
    LAMP_UPDATE: "/smartlighting/Lamp/Update",
    LAMP_INFO: "/smartlighting/Lamp/Info",
    LAMP_DELETE: "/smartlighting/Lamp/Delete",
    LAMP_LIST: "/smartlighting/Lamp/getLampOnPagedList",
    LAMP_STATUS: "/smartlighting/Lamp/getLampStatus",
    LAMP_GroupList:"/smartlighting/Lamp/getLampGroupList",

    JOB_CREATE: "/smartlighting/Job/Create",
    JOB_UPDATE: "/smartlighting/Job/Update",
    JOB_INFO: "/smartlighting/Job/Info",
    JOB_DELETE: "/smartlighting/Job/Delete",
    JOB_LIST: "/smartlighting/Job/getJobOnPagedList",

    DATA_FOR_MAPS: "/smartlighting/Maps/getDataToPaintOnMaps",

    MQTTCLIENT_ENDPOINT: "/smartlighting/Config/getMqttPublisherEndpoint"
   
};

const MQTT_PUBLISHER_ACTION = {
    //relate to ../MQTTClient/endpoint.json
    MODE_CHANGE: "MODE_CHANGE",
    MANUAL: "MANUAL",
    SET_SCHEDULE: "SET_SCHEDULE"
};

const MQTT_MODE = {
    DEBUG: -1,
    CONFIG: 0,
    MANUAL: 1,
    SET_SCHEDULE: 2,
    AMBIENT_LIGHT: 3,
    SCHEDULER_WITH_AMBIENT_LIGHT: 4
}

const MQTT_CONNECT = {
    clientHost: "10.12.12.204",
    clientPort: "1883",
    clientCredUser: "nwl",
    clientCredPassword: "123456",
    topicLevel: "S",
    topicProduct: "BRI",
    topicModel: "Node301",
    topicGroup: "APL",
}

const MQTT_CMD = {
    MANUAL: 0,
    CHANGE_MODE: 1,
    SET_SCHEDULE: 2,
    SET_INFO: 3,
    GET_INFO: 10,
    GET_SCHEDULE: 11,
    RESTART: 99,
    FACTORY_RESET: 777
}

function showDialog(state, title, message) {
    Swal.fire({
        title: title,
        html: message,
        icon: state
    });
};

function numberInputValidate(e) {
    let keyCode = (e.which) ? e.which : e.keyCode
    if (String.fromCharCode(keyCode).match(/[^0-9]/g)) {
        return false;
    } else {
        return true;
    }
};