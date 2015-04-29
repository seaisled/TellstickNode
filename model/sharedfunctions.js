function DateAdd (ItemType, DateToWorkOn, ValueToBeAdded) {
			switch (ItemType)
			{
				//date portion         
				case 'd': //add days
					DateToWorkOn.setDate(DateToWorkOn.getDate() + ValueToBeAdded)
					break;
				case 'm': //add months
					DateToWorkOn.setMonth(DateToWorkOn.getMonth() + ValueToBeAdded)
					break;
				case 'y': //add years
					DateToWorkOn.setYear(DateToWorkOn.getFullYear() + ValueToBeAdded)
					break;
				//time portion         
				case 'h': //add days
					DateToWorkOn.setHours(DateToWorkOn.getHours() + ValueToBeAdded)
					break;
				case 'n': //add minutes
					DateToWorkOn.setMinutes(DateToWorkOn.getMinutes() + ValueToBeAdded)
					break;
				case 's': //add seconds
					DateToWorkOn.setSeconds(DateToWorkOn.getSeconds() + ValueToBeAdded)
					break;
			}
			return DateToWorkOn;
		}
		
		
function dynamicSortMultiple() {
			/*
		 * save the arguments object as it will be overwritten
		 * note that arguments object is an array-like object
		 * consisting of the names of the properties to sort by
		 */
		var props = arguments;
		return function (obj1, obj2) {
			var i = 0, result = 0, numberOfProperties = props.length;
			/* try getting a different result from 0 (equal)
			 * as long as we have extra properties to compare
			 */
			while(result === 0 && i < numberOfProperties) {
				result = dynamicSort(props[i])(obj1, obj2);
				i++;
			}
			return result;
		}
	}
	
	
function dynamicSort (property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}	

function log (message) {
    if (variables.log.length > 100) {
        variables.log.shift();   
    }
    
    var timestamp_start = new Date();
	var hour = '0' + timestamp_start.getHours();
	var minutes = '0' + timestamp_start.getMinutes();
    var seconds = '0' + timestamp_start.getSeconds();
	hour = hour.substr(hour.length-2);
	minutes = minutes.substr(minutes.length-2);
    seconds = seconds.substr(seconds.length-2);
    
    variables.log.push({time: hour + ':' + minutes + ':' + seconds,message: message});
}


exports.DateAdd = DateAdd;
exports.dynamicSortMultiple = dynamicSortMultiple;
exports.dynamicSort = dynamicSort;
exports.log = log;