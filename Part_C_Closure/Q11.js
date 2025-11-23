function createWallet(){
    let balance=0;

    function addMoney(amount){
        balance=balance+amount;
    }
    function checkBalance(){
        console.log(balance);
    }
    return{
        addMoney, checkBalance
    }
}

let myWallet = createWallet();
myWallet.addMoney(500);
myWallet.addMoney(200);
myWallet.checkBalance();  
