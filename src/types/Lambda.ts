import Env from '../Env';
import toPrimitive from "../printer";

export default class Lambda {
  public args: any[];
  public body: any[];
  public env: Env;

  constructor(args: any[], body: any[], env: Env) {
    this.args = args;
    this.body = body;
    this.env = env;
  }

  public toString() {
    return toPrimitive(this);
  }
}