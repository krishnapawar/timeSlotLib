### date-time-slots (timeSlot) Library Overview:

>`date-time-slots` (timeSlot) is a user-friendly JavaScript library for Node.js that simplifies the handling of time slots in projects. It provides easy-to-use methods to convert, manipulate, and generate time slots. Here's a quick rundown:
This library aims to make working with time slots in Node.js projects straightforward and efficient. Developers can easily integrate it into their applications for effective time management.

### install package
```shh
npm i date-time-slots
```
```shh 
const {startToEndTimeSlot,normalToRalwayTimeConvert,railwayToNormalTimeConvert,formatTimeIn24Hour, timeSlot} = require("date-time-slots");
```
### OR

```shh
npm i @krishnapawar/date-time-slots
```
```shh 
const {startToEndTimeSlot,normalToRalwayTimeConvert,railwayToNormalTimeConvert,formatTimeIn24Hour, timeSlot} = require("@krishnapawar/date-time-slots");
```


1 Time Conversion:

 * `railwayToNormalTimeConvert` and `formatTimeIn24Hour` convert railway time to normal time and vice versa.
 *  `normalToRailwayTimeConvert` changes normal time to railway time.

```javaScript
railwayToNormalTimeConvert("13:00");
formatTimeIn24Hour("13:00");
normalToRailwayTimeConvert("01:00 AM");
```
### Examples.

>railwayToNormalTimeConvert method covert railway time into normal time example
```javaScript

    railwayToNormalTimeConvert("13:00");
```
>we can also use same as formatTimeIn24Hour method covert railway time into normal time example
```javaScript

    formatTimeIn24Hour("13:00");
```

>also apposite method same as normalToRalwayTimeConvert method covert normal time into railway time example
```javaScript

    normalToRalwayTimeConvert("01:00 AM");
```
2 Generating Time Slots:

* `timeSlot` generates an array of time slots based on provided start and end times.
You can customize the duration and format of the slots.
```javaScript
let slots = timeSlot({ starting_time: '12:00', ending_time: '17:00', duration: 15 });
```
* Additional options include handling current time, specific dates, and blocking slots.
```javaScript
let slots = timeSlot({ isCurrent: true, date: "2023-11-05", starting_time: '12:00', ending_time: '17:00' });
```

>timeSlot method covert into simple time slot it take three argument in json starting_time,ending_time,and duration, and it give output in array example ['12:00','12:15','12:30','12:45','01:00','01:15']
> example paylode `{ duration:15, date: "2023-11-05"T10:13:02.481Z, isCurrent: true,  starting_time: '12:00', ending_time: '17:00' } `
```javaScript

    let data = timeSlot({starting_time: '12:00', ending_time: '17:00' } );
```
>we can pass time as 12 hour format or 24 format is this method it give as same output.
```javaScript

    let data = timeSlot({starting_time: '11:00 PM', ending_time: '01:00 AM' } );
```
>If we want check time with current time and show only remening slot only. then we have to use keyword (`isCurrent:true`) in this object.
```javaScript

    let data = timeSlot({ isCurrent: true,  starting_time: '12:00', ending_time: '17:00' } );

```
>If we want check time with current time and current date then we have to pass date as well in the object with `{
    date:"2023-10-04",
    isCurrent:true
} `and it show only remening slot only in current.
```javaScript

    let data = timeSlot({ date: "2023-11-05", isCurrent: true,  starting_time: '12:00', ending_time: '17:00' } );

```
>By default It make 15 minuts time slot If you want to change time slot duration you can chang using keyword => `duration:30`,

```javaScript

    let data = timeSlot({ duration: 15, date: "2023-11-05", isCurrent: true,  starting_time: '12:00', ending_time: '17:00' } );
```
>If you want show slot current time to next slot then use keyword `next:true`.
```javaScript

    let data = timeSlot({ 
        duration: 15, 
        date: "2023-11-05", 
        isCurrent: true,  
        starting_time: '12:00', 
        ending_time: '17:00', 
        next:true 
        } );
```
>if you want slot in 24 hour time you can use keyword =>`isNotRailwayTime:true`, It give you time slot in 24 hour time.
```javaScript

    let data = timeSlot({ 
        duration: 15, 
        date: "2023-11-05", 
        isCurrent: true,  
        starting_time: '12:00', 
        ending_time: '17:00', 
        next:true,
        isNotRailwayTime:true, 
        } );
```
>If you want to block time slot with pertitucler date we have to use =>
`blockSchedule:[
            // "12:15 PM",
            // "12:30 PM",
            // "12:45 PM",
            "12:00",
            "14:00",
            ]` 
