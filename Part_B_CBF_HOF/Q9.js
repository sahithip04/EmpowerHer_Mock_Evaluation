function  displayCar(){
    console.log("Car is Selected");
}
function displayTruck(){
    console.log("Truck is selected");
}
function displayBike(){
    console.log("Bike is selected")
}
function vehicleInfo(vehicleCategory, callbackFn){
    console.log("Vehicle Category:" , vehicleCategory);
    callbackFn();
}
vehicleInfo("Car", displayCar);
vehicleInfo("Truck", displayTruck);
vehicleInfo("Bike", displayBike);

