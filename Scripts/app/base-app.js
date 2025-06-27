const FETCH_METHOD = {
    GET: "GET",
    POST: "POST"
};

const MODAL_STATE = {
    CREATE: "create",
    UPDATE: "update"
};

const ENDPOINT_URL = {
    ADDRESS_PROVINCE: "/Address/getProvince",
    ADDRESS_DISTRICT: "/Address/getDistrictByProvinceCode",
    ADDRESS_SUBDISTRICT: "/Address/getSubDistrictByDistrictCode",

    PROJECT_BY_CUSTOMER: "/Project/getProjectListByCustomer",
    CONTROLLER_BY_PROJECT: "/Device/getControllerListByProject",
    LAMP_BY_CONTROLLER: "/Lamp/getLampListByController",

    LOGIN: "/Login/Index",

    DASHBOARD_LAMP: "/Home/getLampStatusDashboardData",
    DASHBOARD_JOB: "/Home/getJobStatusDashboardData",
    DASHBOARD_EMM: "/Home/getEMMStatusDashboardData",
    DASHBOARD_WEATHER: "/Home/getWeatherDashboardData",

    USER_CREATE: "/User/Create",
    USER_UPDATE: "/User/Update",
    USER_INFO: "/User/Info",
    USER_DELETE: "/User/Delete",
    USER_LIST: "/User/getUserOnPagedList",

    PROJECT_CREATE: "/Project/Create",
    PROJECT_UPDATE: "/Project/Update",
    PROJECT_INFO: "/Project/Info",
    PROJECT_DELETE: "/Project/Delete",
    PROJECT_LIST: "/Project/getProjectOnPagedList",

    CONTROLLER_CREATE: "/Device/Create",
    CONTROLLER_UPDATE: "/Device/Update",
    CONTROLLER_INFO: "/Device/Info",
    CONTROLLER_DELETE: "/Device/Delete",
    CONTROLLER_LIST: "/Device/getControllerOnPagedList",

    LAMP_CREATE: "/Lamp/Create",
    LAMP_UPDATE: "/Lamp/Update",
    LAMP_INFO: "/Lamp/Info",
    LAMP_DELETE: "/Lamp/Delete",
    LAMP_LIST: "/Lamp/getLampOnPagedList",
    LAMP_STATUS: "/Lamp/getLampStatus",

    JOB_CREATE: "/Job/Create",
    JOB_UPDATE: "/Job/Update",
    JOB_INFO: "/Job/Info",
    JOB_DELETE: "/Job/Delete",
    JOB_LIST: "/Job/getJobOnPagedList",

    DATA_FOR_MAPS: "/Maps/getDataToPaintOnMaps",

    MQTTCLIENT_ENDPOINT: "/Config/getMqttPublisherEndpoint"
   
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