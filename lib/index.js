const moment = require("moment");
function startToEndTimeSlot(opentimes, closetimes,data={}){
    let duration = isEmpty(data.duration,15,data.duration);
    let blockSchedule = isEmpty(data.blockSchedule,[],data.blockSchedule);
    let isCurrent = isEmpty(data.isCurrent,false,data.isCurrent);
    let date = isEmpty(data.date,null,data.date);
    let next = isEmpty(data.next,null,data.next);
    let withDate = isEmpty(data.withDate,false,data.withDate);
    let isNotRailwayTime = isEmpty(data.isNotRailwayTime,false,data.isNotRailwayTime);
    let is12Hour =["AM","PM"];
    let isHour = opentimes.split(" ");
    let is24Hour = isHour.length > 0 && is12Hour.includes(is12Hour[1]) ? true:false;

    if (isEmpty(opentimes) || isEmpty(closetimes)) {
      console.error("startToEndTimeSlot Error => starting_time",opentimes,"ending_time",closetimes,"obj",data);
      return;
    }
    var opentime_s = is24Hour ? moment(opentimes, "h:mm A").format("HH:mm"):moment(opentimes, "H:mm").format("HH:mm");

    if (closetimes == "12:00 AM") {
      var closetime_s = "12:00";
    } else {
      var closetime_s = is24Hour ? moment(closetimes, "h:mm A").format("HH:mm"):moment(opentimes, "H:mm").format("HH:mm");
    }

    let TimeSlot = timeSlot({
      duration,
      date,
      next,
      isCurrent,
      withDate,
      starting_time:opentime_s,
      ending_time:closetime_s,
    });
  
    var Solt = [];
    date=date??new Date;
    for (let i = 0; i <= TimeSlot.length; i++) {
      const from = TimeSlot[i] ?? null;
      const to = TimeSlot[i + 1] ?? null;
      let start;
      let end;

      if (from != null && to != null) {
        if(isNotRailwayTime){
          start=railwayToNormalTimeConvert(from);
          end=railwayToNormalTimeConvert(to);
          var slot =
          start + " - " + end;
        }else{
          start=from;
          end=to;
          var slot =
          start + " - " + end;
        }
        let tsl =isEmpty(data.startToEndObj,withDate ?{ slot }:{ slot,date},withDate ?{ start,end }:{ start,end,date}) ;
        Solt.push(tsl);
      }
    }
    const Slots =Solt;
    // const Slots = Solt.reduce((unique, o) => {
    //   if (!unique.some((obj) => obj.slot === o.slot)) {
    //     unique.push(o);
    //   }
    //   return unique;
    // }, []);

    for (const item of blockSchedule) {
      for (const iterator of Slots) {
        if (item.slot == iterator.slot) {
          Slots.splice(Slots.indexOf(iterator), 1);
        }
      }
    }
    return Slots;
  }

  function timeSlot(x={}) {
    // console.log("x", x);
    let starting_time =
      x?.starting_time?.length > 8 ? x.starting_time.substring(11, 16) : x.starting_time;
    // starting_time = "15:00";
    let ending_time =
      x?.ending_time?.length > 8 ? x.ending_time.substring(11, 16) : x.ending_time;
    let isCurrent = isEmpty(x.isCurrent,false,x.isCurrent);
    let next = isEmpty(x.next);
    let isNotRailwayTime = isEmpty(x.isNotRailwayTime);
    let blockSchedule = isEmpty(x.blockSchedule,[],x.blockSchedule);
    let dCheck =true;

    let currenDate = moment().format("YYYY-MM-DD");
    let dateCheck = isEmpty(x.date,currenDate,x.date);

    let startTime = moment(starting_time, "HH:mm");
  
    let endTime = moment(ending_time, "HH:mm");
  
    let allTimes = [];
  
    // console.log("startTime", starting_time);
    // console.log("endTime", ending_time);
  
    if (startTime > endTime) {
      let endTime = moment(ending_time, "HH:mm").add(1, "days");
      while (startTime <= endTime) {
        //Push times
        let stime = isNotRailwayTime ? startTime.format("HH:mm"):startTime.format("hh:mm A");
        if (!blockSchedule.includes(stime)) {
          allTimes.push(stime);
        }
        //Add duration of 30 minutes
        startTime.add(x.duration, "minutes");
      }
    } else {
      while (startTime <= endTime) {
        let stime = isNotRailwayTime ? startTime.format("HH:mm"):startTime.format("hh:mm A");
        if (!blockSchedule.includes(stime)) {
          allTimes.push(stime);
        }
        startTime.add(x.duration, "minutes");
      }
    }
    //console.log("allTimes", allTimes);
    
    // return allTimes;
    
    return allTimes.filter((i)=>{
      if (isCurrent && moment(dateCheck).format("YYYY-MM-DD") === currenDate) {
        dCheck=next ? moment(i, "HH:mm")  >= moment(new Date, "HH:mm") : moment(i, "HH:mm")  > moment(new Date, "HH:mm");
      }
      if(dCheck){
        return i;
      }
    });
  }
  function railwayToNormalTimeConvert(time) {
    // Check correct time format and split into components
    time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [
      time,
    ]; 
    if (time.length > 1) {
      // If time format correct
      time = time.slice(1); // Remove full string match value
      time[5] = +time[0] < 12 ? " AM" : " PM"; // Set AM/PM
      time[0] = +time[0] % 12 || 12; // Adjust hours
    }
    return time.join("").padStart(8,"0"); // return adjusted time or original string
  }
  function normalToRalwayTimeConvert(timeStr) {
    return moment(timeStr, ["h:mm A"]).format("HH:mm");
  }
  function formatTimeIn24Hour(timeStr) {
    let check = timeStr.split(" ");
    if ((check.includes("AM") || check.includes("PM")) === false)
      return console.log("Format time string to be in the form of HH:MM AM/PM");
    const date = new Date("2000-01-01 " + timeStr); // Use a common date to ensure consistent time parsing
  
    // Extract hours and minutes from the Date object
    const hours = date.getHours();
    const minutes = date.getMinutes();
  
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }
  function isEmpty(data,resend=true,resendF=false,){
      if (data != undefined && data != null && data != "") return resendF;
      return resend;
  }

module.exports ={
    startToEndTimeSlot,
    railwayToNormalTimeConvert,
    timeSlot,
    normalToRalwayTimeConvert,
    formatTimeIn24Hour
}