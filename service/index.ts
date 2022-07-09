import { PhoneNumber, parsePhoneNumber } from "awesome-phonenumber";

class Money {
  private _currency: "KES";
  private _amount: number;

  constructor(amount: number) {
    if (typeof amount !== "number") {
      throw new Error("Amount must be a valid number");
    }
    if (amount < 0) {
      throw new Error("Amount must be a positive number");
    }
    this._amount = amount;
  }

  get amount() {
    return this._amount;
  }

  get currency() {
    return this._currency;
  }

  add(money: Money) {}

  deduct(money: Money) {}
}

class NoDrawBet {
  private _condition: string;
  private _settlementDate: Date;
  private _amount: Money;
  private isSettled: boolean;


  constructor(condition: string) {
    this._condition = condition;
  }

  set amount(amount: number) {
    this._amount = new Money(amount);
  }

  settle() {}
}

class Fanatic {
  private _nickname: string;
  private _mobile: PhoneNumber;

  constructor(name: string, mobile: string) {
    this._nickname = "name";
    this._mobile = parsePhoneNumber(mobile, "KE");
  }
}

class Proposer extends Fanatic {
  constructor(name: string, mobile: string) {
    super(name, mobile);
  }

  propose(bet: NoDrawBet) {

  }

  commit() {
    
  }

  invite() {
    
  }
}

class Opposer extends Fanatic {}