with array object with block slot and date with keyword =>`date:"2023-10-04"`. exmaple 
```javaScript

    let data = timeSlot({ 
        duration: 15, 
        date: "2023-11-05", 
        isCurrent: true,  
        starting_time: '12:00', 
        ending_time: '17:00', 
        next:true,
        isNotRailwayTime:true,
        blockSchedule:[
            // "12:15 PM",
            // "12:30 PM",
            // "12:45 PM",
            "12:00",
            "14:00",
        ]  
        } );
```
3 Pair of Time Slots:

* startToEndTimeSlot generates pairs of start and end times based on given parameters.
Similar customization options are available.
```javaScript
let timePairs = startToEndTimeSlot("11:00 PM", "01:00 AM", { isCurrent: true, date: "2023-10-04" });
```

* `startToEndTimeSlot` method covert into pair of time slot in object format. it take three argument in `startToEndTimeSlot()` method, `starting_time,ending_time,` and `object,` and object is optional. we can pass time as 12 hour format or 24 format is this method it give as same output.
exmaple given below.
>12 hour format

```javaScript

let data =startToEndTimeSlot("11:00 PM","01:00 AM");

```
>24 hour format
```javaScript

let data =startToEndTimeSlot("11:00","'17:00'");

```
* If we want check time with current time and show only remening slot only. then we have to use keyword (isCurrent:true) in this object.
```javaScript

let data =startToEndTimeSlot("11:00 PM","01:00 AM",{
    isCurrent:true
});

```
* If we want check time with current time and current date then we have to pass date as well in the object with `{
    date:"2023-10-04",
    isCurrent:true
}` and it show only remening slot only in current.
```javaScript

let data =startToEndTimeSlot("11:00 PM","01:00 AM",{
    date:"2023-10-04",
    isCurrent:true
});
```
* If you want to block time slot with pertitucler date we have to use =>`blockSchedule:[{"slot": "9:15 PM - 9:30 PM"}]` with array object with block slot and date with keyword =>date:"2023-10-04". exmaple 
```javaScript

let data =startToEndTimeSlot("11:00 PM","01:00 AM",{
        blockSchedule:[
                {
                    "slot": "9:15 PM - 9:30 PM"
                },
                {
                    "slot": "9:45 PM - 10:00 PM"
                }
            ],
        date:"2023-10-04",
        isCurrent:true
    });
```
* By default It make 15 minuts time slot If you want to change time slot duration you can chang using keyword => `duration:30`,
```javaScript

let data =startToEndTimeSlot("11:00 PM","01:00 AM",{
        blockSchedule:[
                {
                    "slot": "9:15 PM - 9:30 PM"
                },
                {
                    "slot": "9:45 PM - 10:00 PM"
                }
            ],
        date:"2023-10-04",
        isCurrent:true,
        duration:30,
    });
```
* if you want slot in 24 hour time you can use keyword =>`isNotRailwayTime:true`, It give you time slot in 24 hour time.
```javaScript

let data =startToEndTimeSlot("11:00 PM","01:00 AM",{
        blockSchedule:[
                {
                    "slot": "9:15 PM - 9:30 PM"
                },
                {
                    "slot": "9:45 PM - 10:00 PM"
                }
            ],
        date:"2023-10-04",
        isCurrent:true,
        duration:30,
        isNotRailwayTime:true,
    });
```
* If you want date with slot you can use key word =>`withDate:true`,
```javaScript

let data =startToEndTimeSlot("11:00 PM","01:00 AM",{
        blockSchedule:[
                {
                    "slot": "9:15 PM - 9:30 PM"
                },
                {
                    "slot": "9:45 PM - 10:00 PM"
                }
            ],
        date:"2023-10-04",
        isCurrent:true,
        withDate:true,
        duration:30,
        isNotRailwayTime:true,
    });
```
* If we want response in start,end in form of keys and values object. then we have to use keyword =>`startToEndObj:true`,
```javaScript

let data =startToEndTimeSlot("11:00 PM","01:00 AM",{
        blockSchedule:[
                {
                    "start": "10:45",
                    "end": "11:00",
                    "date": "2023-11-13"
                },
                {
                    "start": "11:00",
                    "end": "11:15",
                    "date": "2023-11-13"
                }
            ],
        date:"2023-11-13",
        isCurrent:true,
        withDate:true,
        duration:30,
        isNotRailwayTime:true,
        startToEndObj:true,
    });
```