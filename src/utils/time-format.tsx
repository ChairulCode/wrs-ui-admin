import moment from "moment";

moment.locale("id");
type format = "HH:mm" | "HH:mm:ss" | "HH:mm:ss.SSS" | "HH:mm:ss.SSSSSS" | "DD MMMM yyyy" | "dd-MM-yyyy HH:mm:ss" | "DD/MM/yyyy - HH:mm:ss";

export const formatTime = (time: string, format: format) => moment(time).format(format);
