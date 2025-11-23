let nums = [10, 3, 7, 20, 13, 2];
///map 
let squares = nums.map((n) => n*n);
console.log("Squares:", squares)

///filter
let isPrime=(num)=> {
    if(num<2)
        return false;
    for(let i=2;i<=Math.sqrt(num); i++)
    {
        if(num%i==0)
            return false;
    }
    return true;
}
let primes = nums.filter(isPrime);
console.log("Prime Numbers:", primes)

///reduce
let sum=nums.reduce((acc, curr)=>acc+curr,0);
console.log("Sum:", sum)

///sort
let order=[...nums].sort((a,b)=>b-1);
console.log("Descending order:" ,order);